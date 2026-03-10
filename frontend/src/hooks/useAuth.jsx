import React, { createContext, useContext, useState, useCallback } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('slx_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(false);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const { data } = await apiLogin(email, password);
            localStorage.setItem('slx_token', data.token);
            localStorage.setItem('slx_user', JSON.stringify(data.user));
            setUser(data.user);
            return { success: true, apiKey: data.apiKey };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Login failed' };
        } finally {
            setLoading(false);
        }
    }, []);

    const register = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const { data } = await apiRegister(email, password);
            localStorage.setItem('slx_token', data.token);
            localStorage.setItem('slx_user', JSON.stringify(data.user));
            setUser(data.user);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Registration failed' };
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('slx_token');
        localStorage.removeItem('slx_user');
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
