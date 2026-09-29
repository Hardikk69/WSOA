const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./models/Order');

const app = express();
const port = process.env.PORT || 3003;

// Service URLs come from configuration. Inside Docker these are the Compose
// service names (http://user-service:3001), never localhost.
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS) || 3000;

app.use(cors());
app.use(express.json());

// Order Service owns its own database (orderdb). No other service connects to it.
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log(`[order-service] Connected to MongoDB database: ${mongoose.connection.name}`))
    .catch((err) => console.error('[order-service] MongoDB connection error:', err.message));

class DependencyError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

// Calls another service over REST. Maps failures to clear HTTP errors:
//   target says 404            -> 404 (referenced resource does not exist)
//   unreachable / DNS / timeout -> 503 (dependency unavailable)
//   any other non-2xx          -> 502 (bad response from dependency)
async function fetchFromService(serviceName, url) {
    console.log(`[order-service] -> GET ${url}`);
    let res;
    try {
        res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (err) {
        console.error(`[order-service] ${serviceName} unavailable: ${err.cause?.code || err.name}`);
        throw new DependencyError(503, `${serviceName} is unavailable. Please try again later.`);
    }
    console.log(`[order-service] <- ${res.status} from ${serviceName}`);
    if (res.status === 404) {
        const body = await res.json().catch(() => ({}));
        throw new DependencyError(404, body.error || `Resource not found in ${serviceName}`);
    }
    if (!res.ok) throw new DependencyError(502, `${serviceName} returned status ${res.status}`);
    return res.json();
}

// ponytail: max(id)+1 can race under concurrent POSTs; use a counter collection if that matters
const nextId = async () => ((await Order.findOne().sort({ id: -1 }))?.id || 900) + 1;

app.get('/', (req, res) => res.json({
    service: 'order-service',
    status: 'UP',
    dependencies: { userService: USER_SERVICE_URL, productService: PRODUCT_SERVICE_URL }
}));

app.param('id', (req, res, next, id) => {
    if (!/^\d+$/.test(id)) return res.status(404).json({ error: `Order with ID ${id} not found` });
    next();
});

app.get('/orders', async (req, res) => {
    try {
        res.status(200).json(await Order.find());
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

app.get('/orders/:id', async (req, res) => {
    try {
        const order = await Order.findOne({ id: parseInt(req.params.id) });
        if (!order) return res.status(404).json({ error: `Order with ID ${req.params.id} not found` });
        res.status(200).json(order);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

app.post('/orders', async (req, res) => {
    const { userId, productId, quantity = 1 } = req.body;
    if (!Number.isInteger(userId)) return res.status(400).json({ error: 'userId (integer) is required' });
    if (!Number.isInteger(productId)) return res.status(400).json({ error: 'productId (integer) is required' });
    if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ error: 'quantity must be a positive integer' });

    try {
        // Service-to-service communication: validate references via the owning services' APIs
        const user = await fetchFromService('User Service', `${USER_SERVICE_URL}/users/${userId}`);
        const product = await fetchFromService('Product Service', `${PRODUCT_SERVICE_URL}/products/${productId}`);

        const order = await Order.create({
            id: await nextId(),
            userId,
            productId,
            quantity,
            userName: user.name,
            productName: product.name,
            unitPrice: product.price,
            totalPrice: product.price * quantity
        });
        res.status(201).json({ ...order.toJSON(), user, product });
    } catch (err) {
        if (err instanceof DependencyError) return res.status(err.status).json({ error: err.message });
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`[order-service] running on port ${port}`);
    console.log(`[order-service] USER_SERVICE_URL=${USER_SERVICE_URL}`);
    console.log(`[order-service] PRODUCT_SERVICE_URL=${PRODUCT_SERVICE_URL}`);
});
