// ──────────────────────────────────────────────
// Configuration centralisée, lue depuis les variables d'environnement
// (chargées depuis .env via `node --env-file-if-exists=.env`)
// ──────────────────────────────────────────────

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name} (voir .env.example)`);
  }
  return value;
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  secretKey: required('SECRET_KEY'),
  db: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: required('POSTGRES_USER'),
    password: required('POSTGRES_PASSWORD'),
    database: required('POSTGRES_DB'),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
};

module.exports = Object.freeze(config);
