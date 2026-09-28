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
    tasksContainer.innerHTML = `<div class="error-message">Impossible de charger les tâches : ${err.message}</div>`;
  }
}

// ── Rendu des tâches ───────────────────────────
// ⚠️ Utilise innerHTML — vulnérable au XSS stocké (pour TP sécurité)

function renderTasks(tasks) {
  if (tasks.length === 0) {
    tasksContainer.innerHTML = '<div class="empty-message">Aucune tâche trouvée</div>';
    return;
  }

  tasksContainer.innerHTML = tasks.map(task => `
    <div class="task-card" data-status="${task.status}">
      <h3>${task.title}</h3>
      <p>${task.description || 'Pas de description'}</p>
      <div class="task-meta">
        <span>${task.owner}</span>
        <span class="task-status ${task.status}">${formatStatus(task.status)}</span>
      </div>
      <div class="task-actions">
        ${task.status !== 'done' ? `<button onclick="advanceStatus('${task.id}', '${task.status}')">▶ Avancer</button>` : ''}
        <button class="delete-btn" onclick="deleteTask('${task.id}')">🗑 Supprimer</button>
      </div>
    </div>
  `).join('');
}

function formatStatus(status) {
  const labels = {
    'todo': 'À faire',
    'in-progress': 'En cours',
    'done': 'Terminée'
  };
  return labels[status] || status;
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

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.status;
    loadTasks();
  });
});

// ── Chargement initial ─────────────────────────
loadTasks();
