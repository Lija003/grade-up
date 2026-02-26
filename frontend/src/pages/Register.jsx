import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Mail, Shield } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'student'
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        setError(''); // Clear previous errors

        try {
            // Role should be lowercase to match backend enum
            const roleLower = formData.role.toLowerCase();


            await register(
                formData.username,
                formData.email,
                formData.password,
                roleLower
            );


            navigate('/login');
        } catch (err) {
            console.error("Registration error:", err);
            console.error("Error response:", err.response?.data);

            let errorMsg = 'Registration failed';

            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                if (Array.isArray(detail)) {
                    // Handle Pydantic validation errors (array of objects)
                    errorMsg = detail.map(e => e.msg).join(', ');
                } else {
                    // Handle simple error messages
                    errorMsg = detail;
                }
            } else if (err.message) {
                errorMsg = err.message;
            }

            // Ensure errorMsg is a string
            if (typeof errorMsg !== 'string') {
                errorMsg = JSON.stringify(errorMsg);
            }

            setError(errorMsg);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>GradeUp</h2>
                <h3 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Create Account</h3>

                {error && <div style={{ background: '#fef2f2', color: 'var(--error)', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="label">Username</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                            <input
                                className="input"
                                name="username"
                                style={{ paddingLeft: '2.5rem' }}
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Choose a username"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="label">Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                            <input
                                className="input"
                                type="email"
                                name="email"
                                style={{ paddingLeft: '2.5rem' }}
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="your@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                            <input
                                className="input"
                                type="password"
                                name="password"
                                style={{ paddingLeft: '2.5rem' }}
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="label">I am a...</label>
                        <div style={{ position: 'relative' }}>
                            <Shield size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                            <select
                                className="input"
                                name="role"
                                style={{ paddingLeft: '2.5rem' }}
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="moderator">Moderator</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Sign Up
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '500', textDecoration: 'none' }}>Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
