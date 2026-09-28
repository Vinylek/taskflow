# Contribuer à TaskFlow

## Workflow Git

1. Partir d'une branche `main` à jour :
   ```bash
   git switch main && git pull
   ```
2. Créer une branche dédiée, nommée selon son objet :
   | Préfixe     | Usage                              | Exemple                  |
   | ----------- | ---------------------------------- | ------------------------ |
   | `feat/`     | Nouvelle fonctionnalité            | `feat/auth-jwt`          |
   | `fix/`      | Correction de bug                  | `fix/patch-status`       |
   | `docs/`     | Documentation                      | `docs/api`               |
   | `chore/`    | Outillage, configuration, deps     | `chore/ci`               |
   | `refactor/` | Refactoring sans changement fonct. | `refactor/tasks-service` |
3. Commiter en petites unités cohérentes (voir ci-dessous).
4. Pousser et ouvrir une Pull Request vers `main` :
   ```bash
   git push -u origin <branche>
   gh pr create --fill
   ```
5. La PR est fusionnée après relecture. **Aucun push direct sur `main`.**

## Messages de commit

Le projet suit [Conventional Commits](https://www.conventionalcommits.org/fr/) :

```
<type>(<portée optionnelle>): <description à l'impératif>
```

Types : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`.

```
feat(tasks): ajouter le filtre par propriétaire
fix(api): renvoyer 404 quand la tâche n'existe pas
chore(deps): mettre à jour express
```

## Qualité

Avant chaque commit, le hook `pre-commit` lance automatiquement ESLint et Prettier sur les fichiers modifiés. Pour vérifier manuellement :

```bash
npm run lint
npm run format:check
```

## Secrets

- Ne **jamais** commiter `.env` ni aucun secret (clés, mots de passe, tokens).
- Toute nouvelle variable d'environnement doit être ajoutée à `.env.example` **et** documentée dans le README.
- Un secret commité par erreur doit être considéré comme compromis et **changé**, même après suppression.
