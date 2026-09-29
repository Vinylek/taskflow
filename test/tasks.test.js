const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');

test('GET /health renvoie ok', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: 'ok' });
});

test('GET /api/tasks renvoie la liste des tâches', async () => {
  const res = await request(app).get('/api/tasks');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
});

test('GET /api/tasks?status=done filtre par statut', async () => {
  const res = await request(app).get('/api/tasks?status=done');
  assert.equal(res.status, 200);
  assert.ok(res.body.every((t) => t.status === 'done'));
});

test('GET /api/tasks/:id inconnu renvoie 404', async () => {
  const res = await request(app).get('/api/tasks/9999');
  assert.equal(res.status, 404);
});

test('POST /api/tasks sans titre renvoie 400', async () => {
  const res = await request(app).post('/api/tasks').send({});
  assert.equal(res.status, 400);
});

test('POST /api/tasks crée une tâche en statut todo', async () => {
  const res = await request(app).post('/api/tasks').send({ title: 'Test' });
  assert.equal(res.status, 201);
  assert.equal(res.body.title, 'Test');
  assert.equal(res.body.status, 'todo');
});

test('PATCH /api/tasks/:id avec un statut invalide renvoie 400', async () => {
  const res = await request(app).patch('/api/tasks/1').send({ status: 'nimportequoi' });
  assert.equal(res.status, 400);
});

test('DELETE /api/tasks/:id supprime la tâche', async () => {
  const res = await request(app).delete('/api/tasks/2');
  assert.equal(res.status, 200);
  const check = await request(app).get('/api/tasks/2');
  assert.equal(check.status, 404);
});
