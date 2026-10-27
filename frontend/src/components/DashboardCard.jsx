import React from 'react';

const DashboardCard = ({ title, value, subtitle, icon: Icon, color = "cyan", trend }) => {
  const colorMap = {
    cyan: { bg: 'rgba(6, 182, 212, 0.12)', text: '#38bdf8', glow: 'var(--glow-cyan)' },
    emerald: { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', glow: 'var(--glow-emerald)' },
    rose: { bg: 'rgba(244, 63, 94, 0.12)', text: '#fb7185', glow: 'var(--glow-rose)' },
    amber: { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', glow: '0 0 20px rgba(245, 158, 11, 0.25)' },
    indigo: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8', glow: '0 0 20px rgba(99, 102, 241, 0.25)' }
  };

  const theme = colorMap[color] || colorMap.cyan;

  return (
    <div className="glass-panel" style={{
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </span>
          <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {value}
          </h3>
        </div>
        {Icon && (
          <div style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            background: theme.bg,
            color: theme.text,
            boxShadow: theme.glow
          }}>
            <Icon size={24} />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {trend && (
            <span style={{ color: trend > 0 ? '#34d399' : '#fb7185', fontWeight: 700 }}>
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </span>
          )}
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
