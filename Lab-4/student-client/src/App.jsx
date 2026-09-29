import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './index.css';

import StudentList from './components/StudentList';
import StudentForm from './components/StudentForm';

function App() {
  return (
    <Router>
      <div className="container">
        <header className="header">
          <h1>Student Management System</h1>
          <nav>
            <Link to="/" className="btn btn-primary" style={{ marginRight: '10px' }}>
              Student List
            </Link>
            <Link to="/add" className="btn btn-primary">
              Add Student
            </Link>
          </nav>
        </header>
        
        <main>
          <Routes>
            <Route path="/" element={<StudentList />} />
            <Route path="/add" element={<StudentForm />} />
            <Route path="/edit/:id" element={<StudentForm />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
