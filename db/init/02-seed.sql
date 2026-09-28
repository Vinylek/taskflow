-- Données de démonstration (environnement de développement)

INSERT INTO tasks (title, description, status, owner, created_at) VALUES
  ('Configurer l''environnement de dev', 'Mettre en place Docker, ESLint, Prettier', 'done', 'alice', '2026-09-01 08:00:00'),
  ('Implémenter l''authentification', 'JWT + bcrypt pour le login', 'in-progress', 'bob', '2026-09-02 10:00:00'),
  ('Écrire les tests unitaires', 'Couvrir les services avec Jest', 'todo', 'alice', '2026-09-03 09:00:00');
