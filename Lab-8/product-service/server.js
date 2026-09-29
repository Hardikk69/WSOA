const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Product Service owns its own database (productdb). No other service connects to it.
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log(`[product-service] Connected to MongoDB database: ${mongoose.connection.name}`))
    .catch((err) => console.error('[product-service] MongoDB connection error:', err.message));

const validateProduct = ({ name, price, stock }) => {
    if (!name || name.trim() === '') return 'Name is required';
    if (typeof price !== 'number' || price < 0) return 'Price must be a non-negative number';
    if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) return 'Stock must be a non-negative number';
    return null;
};

// ponytail: max(id)+1 can race under concurrent POSTs; use a counter collection if that matters
const nextId = async () => ((await Product.findOne().sort({ id: -1 }))?.id || 500) + 1;

app.get('/', (req, res) => res.json({ service: 'product-service', status: 'UP' }));

// Non-numeric IDs can never match a resource: answer 404 instead of a DB cast error
app.param('id', (req, res, next, id) => {
    if (!/^\d+$/.test(id)) return res.status(404).json({ error: `Product with ID ${id} not found` });
    next();
});

app.get('/products', async (req, res) => {
    try {
        res.status(200).json(await Product.find());
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findOne({ id: parseInt(req.params.id) });
        if (!product) return res.status(404).json({ error: `Product with ID ${req.params.id} not found` });
        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

app.post('/products', async (req, res) => {
    const error = validateProduct(req.body);
    if (error) return res.status(400).json({ error });

    const { name, category, price, stock } = req.body;
    try {
        const product = await Product.create({ id: await nextId(), name, category, price, stock });
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/products/:id', async (req, res) => {
    const error = validateProduct(req.body);
    if (error) return res.status(400).json({ error });

    const { name, category, price, stock } = req.body;
    try {
        const product = await Product.findOneAndUpdate(
            { id: parseInt(req.params.id) },
            { name, category: category || 'General', price, stock: stock ?? 0 },
            { returnDocument: 'after', runValidators: true }
        );
        if (!product) return res.status(404).json({ error: `Product with ID ${req.params.id} not found` });
        res.status(200).json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/products/:id', async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({ id: parseInt(req.params.id) });
        if (!product) return res.status(404).json({ error: `Product with ID ${req.params.id} not found` });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

app.listen(port, () => console.log(`[product-service] running on port ${port}`));
