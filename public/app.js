// ──────────────────────────────────────────────
// TaskFlow — Front-end JavaScript
// ──────────────────────────────────────────────
const tasksContainer = document.getElementById('tasks-container');
const taskForm = document.getElementById('task-form');
const filterButtons = document.querySelectorAll('.filter-btn');

let currentFilter = '';

// ── Chargement des tâches ──────────────────────

async function loadTasks() {
  try {
    let url = '/api/tasks';
    if (currentFilter) {
      url += `?status=${currentFilter}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Erreur serveur');

    const tasks = await response.json();
    renderTasks(tasks);
  } catch (err) {
    showMessage('error-message', `Impossible de charger les tâches : ${err.message}`);
  }
}

// ── Rendu des tâches ───────────────────────────
// Construction du DOM avec createElement + textContent : les données
// utilisateur sont toujours affichées comme du texte, jamais interprétées
// comme du HTML (protection contre le XSS stocké).

const STATUSES = ['todo', 'in-progress', 'done'];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showMessage(className, text) {
  tasksContainer.replaceChildren(el('div', className, text));
}

function renderTasks(tasks) {
  if (tasks.length === 0) {
    showMessage('empty-message', 'Aucune tâche trouvée');
    return;
  }

  tasksContainer.replaceChildren(...tasks.map(renderTask));
}

function renderTask(task) {
  const card = el('div', 'task-card');
  card.dataset.status = task.status;

  const status = el('span', 'task-status', formatStatus(task.status));
  if (STATUSES.includes(task.status)) status.classList.add(task.status);

  const meta = el('div', 'task-meta');
  meta.append(el('span', null, task.owner), status);

  const actions = el('div', 'task-actions');
  if (task.status !== 'done') {
    const advanceBtn = el('button', null, '▶ Avancer');
    advanceBtn.addEventListener('click', () => advanceStatus(task.id, task.status));
    actions.append(advanceBtn);
  }
  const deleteBtn = el('button', 'delete-btn', '🗑 Supprimer');
  deleteBtn.addEventListener('click', () => deleteTask(task.id));
  actions.append(deleteBtn);

  card.append(
    el('h3', null, task.title),
    el('p', null, task.description || 'Pas de description'),
    meta,
    actions,
  );
  return card;
}

function formatStatus(status) {
  const labels = new Map([
    ['todo', 'À faire'],
    ['in-progress', 'En cours'],
    ['done', 'Terminée'],
  ]);
  return labels.get(status) || status;
}

// ── Création d'une tâche ───────────────────────

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const owner = document.getElementById('owner').value.trim();

  if (!title) return;

  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, owner }),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.error || 'Erreur de création');
      return;
    }

    taskForm.reset();
    loadTasks();
  } catch (err) {
    alert('Erreur réseau : ' + err.message);
  }
});

// ── Avancer le statut ──────────────────────────

async function advanceStatus(id, currentStatus) {
  const nextStatus = currentStatus === 'todo' ? 'in-progress' : 'done';

  try {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    loadTasks();
  } catch (err) {
    alert('Erreur : ' + err.message);
  }
}

// ── Suppression ────────────────────────────────

async function deleteTask(id) {
  if (!confirm('Supprimer cette tâche ?')) return;

  try {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    loadTasks();
  } catch (err) {
    alert('Erreur : ' + err.message);
  }
}

// ── Filtres ────────────────────────────────────

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.status;
    loadTasks();
  });
});

// ── Chargement initial ─────────────────────────
loadTasks();
