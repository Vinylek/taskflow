const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const { escapeHtml } = require('../src/html');

const XSS = '<script>alert(1)</script>';

// ── En-têtes de sécurité ───────────────────────

test('les en-têtes de sécurité sont présents', async () => {
  const res = await request(app).get('/');
  assert.match(res.headers['content-security-policy'], /script-src 'self'/);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN');
  assert.ok(res.headers['permissions-policy']);
});

test("l'en-tête X-Powered-By n'est pas exposé", async () => {
  const res = await request(app).get('/health');
  assert.equal(res.headers['x-powered-by'], undefined);
});

// ── XSS ────────────────────────────────────────

test('escapeHtml neutralise les caractères HTML', () => {
  assert.equal(
    escapeHtml(`<a href="x" title='y'>&</a>`),
    '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
  );
});

test('/search échappe le terme recherché (XSS réfléchi)', async () => {
  const res = await request(app).get('/search').query({ q: XSS });
  assert.equal(res.status, 200);
  assert.ok(!res.text.includes(XSS));
  assert.ok(res.text.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
});

test('/search échappe les titres de tâches (XSS stocké)', async () => {
  await request(app)
    .post('/api/tasks')
    .send({ title: `piège ${XSS}` });
  const res = await request(app).get('/search').query({ q: 'piège' });
  assert.ok(!res.text.includes(XSS));
});

// ── Validation des entrées ─────────────────────

test('POST refuse un titre qui n’est pas une chaîne', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .send({ title: { $gt: '' } });
  assert.equal(res.status, 400);
});

test('POST refuse un titre trop long', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .send({ title: 'a'.repeat(201) });
  assert.equal(res.status, 400);
});

test('POST refuse un titre composé uniquement d’espaces', async () => {
  const res = await request(app).post('/api/tasks').send({ title: '   ' });
  assert.equal(res.status, 400);
});

test('PATCH refuse un titre vide', async () => {
  const res = await request(app).patch('/api/tasks/1').send({ title: '' });
  assert.equal(res.status, 400);
});

test('GET /api/tasks refuse un paramètre q en tableau (?q=a&q=b)', async () => {
  const res = await request(app).get('/api/tasks?q=a&q=b');
  assert.equal(res.status, 400);
});

test('GET /api/tasks refuse un statut inconnu', async () => {
  const res = await request(app).get('/api/tasks?status=admin');
  assert.equal(res.status, 400);
});

// ── Gestion des erreurs ────────────────────────

test('un JSON malformé renvoie 400 sans stack trace', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .set('Content-Type', 'application/json')
    .send('{"title": ');
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: 'JSON invalide' });
});

test('un body trop volumineux est refusé (413)', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .send({ title: 'x', description: 'a'.repeat(20_000) });
  assert.equal(res.status, 413);
});

test('une route inconnue renvoie 404 en JSON', async () => {
  const res = await request(app).get('/api/inconnue');
  assert.equal(res.status, 404);
  assert.deepEqual(res.body, { error: 'Ressource introuvable' });
});
