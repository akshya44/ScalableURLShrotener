import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Link2, BarChart2, LogOut, Home, Menu, X, Zap } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <Zap size={22} className="brand-icon" />
                    <span className="brand-text">ShortLinkX</span>
                </Link>

                <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    {user ? (
                        <>
                            <Link
                                to="/dashboard"
                                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <Home size={16} /> Dashboard
                            </Link>
                            <Link
                                to="/analytics"
                                className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <BarChart2 size={16} /> Analytics
                            </Link>
                            <span className="nav-email">{user.email}</span>
                            <button className="nav-btn nav-btn-ghost" onClick={handleLogout}>
                                <LogOut size={16} /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
                                onClick={() => setMenuOpen(false)}
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="nav-btn nav-btn-primary"
                                onClick={() => setMenuOpen(false)}
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>

                <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
