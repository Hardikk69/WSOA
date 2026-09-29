// Smoke tests: start the real service without a database and check routes that need none.
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');

const PORT = 4101;
const url = (p) => `http://127.0.0.1:${PORT}${p}`;
let server;

before(() => new Promise((resolve, reject) => {
    server = spawn('node', ['server.js'], { env: { ...process.env, PORT, MONGO_URI: 'mongodb://127.0.0.1:9/test' } });
    server.stdout.on('data', (d) => d.toString().includes('running on port') && resolve());
    server.on('exit', (code) => reject(new Error(`server exited with ${code}`)));
}));
after(() => server.kill());

test('GET / reports UP', async () => {
    assert.strictEqual((await (await fetch(url('/'))).json()).status, 'UP');
});

test('POST /users validates the body', async () => {
    const res = await fetch(url('/users'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'a@b.c', semester: 1 })
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual((await res.json()).error, 'Name is required');
});

test('non-numeric id returns 404', async () => {
    assert.strictEqual((await fetch(url('/users/abc'))).status, 404);
});

test('GET /metrics exposes request counters', async () => {
    assert.match(await (await fetch(url('/metrics'))).text(), /http_requests_total\{method="POST",status="400"\} 1/);
});
