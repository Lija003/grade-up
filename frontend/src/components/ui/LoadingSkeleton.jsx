import React from 'react';

export const SkeletonLine = ({ width = '100%', height = '1rem', style = {} }) => (
    <div className="skeleton-pulse" style={{
        width,
        height,
        background: 'var(--border)',
        borderRadius: '4px',
        ...style
    }} />
);

export const SkeletonCard = () => (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <SkeletonLine width="60%" height="1.5rem" />
        <SkeletonLine width="100%" height="0.875rem" />
        <SkeletonLine width="80%" height="0.875rem" />
        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            <SkeletonLine width="40%" height="2rem" />
        </div>
    </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
    <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-main)' }}>
            <SkeletonLine width="30%" height="1.5rem" />
        </div>
        <div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} style={{
                    padding: '1rem 1.5rem',
                    borderBottom: i !== rows - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex',
                    gap: '1rem'
                }}>
                    <SkeletonLine width="40%" />
                    <SkeletonLine width="20%" />
                    <SkeletonLine width="20%" />
                    <SkeletonLine width="20%" />
                </div>
            ))}
        </div>
    </div>
);

// We need to add a global CSS animation for skeleton-pulse
// This can be added to global.css
