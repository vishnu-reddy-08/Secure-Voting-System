import React from 'react';
import { CheckCircle2, XCircle, Loader2, Circle } from 'lucide-react';

const VerificationStatus = ({ currentStep = 0, error = null }) => {
  const steps = [
    { label: "Camera Initializing", description: "Sensor calibration" },
    { label: "Face Detection & Quality", description: "Centering & blur check" },
    { label: "Face Verification (ArcFace)", description: "512-d feature cosine match" },
    { label: "Iris Localization & Daugman Scan", description: "Pupil segmentation & Gabor code" },
    { label: "Iris Verification", description: "Hamming distance comparison" },
    { label: "Voter Eligibility & Anti-Duplicate", description: "Verifying active & one-person-one-vote" }
  ];

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', width: '100%', maxWidth: '480px' }}>
      <h4 style={{
        fontSize: '0.85rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-secondary)',
        marginBottom: '1.25rem',
        fontWeight: 700
      }}>
        Multimodal Biometric Pipeline Status
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {steps.map((step, idx) => {
          let status = 'pending'; // 'pending' | 'active' | 'completed' | 'error'
          if (idx < currentStep) status = 'completed';
          else if (idx === currentStep) {
            status = error ? 'error' : 'active';
          }

          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div>
                {status === 'completed' && (
                  <CheckCircle2 size={20} style={{ color: 'var(--accent-emerald)' }} />
                )}
                {status === 'active' && (
                  <Loader2 size={20} style={{ color: 'var(--accent-cyan)', animation: 'spin 1.5s linear infinite' }} />
                )}
                {status === 'error' && (
                  <XCircle size={20} style={{ color: 'var(--accent-rose)' }} />
                )}
                {status === 'pending' && (
                  <Circle size={20} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: '0.9rem',
                  fontWeight: status === 'active' ? 700 : 500,
                  color: status === 'completed' ? 'var(--text-primary)' : status === 'active' ? 'var(--accent-cyan)' : 'var(--text-muted)'
                }}>
                  {step.label}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {step.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{
          marginTop: '1.25rem',
          padding: '0.85rem 1rem',
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          color: '#ffffff',
          lineHeight: 1.4
        }}>
          <strong>Verification Alert:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default VerificationStatus;
