// Smoke tests: start the real gateway with backends pointed at a closed port.
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');

const PORT = 4100;
const DOWN = 'http://127.0.0.1:9';
const url = (p) => `http://127.0.0.1:${PORT}${p}`;
let server;

before(() => new Promise((resolve, reject) => {
    server = spawn('node', ['server.js'], {
        env: { ...process.env, PORT, USER_SERVICE_URL: DOWN, PRODUCT_SERVICE_URL: DOWN, ORDER_SERVICE_URL: DOWN }
    });
    server.stdout.on('data', (d) => d.toString().includes('running on port') && resolve());
    server.on('exit', (code) => reject(new Error(`server exited with ${code}`)));
}));
after(() => server.kill());

test('GET /health answers UP from the gateway itself', async () => {
    const res = await fetch(url('/health'));
    assert.strictEqual(res.status, 200);
    assert.strictEqual((await res.json()).status, 'UP');
});

test('unknown route returns 404', async () => {
    assert.strictEqual((await fetch(url('/nope'))).status, 404);
});

test('unreachable backend returns 503', async () => {
    assert.strictEqual((await fetch(url('/users'))).status, 503);
});

test('GET /metrics exposes request counters', async () => {
    const body = await (await fetch(url('/metrics'))).text();
    assert.match(body, /http_requests_total\{method="GET",target="user-service",status="503"\} 1/);
});
