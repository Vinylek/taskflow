const express = require('express');
const app = express();

const PORT = 3000;

const SECRET_KEY = 'ma-super-cle-secrete-2026';

app.use(express.json());
app.use(express.static('public'));

// ──────────────────────────────────────────────
// Base de données en mémoire (sera remplacée par PostgreSQL)
// ──────────────────────────────────────────────
let tasks = [
  { id: '1', title: 'Configurer l\'environnement de dev', description: 'Mettre en place Docker, ESLint, Prettier', status: 'done', owner: 'alice', createdAt: '2026-09-01T08:00:00Z' },
  { id: '2', title: 'Implémenter l\'authentification', description: 'JWT + bcrypt pour le login', status: 'in-progress', owner: 'bob', createdAt: '2026-09-02T10:00:00Z' },
  { id: '3', title: 'Écrire les tests unitaires', description: 'Couvrir les services avec Jest', status: 'todo', owner: 'alice', createdAt: '2026-09-03T09:00:00Z' },
];

let nextId = 4;


app.get('/api/tasks', (req, res) => {
  const { status, q } = req.query;

  let result = [...tasks];

  if (status) {
    result = result.filter(t => t.status === status);
  }

  if (q) {
    result = result.filter(t =>
      t.title.toLowerCase().includes(q.toLowerCase()) ||
      t.description.toLowerCase().includes(q.toLowerCase())
    );
  }

  res.json(result);
});

app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Tâche non trouvée' });
  }
  res.json(task);
});

// POST /api/tasks — créer une tâche
app.post('/api/tasks', (req, res) => {
  const { title, description, owner } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Le titre est obligatoire' });
  }

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
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Tâche non trouvée' });
  }

  const { status, title, description } = req.body;

  const validStatuses = ['todo', 'in-progress', 'done'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide. Valeurs acceptées : todo, in-progress, done' });
  }

  if (status) task.status = status;
  if (title) task.title = title;
  if (description !== undefined) task.description = description;

  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const index = tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Tâche non trouvée' });
  }
  const deleted = tasks.splice(index, 1)[0];
  res.json({ message: 'Tâche supprimée', task: deleted });
});

app.get('/search', (req, res) => {
  const q = req.query.q || '';
  const results = tasks.filter(t =>
    t.title.toLowerCase().includes(q.toLowerCase())
  );
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Recherche</title></head>
    <body>
      <h1>Résultats pour : ${q}</h1>
      <ul>
        ${results.map(t => `<li>${t.title} — ${t.status}</li>`).join('')}
      </ul>
      <a href="/">Retour</a>
    </body>
    </html>
  `;
  res.send(html);
});

// ──────────────────────────────────────────────
// Démarrage du serveur
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`TaskFlow démarré sur http://localhost:${PORT}`);
  console.log(`Secret : ${SECRET_KEY}`); 
});
