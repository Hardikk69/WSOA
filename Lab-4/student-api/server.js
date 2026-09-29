const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('./models/Student');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Load OpenAPI Specification
const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Database connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB Atlas');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
});

// Counter for auto-incrementing ID (simplified for this lab)
// In a real app, you might use a dedicated counter collection.
let nextId = 3;
// Initialize nextId based on existing max id in DB to avoid collisions on restart
mongoose.connection.once('open', async () => {
    try {
        const lastStudent = await Student.findOne().sort({ id: -1 });
        if (lastStudent) {
            nextId = lastStudent.id + 1;
        }
    } catch (e) {
        console.error('Error fetching initial nextId:', e);
    }
});

// Validation helper
const validateStudent = (body) => {
    const { name, email, semester } = body;
    if (!name || name.trim() === '') return 'Name is required';
    if (!email || !email.includes('@')) return 'Valid email is required';
    if (typeof semester !== 'number' || semester < 1) return 'Semester must be a positive number';
    return null;
};

// GET all students
app.get('/students', async (req, res) => {
    try {
        const students = await Student.find({}, '-_id -__v -createdAt -updatedAt');
        res.status(200).json(students);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// GET student by ID
app.get('/students/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const student = await Student.findOne({ id }, '-_id -__v -createdAt -updatedAt');
        
        if (!student) {
            return res.status(404).json({ error: `Student with ID ${id} not found` });
        }
        
        res.status(200).json(student);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch student' });
    }
});

// POST new student
app.post('/students', async (req, res) => {
    const error = validateStudent(req.body);
    if (error) {
        return res.status(400).json({ error });
    }

    const { name, email, course, semester } = req.body;
    
    try {
        // Check for duplicate email (handled by unique constraint, but good to check explicitly for better error message)
        const existingStudent = await Student.findOne({ email });
        if (existingStudent) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const newStudent = new Student({
            id: nextId++,
            name,
            email,
            course: course || 'Undeclared',
            semester
        });
        
        const savedStudent = await newStudent.save();
        
        // Strip out Mongoose fields for response
        const responseData = savedStudent.toJSON();
        delete responseData.createdAt;
        delete responseData.updatedAt;
        
        res.status(201).json(responseData);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT / PATCH update student
app.put('/students/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const error = validateStudent(req.body);
        if (error) {
            return res.status(400).json({ error });
        }

        const { name, email, course, semester } = req.body;
        
        // Check if updating email conflicts with another student
        const existingEmail = await Student.findOne({ email, id: { $ne: id } });
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const updatedStudent = await Student.findOneAndUpdate(
            { id },
            { name, email, course: course || 'Undeclared', semester },
            { new: true, runValidators: true }
        ).select('-_id -__v -createdAt -updatedAt');

        if (!updatedStudent) {
            return res.status(404).json({ error: `Student with ID ${id} not found` });
        }

        res.status(200).json(updatedStudent);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.patch('/students/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        // Partial update validation
        if (req.body.name !== undefined && req.body.name.trim() === '') {
            return res.status(400).json({ error: 'Name cannot be empty' });
        }
        if (req.body.email !== undefined && !req.body.email.includes('@')) {
            return res.status(400).json({ error: 'Valid email is required' });
        }
        if (req.body.semester !== undefined && (typeof req.body.semester !== 'number' || req.body.semester < 1)) {
            return res.status(400).json({ error: 'Semester must be a positive number' });
        }

        if (req.body.email) {
            const existingEmail = await Student.findOne({ email: req.body.email, id: { $ne: id } });
            if (existingEmail) {
                return res.status(400).json({ error: 'Email already exists' });
            }
        }

        const updatedStudent = await Student.findOneAndUpdate(
            { id },
            { $set: req.body },
            { new: true, runValidators: true }
        ).select('-_id -__v -createdAt -updatedAt');

        if (!updatedStudent) {
            return res.status(404).json({ error: `Student with ID ${id} not found` });
        }

        res.status(200).json(updatedStudent);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE student
app.delete('/students/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deletedStudent = await Student.findOneAndDelete({ id });
        
        if (!deletedStudent) {
            return res.status(404).json({ error: `Student with ID ${id} not found` });
        }
        
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete student' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Express API running on http://localhost:${port}`);
    console.log(`Swagger UI available on http://localhost:${port}/api-docs`);
});

