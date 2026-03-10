import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Register = () => {
    const { register, loading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '', confirm: '' });
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirm) return setError('Passwords do not match');
        if (form.password.length < 8) return setError('Password must be at least 8 characters');

        const result = await register(form.email, form.password);
        if (result.success) navigate('/dashboard');
        else setError(result.error);
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <Zap size={32} className="brand-icon" />
                    <span className="auth-brand">ShortLinkX</span>
                </div>
                <h1 className="auth-title">Create account</h1>
                <p className="auth-subtitle">Start shortening links for free</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label"><Mail size={14} /> Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label"><Lock size={14} /> Password</label>
                        <div className="input-group">
                            <input
                                type={showPass ? 'text' : 'password'}
                                className="form-input"
                                placeholder="Min. 8 characters"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                            />
                            <button type="button" className="input-addon" onClick={() => setShowPass(!showPass)}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label"><Lock size={14} /> Confirm Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Repeat password"
                            value={form.confirm}
                            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account?{' '}
                    <Link to="/login" className="auth-link">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
