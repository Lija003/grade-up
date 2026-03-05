import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Decode token payload safely safely
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));

                    const payload = JSON.parse(jsonPayload);

                    // Check expiration
                    if (payload.exp && payload.exp * 1000 < Date.now()) {
                        console.warn("AuthContext: Token expired on load");
                        localStorage.removeItem('token');
                        setUser(null);
                    } else {
                        console.log("AuthContext: User loaded ->", payload);
                        setUser({ username: payload.sub, role: payload.role?.toLowerCase() });
                    }
                } catch (error) {
                    console.error("AuthContext: Token invalid or parse error", error);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (username, password) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post('/auth/token', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const { access_token } = response.data;
        if (!access_token) {
            throw new Error("No token returned");
        }

        localStorage.setItem('token', access_token);

        try {
            const base64Url = access_token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const tokenData = JSON.parse(jsonPayload);
            setUser({ username: tokenData.sub, role: tokenData.role?.toLowerCase() });
        } catch (err) {
            console.error("AuthContext: Login token parsing failed", err);
            localStorage.removeItem('token');
            throw new Error("Invalid token format received");
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const register = async (username, email, password, role) => {
        try {
            const response = await api.post('/auth/register', { username, email, password, role });
            console.log("Registration response:", response.status);
            return response;
        } catch (error) {
            console.error("AuthContext.register error:", error);
            throw error; // Re-throw so Register component can catch it
        }
    };

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div className="skeleton-pulse" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6' }} />
                    <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Initializing secure session...</div>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
