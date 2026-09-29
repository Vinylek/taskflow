// ──────────────────────────────────────────────
// Validation des entrées utilisateur
// Tout ce qui ne correspond pas au format attendu est rejeté (400).
// ──────────────────────────────────────────────

const STATUSES = ['todo', 'in-progress', 'done'];

const LIMITS = { title: 200, description: 2000, owner: 50, q: 100 };

function checkString(errors, name, value, { required = false, max } = {}) {
  if (value === undefined || value === null) {
    if (required) errors.push(`Le champ ${name} est obligatoire`);
    return undefined;
  }
  if (typeof value !== 'string') {
    errors.push(`Le champ ${name} doit être une chaîne de caractères`);
    return undefined;
  }
  const trimmed = value.trim();
  if (required && trimmed === '') {
    errors.push(`Le champ ${name} est obligatoire`);
    return undefined;
  }
  if (trimmed.length > max) {
    errors.push(`Le champ ${name} dépasse ${max} caractères`);
    return undefined;
  }
  return trimmed;
}

function checkStatus(errors, value) {
  if (value === undefined) return undefined;
  if (!STATUSES.includes(value)) {
    errors.push(`Statut invalide. Valeurs acceptées : ${STATUSES.join(', ')}`);
    return undefined;
  }
  return value;
}

// POST /api/tasks
function validateCreate(body = {}) {
  const errors = [];
  const value = {
    title: checkString(errors, 'title', body.title, { required: true, max: LIMITS.title }),
    description: checkString(errors, 'description', body.description, { max: LIMITS.description }),
    owner: checkString(errors, 'owner', body.owner, { max: LIMITS.owner }),
  };
  return { errors, value };
}

// PATCH /api/tasks/:id
function validateUpdate(body = {}) {
  const errors = [];
  const value = {
    title: checkString(errors, 'title', body.title, { max: LIMITS.title }),
    description: checkString(errors, 'description', body.description, { max: LIMITS.description }),
    status: checkStatus(errors, body.status),
  };
  if (value.title === '') errors.push('Le champ title ne peut pas être vide');
  return { errors, value };
}

// GET /api/tasks?status=&q=
function validateQuery(query = {}) {
  const errors = [];
  const value = {
    status: query.status === undefined ? undefined : checkStatus(errors, query.status),
    q: checkString(errors, 'q', query.q, { max: LIMITS.q }),
  };
  return { errors, value };
}

module.exports = { STATUSES, validateCreate, validateUpdate, validateQuery };
