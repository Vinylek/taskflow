# Sécurité de TaskFlow

## Signaler une vulnérabilité

Ne pas ouvrir d'issue publique : contacter directement le mainteneur du dépôt.

## Contrôles automatisés (CI)

| Contrôle          | Outil                                                  | Échoue si…                                                       |
| ----------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| SAST              | ESLint + `eslint-plugin-security`                      | un pattern dangereux est détecté (0 warning toléré)              |
| XSS côté front    | règle ESLint `no-restricted-properties`                | `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` |
| Tests de sécurité | `test/security.test.js`                                | en-têtes absents, XSS non échappé, entrée invalide acceptée      |
| Dépendances       | `npm audit --audit-level=high`, `npm audit signatures` | vulnérabilité high/critical, paquet non signé                    |
| Secrets           | gitleaks (tout l'historique Git)                       | un secret est présent dans un commit                             |
| En-têtes HTTP     | `curl -sI` dans la CI                                  | CSP, `X-Content-Type-Options` ou `X-Frame-Options` absent        |
| DAST              | OWASP ZAP (scan actif)                                 | une alerte est levée ; une issue GitHub est ouverte              |
| Mises à jour      | Dependabot (npm, GitHub Actions, Docker)               | —                                                                |

## Audit initial et corrections

| Vulnérabilité                         | Où                            | Détectée par          | Correction                                                |
| ------------------------------------- | ----------------------------- | --------------------- | --------------------------------------------------------- |
| XSS réfléchi                          | `GET /search?q=`              | ZAP (scan actif)      | Échappement HTML (`src/html.js`)                          |
| XSS stocké                            | `public/app.js` (`innerHTML`) | ESLint, ZAP (DOM XSS) | Rendu avec `createElement` + `textContent`                |
| En-têtes de sécurité absents (CSP…)   | toutes les réponses           | ZAP (baseline)        | `helmet` avec une CSP stricte (`'self'` uniquement)       |
| Fuite de technologie (`X-Powered-By`) | toutes les réponses           | ZAP (baseline)        | supprimé par `helmet`                                     |
| Entrées non validées (type, longueur) | `POST` / `PATCH` / `GET ?q=`  | revue de code         | `src/validation.js` : types, longueurs, statuts autorisés |
| Crash sur `?q=a&q=b` (tableau)        | `GET /api/tasks`, `/search`   | revue de code         | `q` doit être une chaîne                                  |
| Stack trace renvoyée au client        | JSON malformé                 | revue de code         | gestionnaire d'erreurs générique                          |
| Body de taille illimitée              | `express.json()`              | revue de code         | limite de 10 ko                                           |

Résultat ZAP : 9 alertes (dont XSS réfléchi et DOM XSS) avant corrections, 0 après.

## Risques connus (non traités)

- **Broken Access Control** : l'application n'a pas encore d'authentification. N'importe qui peut
  lire, modifier ou supprimer n'importe quelle tâche, et le champ `owner` est choisi par le client.
  À traiter avec l'authentification (JWT) : l'`owner` devra être imposé par le serveur à partir de
  l'utilisateur connecté, et chaque route devra vérifier que la tâche lui appartient.
- **Pas de limitation de débit** (rate limiting) sur l'API.
- La CSP contient `upgrade-insecure-requests` : l'application doit être servie en HTTPS en dehors de
  `localhost`.
