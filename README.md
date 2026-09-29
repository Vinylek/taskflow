# TaskFlow

Gestionnaire de tâches collaboratif — API REST Express + front-end vanilla JS.

![Node](https://img.shields.io/badge/node-%3E%3D24-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-8-DC382D?logo=redis&logoColor=white)
![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4)

## Sommaire

- [Prérequis](#prérequis)
- [Démarrage rapide](#démarrage-rapide)
  - [Option A — Dev container (recommandé)](#option-a--dev-container-recommandé)
  - [Option B — Installation locale](#option-b--installation-locale)
- [Configuration](#configuration)
- [Infrastructure (Docker Compose)](#infrastructure-docker-compose)
- [Scripts npm](#scripts-npm)
- [API](#api)
- [Image Docker](#image-docker)
- [Structure du projet](#structure-du-projet)
- [Qualité de code](#qualité-de-code)
- [Intégration continue](#intégration-continue)
- [Contribuer](#contribuer)
- [Dépannage](#dépannage)

## Prérequis

**Avec le dev container** (option A) : uniquement [Docker](https://docs.docker.com/get-docker/) et [VS Code](https://code.visualstudio.com/) avec l'extension [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers). Node, npm, gh et les extensions sont fournis par le conteneur.

**En installation locale** (option B) :

| Outil                                             | Version | Vérification             |
| ------------------------------------------------- | ------- | ------------------------ |
| [Node.js](https://nodejs.org/)                    | ≥ 24    | `node -v`                |
| npm                                               | ≥ 11    | `npm -v`                 |
| [Docker](https://docs.docker.com/get-docker/)     | ≥ 24    | `docker --version`       |
| Docker Compose                                    | v2+     | `docker compose version` |
| [nvm](https://github.com/nvm-sh/nvm) (recommandé) | —       | `nvm --version`          |

La version de Node est figée dans `.nvmrc` ; `npm install` échoue volontairement si elle ne correspond pas (`engine-strict`).

## Démarrage rapide

### Option A — Dev container (recommandé)

```bash
git clone https://github.com/Vinylek/taskflow.git
cd taskflow
cp .env.example .env    # puis éditer .env (SECRET_KEY, POSTGRES_PASSWORD…)
code .
```

Dans VS Code : **« Reopen in Container »** (ou `F1` → _Dev Containers: Reopen in Container_). Au premier lancement, VS Code :

1. démarre les services `app` (Node 24), `db` (PostgreSQL) et `cache` (Redis) via Docker Compose ;
2. ouvre le projet **dans** le conteneur `app` ;
3. exécute `npm ci` (dépendances + hooks Git) ;
4. installe les extensions ESLint, Prettier, EditorConfig et active le formatage à l'enregistrement.

Il ne reste qu'à lancer, dans le terminal intégré :

```bash
npm run dev
```

Le port 3000 est redirigé automatiquement vers <http://localhost:3000>.

> Dans le conteneur, PostgreSQL et Redis sont joints par leur nom de service (`db`, `cache`) : `POSTGRES_HOST` et `REDIS_URL` sont surchargés par [`.devcontainer/compose.dev.yaml`](.devcontainer/compose.dev.yaml), inutile de modifier `.env`. Ne pas lancer `npm run infra:*` depuis le conteneur : l'infra est déjà gérée par le dev container.

Sans VS Code, le [CLI Dev Containers](https://github.com/devcontainers/cli) fonctionne aussi :

```bash
npx @devcontainers/cli up --workspace-folder .
npx @devcontainers/cli exec --workspace-folder . npm run dev
```

### Option B — Installation locale

```bash
git clone https://github.com/Vinylek/taskflow.git
cd taskflow

nvm use                 # utilise la version de Node du projet
npm ci                  # installe les dépendances exactes du lockfile
cp .env.example .env    # puis éditer .env (SECRET_KEY, POSTGRES_PASSWORD…)

npm run infra:up        # démarre PostgreSQL + Redis et attend qu'ils soient prêts
npm run dev             # lance l'application en mode watch
```

L'application est disponible sur <http://localhost:3000>.

## Configuration

Toute la configuration passe par des **variables d'environnement**, lues depuis `.env` (jamais commité) et centralisées dans [`src/config.js`](src/config.js). L'application refuse de démarrer si une variable obligatoire manque.

| Variable            | Obligatoire | Défaut                   | Description                                        |
| ------------------- | :---------: | ------------------------ | -------------------------------------------------- |
| `NODE_ENV`          |             | `development`            | Environnement d'exécution                          |
| `PORT`              |             | `3000`                   | Port HTTP de l'application                         |
| `SECRET_KEY`        |     ✅      | —                        | Clé secrète applicative (`openssl rand -hex 32`)   |
| `POSTGRES_HOST`     |             | `localhost`              | Hôte PostgreSQL                                    |
| `POSTGRES_PORT`     |             | `5432`                   | Port PostgreSQL (aussi utilisé par Docker Compose) |
| `POSTGRES_USER`     |     ✅      | —                        | Utilisateur PostgreSQL                             |
| `POSTGRES_PASSWORD` |     ✅      | —                        | Mot de passe PostgreSQL                            |
| `POSTGRES_DB`       |     ✅      | —                        | Nom de la base                                     |
| `REDIS_PORT`        |             | `6379`                   | Port Redis exposé par Docker Compose               |
| `REDIS_URL`         |             | `redis://localhost:6379` | URL de connexion Redis                             |

Le même fichier `.env` est lu par l'application **et** par Docker Compose : une seule source de vérité.

## Infrastructure (Docker Compose)

Définie dans [`compose.yaml`](compose.yaml) :

| Service | Image                | Port local       | Volume      |
| ------- | -------------------- | ---------------- | ----------- |
| `db`    | `postgres:18-alpine` | `127.0.0.1:5432` | `pgdata`    |
| `cache` | `redis:8-alpine`     | `127.0.0.1:6379` | `redisdata` |

- Les ports ne sont exposés que sur `127.0.0.1` (pas accessibles depuis le réseau).
- Chaque service a un **healthcheck** ; `npm run infra:up` attend qu'ils soient sains.
- Au **premier démarrage** (volume vide), PostgreSQL exécute les scripts de [`db/init/`](db/init) par ordre alphabétique :
  - `01-schema.sql` — création de la table `tasks`
  - `02-seed.sql` — données de démonstration

Pour rejouer les scripts après une modification du schéma : `npm run db:reset` (⚠️ supprime les données).

## Scripts npm

| Commande                | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| `npm start`             | Lance l'application                                  |
| `npm run dev`           | Lance l'application en mode watch (redémarrage auto) |
| `npm run lint`          | Analyse le code avec ESLint                          |
| `npm run lint:fix`      | Corrige automatiquement les problèmes ESLint         |
| `npm run format`        | Formate le code avec Prettier                        |
| `npm run format:check`  | Vérifie le formatage sans modifier (CI)              |
| `npm test`              | Lance les tests (`node:test` + supertest)            |
| `npm run test:coverage` | Lance les tests avec le rapport de couverture        |
| `npm run test:ci`       | Tests + rapports JUnit et lcov dans `coverage/` (CI) |
| `npm run infra:up`      | Démarre PostgreSQL + Redis                           |
| `npm run infra:down`    | Arrête les conteneurs (données conservées)           |
| `npm run infra:logs`    | Affiche les logs des conteneurs                      |
| `npm run db:psql`       | Ouvre un shell `psql` dans la base                   |
| `npm run db:reset`      | Supprime les volumes et réinitialise la base         |

## API

| Méthode  | Route            | Description                                    |
| -------- | ---------------- | ---------------------------------------------- |
| `GET`    | `/health`        | Sonde de santé (`{"status":"ok"}`)             |
| `GET`    | `/api/tasks`     | Liste les tâches (filtres : `?status=`, `?q=`) |
| `GET`    | `/api/tasks/:id` | Détail d'une tâche                             |
| `POST`   | `/api/tasks`     | Crée une tâche (`title` obligatoire)           |
| `PATCH`  | `/api/tasks/:id` | Modifie `title`, `description` ou `status`     |
| `DELETE` | `/api/tasks/:id` | Supprime une tâche                             |
| `GET`    | `/search?q=`     | Page HTML de recherche                         |

Statuts valides : `todo`, `in-progress`, `done`.

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title": "Ma tâche", "owner": "alice"}'
```

> ℹ️ Les tâches sont pour l'instant stockées **en mémoire** ; la bascule vers PostgreSQL est prévue.

## Image Docker

Le `Dockerfile` est **multi-stage** :

| Étape     | Contenu                                                             |
| --------- | ------------------------------------------------------------------- |
| `base`    | `node:24-alpine` + `package.json` / `package-lock.json`             |
| `deps`    | Dépendances de production uniquement (`npm ci --omit=dev`)          |
| `test`    | Toutes les dépendances, puis lint + tests (build cassé si échec)    |
| `runtime` | Image finale : code + dépendances de prod, user `node`, healthcheck |

```bash
docker build --target test -t taskflow:test .   # vérifier lint + tests dans Docker
docker build -t taskflow .                      # image de production
docker run --rm -p 3000:3000 --env-file .env taskflow
```

L'image est publiée automatiquement par la CI sur `ghcr.io` à chaque merge sur `main`.

## Structure du projet

```
taskflow/
├── .devcontainer/
│   ├── devcontainer.json # Dev container (VS Code / CLI)
│   └── compose.dev.yaml  # Service "app" ajouté à l'infra pour le dev container
├── db/init/              # Scripts SQL exécutés au 1er démarrage de PostgreSQL
├── public/               # Front-end statique (HTML, CSS, JS)
├── src/
│   └── config.js         # Configuration centralisée (variables d'environnement)
├── test/                 # Tests d'API (node:test + supertest)
├── .github/workflows/    # Pipeline CI GitHub Actions
├── Dockerfile            # Image de production multi-stage
├── server.js             # Point d'entrée Express
├── compose.yaml          # Infrastructure locale (PostgreSQL + Redis)
├── .env.example          # Modèle de configuration
├── eslint.config.js      # Règles ESLint
├── .prettierrc.json      # Style Prettier
├── .editorconfig         # Conventions d'éditeur
├── .gitattributes        # Fins de ligne LF forcées dans Git
├── .nvmrc                # Version de Node
├── commitlint.config.js  # Règles des messages de commit
└── .husky/               # Hooks Git : pre-commit, commit-msg, pre-push
```

## Qualité de code

- **ESLint** détecte les erreurs et mauvaises pratiques (configs distinctes Node / navigateur).
- **Prettier** garantit un formatage uniforme.
- **EditorConfig** harmonise indentation et fins de ligne entre éditeurs.
- **Husky + lint-staged** exécutent ESLint et Prettier sur les fichiers modifiés **à chaque commit** ; un commit non conforme est bloqué.
- **commitlint** (hook `commit-msg`) refuse les messages qui ne respectent pas [Conventional Commits](https://www.conventionalcommits.org/fr/).
- Le hook **`pre-push`** lance `npm test` : impossible de pousser du code dont les tests échouent.

Extensions VS Code recommandées (proposées à l'ouverture du projet) : ESLint, Prettier, EditorConfig.

## Intégration continue

Le workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) tourne à chaque Pull Request et à chaque push sur `main` :

1. **Lint & format** : ESLint + Prettier.
2. **Tests & coverage** : `npm run test:ci` ; les rapports (JUnit, lcov) sont conservés 90 jours en artifact `test-reports`.
3. **Docker** (si 1 et 2 passent) : build de l'image, smoke test sur `/health`, puis publication sur `ghcr.io` (uniquement sur `main`).

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Dépannage

| Problème                                                | Solution                                                                           |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `Variable d'environnement manquante : …`                | Créer/compléter `.env` à partir de `.env.example`                                  |
| `npm ERR! code EBADENGINE`                              | Mauvaise version de Node : `nvm install && nvm use`                                |
| `port is already allocated` (5432/6379)                 | Un service local utilise le port : changer `POSTGRES_PORT`/`REDIS_PORT`            |
| Modifs de `db/init/*.sql` non prises en compte          | Les scripts ne tournent que sur un volume vide : `npm run db:reset`                |
| Le hook pre-commit ne se lance pas                      | Réinstaller les hooks : `npm install` (script `prepare`)                           |
| Dev container : `.env` introuvable / variable manquante | Créer `.env` à la racine **avant** d'ouvrir le conteneur, puis _Rebuild Container_ |
| Dev container : modifs de `devcontainer.json` ignorées  | `F1` → _Dev Containers: Rebuild Container_                                         |
