// Smoke tests: start the real gateway with backends pointed at a closed port.
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');

const PORT = 4100;
const DOWN = 'http://127.0.0.1:9';           // refuses connections at once
const BLACKHOLE = 'http://10.255.255.1:3003';  // non-routable: connect attempts get no answer
const url = (p) => `http://127.0.0.1:${PORT}${p}`;
let server;

before(() => new Promise((resolve, reject) => {
    server = spawn('node', ['server.js'], {
        env: {
            ...process.env, PORT, USER_SERVICE_URL: DOWN, PRODUCT_SERVICE_URL: DOWN,
            ORDER_SERVICE_URL: BLACKHOLE, PROXY_TIMEOUT_MS: 1000
        }
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

test('CORS: browser preflight is answered by the gateway', async () => {
    const res = await fetch(url('/users'), {
        method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST' }
    });
    assert.strictEqual(res.status, 204);
    assert.strictEqual(res.headers.get('access-control-allow-origin'), '*');
});

test('unknown route returns 404', async () => {
    assert.strictEqual((await fetch(url('/nope'))).status, 404);
});

test('unreachable backend returns 503', async () => {
    assert.strictEqual((await fetch(url('/users'))).status, 503);
});

test('black-holed backend fails within PROXY_TIMEOUT_MS instead of hanging', async () => {
    const start = Date.now();
    const res = await fetch(url('/orders'));
    assert.ok([502, 503].includes(res.status), `got ${res.status}`);
    assert.ok(Date.now() - start < 3000, `took ${Date.now() - start}ms`);
});

test('GET /metrics exposes request counters', async () => {
    const body = await (await fetch(url('/metrics'))).text();
    assert.match(body, /http_requests_total\{method="GET",target="user-service",status="503"\} 1/);
});
