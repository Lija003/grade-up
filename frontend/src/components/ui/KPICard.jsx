import React from 'react';

const KPICard = ({ title, value, icon, trend, trendLabel, isLoading }) => {
    if (isLoading) {
        return (
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', minHeight: '130px' }}>
                <div className="skeleton-line" style={{ width: '40%', height: '1rem' }} />
                <div className="skeleton-line" style={{ width: '60%', height: '2.5rem' }} />
                <div className="skeleton-line" style={{ width: '30%', height: '0.9rem' }} />
            </div>
        );
    }

    const isPositive = trend > 0;
    const isNegative = trend < 0;
    const trendColor = isPositive ? '#10b981' : isNegative ? '#ef4444' : '#64748b';
    const trendIcon = isPositive ? '▲' : isNegative ? '▼' : '−';

    return (
        <div className="card hover-scale kpi-card" style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--surface)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    {title}
                </h4>
                <div style={{
                    padding: '0.5rem',
                    background: 'var(--bg-main)',
                    borderRadius: '8px',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {icon}
                </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1' }}>
                    {value}
                </div>


            </div>
        </div>
    );
};

export default KPICard;
