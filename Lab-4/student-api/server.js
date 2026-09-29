const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Load OpenAPI Specification
const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// In-memory data store
let students = [
    { id: 1, name: 'Alice Smith', email: 'alice@example.com', course: 'Computer Science', semester: 3 },
    { id: 2, name: 'Bob Johnson', email: 'bob@example.com', course: 'Information Technology', semester: 2 }
];
let nextId = 3;

// Validation helper
const validateStudent = (body) => {
    const { name, email, semester } = body;
    if (!name || name.trim() === '') return 'Name is required';
    if (!email || !email.includes('@')) return 'Valid email is required';
    if (typeof semester !== 'number' || semester < 1) return 'Semester must be a positive number';
    return null;
};

// GET all students
app.get('/students', (req, res) => {
    res.status(200).json(students);
});

// GET student by ID
app.get('/students/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const student = students.find(s => s.id === id);
    
    if (!student) {
        return res.status(404).json({ error: `Student with ID ${id} not found` });
    }
    
    res.status(200).json(student);
});

// POST new student
app.post('/students', (req, res) => {
    const error = validateStudent(req.body);
    if (error) {
        return res.status(400).json({ error });
    }

    const { name, email, course, semester } = req.body;
    const newStudent = {
        id: nextId++,
        name,
        email,
        course: course || 'Undeclared',
        semester
    };
    
    students.push(newStudent);
    res.status(201).json(newStudent);
});

// PUT / PATCH update student
app.put('/students/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = students.findIndex(s => s.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: `Student with ID ${id} not found` });
    }

    const error = validateStudent(req.body);
    if (error) {
        return res.status(400).json({ error });
    }

    const { name, email, course, semester } = req.body;
    students[index] = {
        ...students[index],
        name,
        email,
        course: course || students[index].course,
        semester
    };

    res.status(200).json(students[index]);
});

app.patch('/students/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = students.findIndex(s => s.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: `Student with ID ${id} not found` });
    }

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

    students[index] = {
        ...students[index],
        ...req.body
    };

    res.status(200).json(students[index]);
});

// DELETE student
app.delete('/students/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = students.findIndex(s => s.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: `Student with ID ${id} not found` });
    }
    
    students.splice(index, 1);
    res.status(204).send(); // Or 200 OK with message, per requirements either is fine. We use 204.
});

// Start server
app.listen(port, () => {
    console.log(`Express API running on http://localhost:${port}`);
    console.log(`Swagger UI available on http://localhost:${port}/api-docs`);
});
