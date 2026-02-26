import React, { useState, useEffect } from 'react';
import {
    Users, UserCheck, GraduationCap, Activity, TrendingUp,
    Server, Database, Wifi, AlertTriangle, ShieldCheck
} from 'lucide-react';
import KPICard from '../../components/ui/KPICard';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../api';



const AdminOverview = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalTeachers: 0,
        totalStudents: 0,
        activeSessions: 0,
        newUsersToday: 0
    });
    const [recentUsers, setRecentUsers] = useState([]);
    const [growthData, setGrowthData] = useState([]);
    const [roleData, setRoleData] = useState([]);

    useEffect(() => {
        // Fetch real admin data
        const fetchDashboardData = async () => {
            try {
                const res = await Promise.all([
                    api.get('/users/admin/stats'),
                    api.get('/users/')
                ]);

                const dbStats = res[0].data;
                const users = res[1].data || [];

                setStats({
                    totalUsers: dbStats.totalUsers,
                    totalTeachers: dbStats.totalTeachers,
                    totalStudents: dbStats.totalStudents,
                    activeSessions: dbStats.activeSessions,
                    newUsersToday: dbStats.newUsersToday
                });

                setGrowthData(dbStats.growthData || []);
                setRoleData(dbStats.roleData || []);

                // Top 5 recent registrations
                // Reverse to get the most recent ones
                setRecentUsers(users.slice().reverse().slice(0, 5));
            } catch (err) {
                console.error("Failed to load admin stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);



    return (
        <ErrorBoundary>
            <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>

                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 0.25rem 0', color: '#0f172a' }}>
                        Command Center
                    </h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
                        Platform metrics, user activity, and system health at a glance.
                    </p>
                </div>

                {/* Top KPI Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <KPICard
                        title="Total Active Users"
                        value={stats.totalUsers.toLocaleString()}
                        icon={<Users size={24} />}
                        trend={12}
                        isLoading={loading}
                        color="#3b82f6"
                    />
                    <KPICard
                        title="Registered Teachers"
                        value={stats.totalTeachers.toLocaleString()}
                        icon={<UserCheck size={24} />}
                        trend={4}
                        isLoading={loading}
                        color="#10b981"
                    />
                    <KPICard
                        title="Registered Students"
                        value={stats.totalStudents.toLocaleString()}
                        icon={<GraduationCap size={24} />}
                        trend={15}
                        isLoading={loading}
                        color="#8b5cf6"
                    />
                    <KPICard
                        title="Live Sessions"
                        value={stats.activeSessions.toLocaleString()}
                        icon={<Activity size={24} />}
                        trend={-2}
                        trendLabel="vs last hour"
                        isLoading={loading}
                        color="#f59e0b"
                    />
                    <KPICard
                        title="Signups Today"
                        value={`+${stats.newUsersToday}`}
                        icon={<TrendingUp size={24} />}
                        isLoading={loading}
                        color="#ec4899"
                    />
                </div>

                {/* Analytics Charts Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>

                    {/* User Growth Area Chart */}
                    <div className="card" style={{ padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>Platform Growth</h3>
                            <select style={{ border: '1px solid #e2e8f0', background: '#f8fafc', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.85rem', color: '#475569', outline: 'none' }}>
                                <option>Last 7 Days</option>
                                <option>Last 30 Days</option>
                                <option>Year to Date</option>
                            </select>
                        </div>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Role Distribution Pie Chart */}
                    <div className="card" style={{ padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', marginBottom: '1.5rem', color: '#0f172a', fontWeight: '700' }}>Account Distribution</h3>
                        <div style={{ height: '300px', width: '100%', position: 'relative' }}>
                            {loading ? (
                                <div className="skeleton-pulse" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={roleData}
                                                cx="50%"
                                                cy="45%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {roleData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>{stats.totalUsers}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total</div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Operations Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '1.5rem' }}>

                    {/* Recent Registrations Table */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>Recent Registrations</h3>
                            <button className="btn" style={{ background: 'transparent', color: '#3b82f6', fontWeight: '600', padding: 0, fontSize: '0.9rem' }}>View Directory</button>
                        </div>
                        {loading ? (
                            <div style={{ padding: '1.5rem' }}><div className="skeleton-pulse" style={{ height: '150px', borderRadius: '8px' }} /></div>
                        ) : recentUsers.length === 0 ? (
                            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#94a3b8' }}>No recent users found.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>User</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Role</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Account Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentUsers.map((user, i) => (
                                        <tr key={user.id} style={{ borderBottom: i !== recentUsers.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.9rem' }}>{user.username}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email || `user${user.id}@gradeup.edu`}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{
                                                    background: user.role === 'teacher' ? '#dcfce7' : user.role === 'admin' ? '#f3e8ff' : '#eff6ff',
                                                    color: user.role === 'teacher' ? '#166534' : user.role === 'admin' ? '#6b21a8' : '#1e40af',
                                                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize'
                                                }}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#166534', fontWeight: '500' }}>
                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /> Active
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                </div>
            </div>
        </ErrorBoundary>
    );
};

export default AdminOverview;
