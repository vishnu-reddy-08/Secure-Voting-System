import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ message = "Processing biometric data..." }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      gap: '1rem',
      color: 'var(--text-secondary)'
    }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Loader2 size={42} style={{
          animation: 'spin 1.2s linear infinite',
          color: 'var(--accent-cyan)'
        }} />
      </div>
      <p style={{ fontSize: '0.95rem', fontWeight: 500, letterSpacing: '0.02em' }}>{message}</p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingState;
