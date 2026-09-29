const express = require('express');
const helmet = require('helmet');
const config = require('./src/config');
const { escapeHtml } = require('./src/html');
const { validateCreate, validateUpdate, validateQuery } = require('./src/validation');

const app = express();

// En-têtes de sécurité (CSP, X-Frame-Options, X-Content-Type-Options, HSTS…)
// et suppression de X-Powered-By
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        // Aucun script inline ni externe : seuls les fichiers servis par l'app s'exécutent
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'font-src': ["'self'"],
        'img-src': ["'self'"],
        'form-action': ["'self'"],
      },
    },
    // L'app ne charge aucune ressource d'un autre domaine : on peut l'exiger
    crossOriginEmbedderPolicy: true,
  }),
);
// Permissions-Policy : l'app n'a besoin d'aucune API sensible du navigateur
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
// Taille de body limitée : évite l'envoi de payloads énormes
app.use(express.json({ limit: '10kb' }));
app.use(express.static('public'));

// ──────────────────────────────────────────────
// Base de données en mémoire (sera remplacée par PostgreSQL)
// ──────────────────────────────────────────────
let tasks = [
  {
    id: '1',
    title: "Configurer l'environnement de dev",
    description: 'Mettre en place Docker, ESLint, Prettier',
    status: 'done',
    owner: 'alice',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: '2',
    title: "Implémenter l'authentification",
    description: 'JWT + bcrypt pour le login',
    status: 'in-progress',
    owner: 'bob',
    createdAt: '2026-09-02T10:00:00Z',
  },
  {
    id: '3',
    title: 'Écrire les tests unitaires',
    description: 'Couvrir les services avec Jest',
    status: 'todo',
    owner: 'alice',
    createdAt: '2026-09-03T09:00:00Z',
  },
];

let nextId = 4;

// GET /health — sonde de santé (utilisée par le HEALTHCHECK Docker)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/tasks', (req, res) => {
  const { errors, value } = validateQuery(req.query);
  if (errors.length) {
    return res.status(400).json({ error: errors.join(' ; ') });
  }
  const { status, q } = value;

  let result = [...tasks];

  if (status) {
    result = result.filter((t) => t.status === status);
  }

  if (q) {
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q.toLowerCase()) ||
        t.description.toLowerCase().includes(q.toLowerCase()),
    );
  }

  res.json(result);
});

app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Tâche non trouvée' });
  }
  res.json(task);
});

// POST /api/tasks — créer une tâche
app.post('/api/tasks', (req, res) => {
  const { errors, value } = validateCreate(req.body);
  if (errors.length) {
    return res.status(400).json({ error: errors.join(' ; ') });
  }
  const { title, description, owner } = value;

  const task = {
    id: String(nextId++),
    title: title,
    description: description || '',
    status: 'todo',
    owner: owner || 'anonymous',
    createdAt: new Date().toISOString(),
  };

  tasks.push(task);
  res.status(201).json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Tâche non trouvée' });
  }

  const { errors, value } = validateUpdate(req.body);
  if (errors.length) {
    return res.status(400).json({ error: errors.join(' ; ') });
  }
  const { status, title, description } = value;

  if (status) task.status = status;
  if (title) task.title = title;
  if (description !== undefined) task.description = description;

  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const index = tasks.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Tâche non trouvée' });
  }
  const deleted = tasks.splice(index, 1)[0];
  res.json({ message: 'Tâche supprimée', task: deleted });
});

app.get('/search', (req, res) => {
  const { errors, value } = validateQuery({ q: req.query.q });
  if (errors.length) {
    return res.status(400).send('Recherche invalide');
  }
  const q = value.q || '';
  const results = tasks.filter((t) => t.title.toLowerCase().includes(q.toLowerCase()));
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Recherche</title></head>
    <body>
      <h1>Résultats pour : ${escapeHtml(q)}</h1>
      <ul>
        ${results.map((t) => `<li>${escapeHtml(t.title)} — ${escapeHtml(t.status)}</li>`).join('')}
      </ul>
      <a href="/">Retour</a>
    </body>
    </html>
  `;
  res.send(html);
});

// 404 et erreurs : réponses génériques, jamais de stack trace envoyée au client
app.use((req, res) => {
  res.status(404).json({ error: 'Ressource introuvable' });
});

// eslint-disable-next-line no-unused-vars -- Express reconnaît un error handler à ses 4 paramètres
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON invalide' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Requête trop volumineuse' });
  }
  console.error(err);
  res.status(500).json({ error: 'Erreur interne' });
});

// ──────────────────────────────────────────────
// Démarrage du serveur
// ──────────────────────────────────────────────
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`TaskFlow démarré sur http://localhost:${config.port} (${config.env})`);
  });
}

module.exports = app;
