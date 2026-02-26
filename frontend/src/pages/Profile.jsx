import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Mail, Award, Calendar, Camera, Edit2, Upload, User, Star, ShieldCheck, MapPin, Check, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', bio: '' });
    const { showNotification, confirm } = useNotifications();
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/me');
            setProfile(response.data);
            setEditForm({
                username: response.data.username || '',
                bio: response.data.bio || ''
            });
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await api.post('/users/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfile(res.data); // Update profile with new avatar
            showNotification("Avatar updated successfully", "success");
        } catch (error) {
            console.error("Upload failed", error);
            showNotification("Failed to upload image.", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put('/users/me', editForm);
            setProfile(res.data);
            setIsEditModalOpen(false);
            showNotification("Profile updated successfully", "success");
            // Update local storage or context if necessary for persistent username display 
            // dependent on implementation, usually re-fetching user context handles this
        } catch (error) {
            console.error("Update failed", error);
            showNotification(error.response?.data?.detail || "Failed to update profile.", "error");
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="spinner"></div>
        </div>
    );

    if (!profile) return <div style={{ textAlign: 'center', marginTop: '4rem', color: '#64748b' }}>Profile not found</div>;

    // Gamification Logic
    const currentPoints = profile.role === 'teacher' ? (profile.reputation || 0) : (profile.stars || 0);
    const level = Math.floor(currentPoints / 10) + 1;
    const nextLevelPoints = level * 10;
    const pointsInLevel = currentPoints % 10;
    const progress = Math.min((pointsInLevel / 10) * 100, 100);

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin': return { label: 'Administrator', color: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', icon: <ShieldCheck size={16} /> };
            case 'teacher': return { label: 'Instructor', color: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', icon: <Award size={16} /> };
            default: return { label: 'Student', color: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', icon: <User size={16} /> };
        }
    };

    const badge = getRoleBadge(profile.role);

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
            />

            {/* Glassmorphic Hero Section */}
            <div style={{
                position: 'relative',
                borderRadius: '24px',
                overflow: 'hidden',
                background: 'linear-gradient(120deg, #0f172a 0%, #1e293b 100%)',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
                marginBottom: '6rem'
            }}>
                {/* Background Pattern */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 20%)',
                }}></div>

                <div style={{ height: '200px' }}></div>

                {/* Profile Stats Floating Box */}
                <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    height: '80px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(10px)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}></div>
            </div>

            {/* Profile Content Container (Overlapping Hero) */}
            <div style={{ marginTop: '-140px', padding: '0 2rem', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    {/* Floating Avatar with Glow */}
                    <div style={{
                        position: 'relative',
                        marginBottom: '1.5rem',
                        group: 'avatar-group'
                    }}>
                        <div style={{
                            width: '160px',
                            height: '160px',
                            borderRadius: '50%',
                            padding: '4px',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'transform 0.3s ease'
                        }}
                            onClick={handleAvatarClick}
                            className="avatar-container"
                        >
                            <div style={{
                                width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
                                background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                position: 'relative'
                            }}>
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '4rem', fontWeight: '800', background: 'linear-gradient(135deg, #93c5fd 0%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        {profile.username ? profile.username.charAt(0).toUpperCase() : '?'}
                                    </span>
                                )}

                                {/* Hover Overlay */}
                                <div style={{
                                    position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    opacity: uploading ? 1 : 0,
                                    transition: 'opacity 0.2s',
                                    className: 'avatar-overlay'
                                }}>
                                    {uploading ? <div className="spinner" style={{ width: '24px', height: '24px' }}></div> : <Camera color="white" size={32} />}
                                </div>
                            </div>
                        </div>
                    </div>

                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: '800',
                        marginBottom: '0.5rem',
                        color: '#0f172a',
                        textShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        {profile.username}
                    </h1>

                    <div style={{
                        background: badge.color,
                        color: 'white',
                        padding: '0.5rem 1.2rem',
                        borderRadius: '100px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                    }}>
                        {badge.icon} {badge.label}
                    </div>
                </div>

                {/* Main Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '2rem',
                    marginTop: '3rem'
                }}>

                    {/* About Card - Hidden for Admin */}
                    {profile.role !== 'admin' && (
                        <div style={{
                            background: 'white',
                            borderRadius: '24px',
                            padding: '2rem',
                            boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)',
                            border: '1px solid #f1f5f9'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>About Me</h3>
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    style={{
                                        background: 'var(--primary-light)',
                                        color: 'var(--primary)',
                                        border: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '12px',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Edit2 size={16} /> Edit
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="profile-detail-item">
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>Email Address</div>
                                        <div style={{ color: '#334155', fontWeight: '500' }}>{profile.email}</div>
                                    </div>
                                </div>

                                <div className="profile-detail-item">
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}>
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>Member Since</div>
                                        <div style={{ color: '#334155', fontWeight: '500' }}>{new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                    </div>
                                </div>

                                <div className="profile-detail-item">
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                        <MapPin size={20} />
                                    </div>
                                    <div style={{ width: '100%' }}>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>Bio</div>
                                        <div style={{ color: '#334155', lineHeight: '1.6', marginTop: '0.25rem' }}>
                                            {profile.bio || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Tell us something about yourself...</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats Card */}
                    {profile.role === 'student' && (
                        <div style={{
                            background: 'white',
                            borderRadius: '24px',
                            padding: '2rem',
                            boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)',
                            border: '1px solid #f1f5f9',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <h3 style={{ margin: 0, marginBottom: '1.5rem', fontSize: '1.25rem', color: '#1e293b' }}>Achievements</h3>

                            <div style={{
                                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                borderRadius: '20px',
                                padding: '2rem',
                                color: 'white',
                                position: 'relative',
                                overflow: 'hidden',
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}>
                                {/* Decorative Circles */}
                                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
                                <div style={{ position: 'absolute', bottom: '-40px', left: '-20px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', position: 'relative' }}>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem' }}>Current Level</div>
                                        <div style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: 1 }}>{level}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{currentPoints}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Total {profile.role === 'teacher' ? 'Reputation' : 'Stars'}</div>
                                    </div>
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.9 }}>
                                        <span>Progress</span>
                                        <span>{Math.round(nextLevelPoints - currentPoints)} pts to Level {level + 1}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${progress}%`,
                                            height: '100%',
                                            background: '#38bdf8',
                                            borderRadius: '4px',
                                            boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)'
                                        }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '24px', width: '90%', maxWidth: '500px',
                        padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        animation: 'scaleIn 0.2s ease-out'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>Edit Profile</h3>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', transition: 'background 0.2s' }} className="hover-bg-slate-100">
                                <X size={24} color="#64748b" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>Username</label>
                                <input
                                    className="input-field"
                                    value={editForm.username}
                                    onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem 1rem',
                                        borderRadius: '12px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.95rem',
                                        marginBottom: '0.5rem'
                                    }}
                                />
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                    Unique identifier visible to others.
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>Bio</label>
                                <textarea
                                    className="input-field"
                                    rows="4"
                                    placeholder="Tell us a bit about yourself..."
                                    value={editForm.bio}
                                    onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.95rem',
                                        resize: 'vertical',
                                        fontFamily: 'inherit'
                                    }}
                                />
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                                    Brief description for your profile card.
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '12px',
                                        border: '1px solid #cbd5e1',
                                        background: 'white',
                                        color: '#475569',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '12px',
                                        fontWeight: '600',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Check size={18} /> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>
                {`
                .profile-detail-item {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }
                .avatar-container:hover {
                    transform: scale(1.05);
                }
                .avatar-container:hover .avatar-overlay {
                    opacity: 1 !important;
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .hover-bg-slate-100:hover {
                    background-color: #f1f5f9 !important;
                }
                `}
            </style>
        </div>
    );
};

export default Profile;
