const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const client = require('prom-client');
require('dotenv').config();

const User = require('./models/User');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Prometheus metrics: traffic, errors (status label) and latency
client.collectDefaultMetrics();
const httpRequests = new client.Counter({ name: 'http_requests_total', help: 'HTTP requests handled', labelNames: ['method', 'status'] });
const httpDuration = new client.Histogram({ name: 'http_request_duration_seconds', help: 'HTTP request duration', labelNames: ['method', 'status'] });
app.use((req, res, next) => {
    if (req.path === '/metrics') return next();
    const end = httpDuration.startTimer();
    res.on('finish', () => {
        const labels = { method: req.method, status: res.statusCode };
        httpRequests.inc(labels);
        end(labels);
    });
    next();
});
app.get('/metrics', async (req, res) => res.type(client.register.contentType).send(await client.register.metrics()));

// User Service owns its own database (userdb). No other service connects to it.
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log(`[user-service] Connected to MongoDB database: ${mongoose.connection.name}`))
    .catch((err) => console.error('[user-service] MongoDB connection error:', err.message));

const validateUser = ({ name, email, semester }) => {
    if (!name || name.trim() === '') return 'Name is required';
    if (!email || !email.includes('@')) return 'Valid email is required';
    if (typeof semester !== 'number' || semester < 1) return 'Semester must be a positive number';
    return null;
};

// ponytail: max(id)+1 can race under concurrent POSTs; use a counter collection if that matters
const nextId = async () => ((await User.findOne().sort({ id: -1 }))?.id || 100) + 1;

app.get('/', (req, res) => res.json({ service: 'user-service', status: 'UP' }));

// Non-numeric IDs can never match a resource: answer 404 instead of a DB cast error
app.param('id', (req, res, next, id) => {
    if (!/^\d+$/.test(id)) return res.status(404).json({ error: `User with ID ${id} not found` });
    next();
});

app.get('/users', async (req, res) => {
    try {
        res.status(200).json(await User.find());
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.get('/users/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const user = await User.findOne({ id });
        if (!user) return res.status(404).json({ error: `User with ID ${req.params.id} not found` });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

app.post('/users', async (req, res) => {
    const error = validateUser(req.body);
    if (error) return res.status(400).json({ error });

    const { name, email, course, semester } = req.body;
    try {
        if (await User.findOne({ email })) return res.status(400).json({ error: 'Email already exists' });
        const user = await User.create({ id: await nextId(), name, email, course: course || 'Undeclared', semester });
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/users/:id', async (req, res) => {
    const error = validateUser(req.body);
    if (error) return res.status(400).json({ error });

    const id = parseInt(req.params.id);
    const { name, email, course, semester } = req.body;
    try {
        if (await User.findOne({ email, id: { $ne: id } })) return res.status(400).json({ error: 'Email already exists' });
        const user = await User.findOneAndUpdate(
            { id },
            { name, email, course: course || 'Undeclared', semester },
            { returnDocument: 'after', runValidators: true }
        );
        if (!user) return res.status(404).json({ error: `User with ID ${req.params.id} not found` });
        res.status(200).json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ id: parseInt(req.params.id) });
        if (!user) return res.status(404).json({ error: `User with ID ${req.params.id} not found` });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

app.listen(port, () => console.log(`[user-service] running on port ${port}`));
