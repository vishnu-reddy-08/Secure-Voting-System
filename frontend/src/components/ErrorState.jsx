import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

const ErrorState = ({ title = "Error", message, onRetry }) => {
  return (
    <div style={{
      background: 'rgba(244, 63, 94, 0.1)',
      border: '1px solid rgba(244, 63, 94, 0.3)',
      borderRadius: 'var(--radius-md)',
      padding: '1.25rem 1.5rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem',
      color: '#ffffff',
      margin: '1rem 0'
    }}>
      <AlertCircle size={24} style={{ color: 'var(--accent-rose)', flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <h4 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{title}</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
        >
          <RotateCcw size={14} /> Retry
        </button>
      )}
    </div>
  );
};

export default ErrorState;
