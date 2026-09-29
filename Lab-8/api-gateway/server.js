const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const client = require('prom-client');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;
const PROXY_TIMEOUT_MS = parseInt(process.env.PROXY_TIMEOUT_MS) || 10000;

// Service registry (configuration-based service discovery).
// Locations come ONLY from environment variables - Compose .env locally, the
// platform dashboard in the cloud. No URL is written in this file.
const registry = [
    { prefix: '/users', name: 'user-service', url: process.env.USER_SERVICE_URL },
    { prefix: '/products', name: 'product-service', url: process.env.PRODUCT_SERVICE_URL },
    { prefix: '/orders', name: 'order-service', url: process.env.ORDER_SERVICE_URL }
];

const missing = registry.filter((s) => !s.url).map((s) => s.name);
if (missing.length) {
    console.error(`[api-gateway] Missing service URL config for: ${missing.join(', ')}`);
    process.exit(1);
}

const routeFor = (path) => registry.find((s) => path === s.prefix || path.startsWith(`${s.prefix}/`));

// Prometheus metrics: traffic, errors (status label) and latency per target service
client.collectDefaultMetrics();
const labelNames = ['method', 'target', 'status'];
const httpRequests = new client.Counter({ name: 'http_requests_total', help: 'HTTP requests handled', labelNames });
const httpDuration = new client.Histogram({ name: 'http_request_duration_seconds', help: 'HTTP request duration', labelNames });

// Request logging + metrics: method, path, target service, response status, duration
app.use((req, res, next) => {
    if (req.path === '/metrics') return next();
    const start = Date.now();
    res.on('finish', () => {
        const target = routeFor(req.path)?.name || 'gateway';
        const labels = { method: req.method, target, status: res.statusCode };
        httpRequests.inc(labels);
        httpDuration.observe(labels, (Date.now() - start) / 1000);
        console.log(`[api-gateway] ${req.method} ${req.originalUrl} -> ${target} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
});

app.get('/metrics', async (req, res) => res.type(client.register.contentType).send(await client.register.metrics()));

// Gateway's own health check - answered here, never proxied
app.get('/health', (req, res) => res.status(200).json({
    service: 'api-gateway',
    status: 'UP',
    uptimeSeconds: Math.round(process.uptime()),
    routes: Object.fromEntries(registry.map((s) => [s.prefix, s.name]))
}));

// Unreachable target -> 503, any other proxy failure (reset, timeout) -> 502
const UNREACHABLE = ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'EHOSTUNREACH'];

// Routing table is built from the registry, not from literal URLs
for (const svc of registry) {
    app.use(createProxyMiddleware({
        target: svc.url,
        pathFilter: (path) => routeFor(path) === svc,
        changeOrigin: true,
        proxyTimeout: PROXY_TIMEOUT_MS,
        on: {
            error: (err, req, res) => {
                const status = UNREACHABLE.includes(err.code) ? 503 : 502;
                console.error(`[api-gateway] ${svc.name} error: ${err.code || err.message}`);
                if (res.headersSent) return res.end();
                res.writeHead(status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: status === 503
                        ? `${svc.name} is unavailable. Please try again later.`
                        : `Bad gateway: ${svc.name} failed to respond (${err.code || 'error'})`
                }));
            }
        }
    }));
}

app.use((req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` }));

app.listen(port, () => {
    console.log(`[api-gateway] running on port ${port}`);
    registry.forEach((s) => console.log(`[api-gateway] ${s.prefix}/* -> ${s.name} @ ${s.url}`));
});
