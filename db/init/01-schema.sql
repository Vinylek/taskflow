-- ──────────────────────────────────────────────
-- Schéma initial TaskFlow
-- Exécuté automatiquement par l'image postgres au PREMIER démarrage
-- (volume vide). Pour rejouer : npm run db:reset
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  owner VARCHAR(100) DEFAULT 'anonymous',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
