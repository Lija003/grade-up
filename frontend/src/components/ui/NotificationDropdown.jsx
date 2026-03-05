import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, ShieldAlert, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import api from '../../api';

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get('/notifications/');
            setNotifications(res.data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every minute for new notifications
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error("Failed to clear notifications:", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const getIconPrefix = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={16} color="#10b981" />;
            case 'error': return <ShieldAlert size={16} color="#ef4444" />;
            case 'warning': return <AlertTriangle size={16} color="#f59e0b" />;
            default: return <Info size={16} color="#3b82f6" />;
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen && unreadCount > 0) {
                        fetchNotifications(); // Refresh on open
                    }
                }}
                style={{
                    position: 'relative', background: isOpen ? '#f1f5f9' : 'transparent',
                    border: 'none', color: isOpen ? '#0f172a' : '#64748b', cursor: 'pointer',
                    padding: '0.5rem', borderRadius: '50%', transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.color = '#0f172a'}
                onMouseOut={e => e.currentTarget.style.color = isOpen ? '#0f172a' : '#64748b'}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: 2, right: 2, background: '#ef4444',
                        color: 'white', fontSize: '0.6rem', fontWeight: 'bold',
                        borderRadius: '50%', width: 16, height: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid white'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="animate-fade-in" style={{
                    position: 'absolute', top: '120%', right: 0, width: '350px',
                    background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    zIndex: 100, overflow: 'hidden'
                }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '700' }}>Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', padding: 0 }}>
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {loading && notifications.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <Bell size={32} opacity={0.3} />
                                <span>You're all caught up!</span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {notifications.map((notif, index) => (
                                    <div
                                        key={notif.id}
                                        style={{
                                            padding: '1rem',
                                            borderBottom: index !== notifications.length - 1 ? '1px solid #f1f5f9' : 'none',
                                            background: notif.is_read ? 'white' : '#f0f9ff',
                                            display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                                            transition: 'background 0.2s', cursor: 'pointer'
                                        }}
                                        onClick={() => !notif.is_read && markAsRead(notif.id)}
                                        onMouseOver={e => e.currentTarget.style.background = notif.is_read ? '#f8fafc' : '#e0f2fe'}
                                        onMouseOut={e => e.currentTarget.style.background = notif.is_read ? 'white' : '#f0f9ff'}
                                    >
                                        <div style={{ padding: '0.25rem', background: 'white', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                                            {getIconPrefix(notif.type)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: notif.is_read ? '600' : '700', color: '#0f172a' }}>{notif.title}</h4>
                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: notif.is_read ? '#64748b' : '#334155', lineHeight: '1.4' }}>
                                                {notif.message}
                                            </p>
                                        </div>
                                        {!notif.is_read && (
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', alignSelf: 'center', flexShrink: 0 }} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {notifications.length > 5 && (
                        <div style={{ padding: '0.75rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Showing up to 30 days of history</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
