import React from 'react';

const EmptyState = ({ icon, title, description, action }) => {
    return (
        <div className="card" style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px dashed var(--border)',
            background: 'rgba(255,255,255,0.5)',
            minHeight: '300px'
        }}>
            <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--bg-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                marginBottom: '1.5rem'
            }}>
                {icon}
            </div>

            <h3 style={{
                margin: '0 0 0.5rem 0',
                color: 'var(--text-main)',
                fontSize: '1.25rem',
                fontWeight: '600'
            }}>
                {title}
            </h3>

            <p style={{
                margin: '0 0 2rem 0',
                color: 'var(--text-muted)',
                maxWidth: '400px',
                lineHeight: '1.5'
            }}>
                {description}
            </p>

            {action && (
                <div>
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
