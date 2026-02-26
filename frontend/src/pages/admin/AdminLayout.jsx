import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Users, Activity, LogOut,
    Settings, Shield, Database, Bell, Menu
} from 'lucide-react';
import api from '../../api';
import NotificationDropdown from '../../components/ui/NotificationDropdown';

// Admin Views
import AdminOverview from './AdminOverview';
import UserManagement from './UserManagement';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navGroups = [
        {
            title: 'Dashboard',
            items: [
                { path: '', icon: <LayoutDashboard size={20} />, label: 'Overview' },
            ]
        },
        {
            title: 'User Management',
            items: [
                { path: 'users', icon: <Users size={20} />, label: 'All Users & Roles' },
            ]
        }
    ];

    const isActive = (path) => {
        if (path === '') return location.pathname === '/dashboard';
        return location.pathname.includes(`/dashboard/${path}`);
    };



    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
            {/* Sidebar (NOC Theme) */}
            <aside style={{
                width: sidebarOpen ? '280px' : '80px',
                background: '#0f172a', // Deep slate for Admin Control Center
                color: '#94a3b8',
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh',
                zIndex: 40,
                boxShadow: '4px 0 24px rgba(0,0,0,0.1)'
            }}>
                {/* Logo Area */}
                <div style={{
                    height: '76px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: sidebarOpen ? '0 1.5rem' : '0',
                    justifyContent: sidebarOpen ? 'space-between' : 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(0,0,0,0.2)'
                }}>
                    {sidebarOpen && (
                        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: '900', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.02em' }}>
                            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                                <Shield size={20} color="white" fill="currentColor" />
                            </div>
                            <div>
                                GradeUp <span style={{ color: '#10b981', fontSize: '0.85rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '-2px' }}>Operations</span>
                            </div>
                        </Link>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', transition: 'all 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.color = '#f8fafc'}
                        onMouseOut={e => e.currentTarget.style.color = '#64748b'}
                    >
                        <Menu size={22} />
                    </button>
                </div>

                {/* Primary Nav */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 0' }}>
                    {navGroups.map((group, groupIdx) => (
                        <div key={groupIdx} style={{ marginBottom: '2rem' }}>
                            {sidebarOpen && (
                                <div style={{
                                    fontSize: '0.7rem', textTransform: 'uppercase', color: '#475569',
                                    padding: '0 1.75rem', marginBottom: '0.75rem', fontWeight: '700', letterSpacing: '0.1em'
                                }}>
                                    {group.title}
                                </div>
                            )}
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {group.items.map((item) => (
                                    <li key={item.path} style={{ padding: '0 1rem' }}>
                                        <Link
                                            to={`/dashboard${item.path ? `/${item.path}` : ''}`}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                padding: '0.85rem 1rem',
                                                borderRadius: '10px',
                                                color: isActive(item.path) ? 'white' : '#94a3b8',
                                                background: isActive(item.path) ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                                textDecoration: 'none',
                                                fontWeight: isActive(item.path) ? '600' : '500',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                                                position: 'relative',
                                                border: '1px solid transparent',
                                                borderColor: isActive(item.path) ? 'rgba(16, 185, 129, 0.2)' : 'transparent'
                                            }}
                                            onMouseOver={e => !isActive(item.path) && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                                            onMouseOut={e => !isActive(item.path) && (e.currentTarget.style.background = 'transparent')}
                                        >
                                            {isActive(item.path) && sidebarOpen && (
                                                <div style={{ position: 'absolute', left: '-1rem', top: '50%', transform: 'translateY(-50%)', width: '4px', height: '60%', background: '#10b981', borderRadius: '0 4px 4px 0' }} />
                                            )}
                                            <div style={{
                                                color: isActive(item.path) ? '#10b981' : 'inherit',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {item.icon}
                                            </div>
                                            {sidebarOpen && <span>{item.label}</span>}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Profile Area */}
                <div style={{ padding: '1.5rem 1rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', flexShrink: 0, border: '1px solid #475569' }}>
                            {user?.username?.[0]?.toUpperCase()}
                        </div>
                        {sidebarOpen && (
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.username}</div>
                                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Shield size={12} /> Root Access
                                </div>
                            </div>
                        )}
                        {sidebarOpen && (
                            <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#ef4444'} onMouseOut={e => e.currentTarget.style.color = '#64748b'} title="Logout">
                                <LogOut size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div style={{
                flex: 1,
                marginLeft: sidebarOpen ? '280px' : '80px',
                transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0
            }}>
                {/* Top Navigation Bar */}
                <header style={{
                    height: '76px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid #e2e8f0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 2.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
                            {navGroups.flatMap(g => g.items).find(i => isActive(i.path))?.label || 'Platform Control'}
                        </h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <NotificationDropdown />
                    </div>
                </header>

                {/* Page Content */}
                <main style={{ flex: 1, padding: '2.5rem', overflowX: 'hidden' }}>
                    <div style={{ maxWidth: '1600px', margin: '0 auto', position: 'relative' }}>
                        <Routes>
                            <Route path="/" element={<AdminOverview />} />
                            <Route path="users" element={<UserManagement />} />

                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
