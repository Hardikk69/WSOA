// Smoke tests: start the real service without a database or dependencies.
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');

const PORT = 4103;
const DOWN = 'http://127.0.0.1:9';
const url = (p) => `http://127.0.0.1:${PORT}${p}`;
const post = (body) => fetch(url('/orders'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
});
let server;

before(() => new Promise((resolve, reject) => {
    server = spawn('node', ['server.js'], {
        env: { ...process.env, PORT, MONGO_URI: 'mongodb://127.0.0.1:9/test', USER_SERVICE_URL: DOWN, PRODUCT_SERVICE_URL: DOWN }
    });
    server.stdout.on('data', (d) => d.toString().includes('running on port') && resolve());
    server.on('exit', (code) => reject(new Error(`server exited with ${code}`)));
}));
after(() => server.kill());

test('GET / reports UP', async () => {
    assert.strictEqual((await (await fetch(url('/'))).json()).status, 'UP');
});

test('POST /orders validates the body', async () => {
    const res = await post({ productId: 501 });
    assert.strictEqual(res.status, 400);
    assert.strictEqual((await res.json()).error, 'userId (integer) is required');
});

test('unreachable User Service returns 503', async () => {
    assert.strictEqual((await post({ userId: 101, productId: 501 })).status, 503);
});

test('GET /metrics exposes request counters', async () => {
    assert.match(await (await fetch(url('/metrics'))).text(), /http_requests_total\{method="POST",status="503"\} 1/);
});
