import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(email, password);
        if (result.success) {
            if (result.role === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } else {
            setError(result.message || 'Invalid credentials.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <img src="/logo.png" alt="UniBites Logo" className="login-logo" />
                    <h2 className="login-title">Dashboard</h2>
                    <p className="login-subtitle">Sign in to your account</p>
                </div>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="email@islingtoncollege.edu.np"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="login-btn">
                        Sign In
                    </button>
                    <div className="login-footer">
                        <p>Need help? Contact Admin</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
