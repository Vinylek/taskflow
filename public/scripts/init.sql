   CREATE TABLE IF NOT EXISTS tasks (
     id SERIAL PRIMARY KEY,
     title VARCHAR(200) NOT NULL,
     description TEXT DEFAULT '',
     status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
     owner VARCHAR(100) DEFAULT 'anonymous',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   INSERT INTO tasks (title, description, status, owner) VALUES