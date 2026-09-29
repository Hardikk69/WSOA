import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const StudentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    course: '',
    semester: ''
  });
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      fetchStudent();
    }
  }, [id]);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/students/${id}`);
      setFormData(response.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('Student not found');
      } else {
        setError('Unable to load data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Name is required';
    }
    if (!formData.email || !formData.email.includes('@')) {
      errors.email = 'Valid email is required';
    }
    if (!formData.semester || formData.semester < 1) {
      errors.semester = 'Semester must be a positive number';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'semester' ? parseInt(value) || '' : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    try {
      if (isEditMode) {
        await axios.put(`${API_BASE_URL}/students/${id}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/students`, formData);
      }
      navigate('/');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setError(err.response.data.error || 'Validation error');
      } else if (err.response && err.response.status === 404) {
        setError('Student not found');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) return <div className="loading">Loading...</div>;

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>{isEditMode ? 'Edit Student' : 'Add New Student'}</h2>
      
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input 
            type="text" 
            name="name" 
            className="form-control" 
            value={formData.name} 
            onChange={handleChange} 
          />
          {validationErrors.name && <div className="error-message">{validationErrors.name}</div>}
        </div>
        
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            name="email" 
            className="form-control" 
            value={formData.email} 
            onChange={handleChange} 
          />
          {validationErrors.email && <div className="error-message">{validationErrors.email}</div>}
        </div>
        
        <div className="form-group">
          <label>Course</label>
          <input 
            type="text" 
            name="course" 
            className="form-control" 
            value={formData.course} 
            onChange={handleChange} 
          />
        </div>
        
        <div className="form-group">
          <label>Semester</label>
          <input 
            type="number" 
            name="semester" 
            className="form-control" 
            value={formData.semester} 
            onChange={handleChange} 
            min="1"
          />
          {validationErrors.semester && <div className="error-message">{validationErrors.semester}</div>}
        </div>
        
        <div className="actions" style={{ marginTop: '2rem' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (isEditMode ? 'Update' : 'Save')}
          </button>
          <button type="button" className="btn" onClick={() => navigate('/')} style={{ border: '1px solid var(--border)' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentForm;
