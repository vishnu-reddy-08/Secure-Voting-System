import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ isOpen, title, message, candidate, onConfirm, onCancel, confirmText = "Confirm Vote", isSubmitting = false }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(14, 165, 233, 0.2)',
        animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            padding: '0.65rem',
            borderRadius: '50%',
            background: 'rgba(14, 165, 233, 0.15)',
            color: 'var(--accent-cyan)'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700 }}>{title || "Confirm Your Ballot"}</h3>
        </div>

        {candidate && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selected Candidate</p>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>{candidate.name}</h4>
            <p style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.95rem' }}>{candidate.party}</p>
          </div>
        )}

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          lineHeight: 1.5,
          marginBottom: '1.75rem'
        }}>
          {message || "Once confirmed, your anonymous vote will be sealed into the cryptographic ballot ledger. This action is irreversible."}
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="btn btn-success"
            style={{ flex: 1.5, fontWeight: 700, letterSpacing: '0.02em' }}
          >
            {isSubmitting ? "Sealing Ballot..." : confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmationModal;
