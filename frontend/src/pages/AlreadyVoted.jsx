import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

const AlreadyVoted = () => {
  const navigate = useNavigate();
  const voterName = sessionStorage.getItem('already_voted_name') || 'Voter';

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      background: 'radial-gradient(circle at 50% 35%, rgba(244, 63, 94, 0.12) 0%, transparent 65%)'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '620px',
        width: '100%',
        padding: '3.5rem 3rem',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
        border: '1px solid rgba(244, 63, 94, 0.4)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(244, 63, 94, 0.2)'
      }}>
        {/* Warning Icon */}
        <div style={{
          display: 'inline-flex',
          padding: '1.25rem',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f43f5e, #be123c)',
          color: '#ffffff',
          marginBottom: '1.75rem',
          boxShadow: 'var(--glow-rose)'
        }}>
          <ShieldAlert size={52} />
        </div>

        <span className="badge badge-danger" style={{ marginBottom: '1rem', padding: '0.35rem 0.85rem' }}>
          Duplicate Vote Prevented
        </span>

        <h1 style={{
          fontSize: '2.2rem',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-0.02em',
          marginBottom: '0.75rem'
        }}>
          ALREADY VOTED
        </h1>

        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: '2rem'
        }}>
          Hello <strong style={{ color: '#ffffff' }}>{voterName}</strong>. Our multimodal biometric system has verified your identity, but our records confirm that you have <strong>already cast your ballot</strong> in this election.
        </p>

        <div style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          textAlign: 'left',
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          marginBottom: '2.5rem'
        }}>
          <strong style={{ color: '#fb7185', display: 'block', marginBottom: '0.25rem' }}>
            One-Person, One-Vote Policy:
          </strong>
          Under election protocol, every verified citizen is entitled to exactly one non-repeatable ballot. To ensure ballot privacy, past candidate choices are never exposed.
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/vote')}
            className="btn btn-secondary"
            style={{ padding: '0.85rem 1.75rem' }}
          >
            <ArrowLeft size={18} /> Return to Kiosk
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlreadyVoted;
