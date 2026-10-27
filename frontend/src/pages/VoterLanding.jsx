import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Fingerprint, Shield, ShieldCheck, Users, FileCheck2, ArrowRight } from 'lucide-react';

const VoterLanding = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      background: 'radial-gradient(circle at 50% 35%, rgba(6, 182, 212, 0.1) 0%, transparent 65%)'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '740px',
        width: '100%',
        padding: '3.5rem 3rem',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(6, 182, 212, 0.15)',
        backdropFilter: 'blur(20px)',
        background: 'rgba(15, 23, 42, 0.82)'
      }}>
        {/* Emblem / Badge */}
        <div style={{
          display: 'inline-flex',
          padding: '1.25rem',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
          color: '#ffffff',
          marginBottom: '1.5rem',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.45)'
        }}>
          <Fingerprint size={48} />
        </div>

        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          marginBottom: '0.5rem'
        }}>
          SECURE VOTING SYSTEM
        </h1>

        {/* Official Tagline from Flag Banner */}
        <p style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--accent-cyan)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginBottom: '1.25rem'
        }}>
          Your Vote &nbsp;|&nbsp; Your Voice &nbsp;|&nbsp; A Stronger Democracy
        </p>

        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          maxWidth: '560px',
          margin: '0 auto 2.25rem auto',
          lineHeight: 1.6
        }}>
          Welcome to the official electronic ballot station. Please step forward to authenticate your identity using contactless multimodal <strong>Face & Iris Recognition</strong>.
        </p>

        {/* 4 Feature Pillars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.85rem',
          marginBottom: '2.75rem',
          textAlign: 'center'
        }}>
          <div style={{ padding: '1.1rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Shield size={26} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.2rem' }}>Secure</h4>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Biometric Anti-Spoofing</p>
          </div>

          <div style={{ padding: '1.1rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <ShieldCheck size={26} style={{ color: 'var(--accent-emerald)' }} />
            </div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.2rem' }}>Transparent</h4>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Audit Log Verification</p>
          </div>

          <div style={{ padding: '1.1rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Users size={26} style={{ color: 'var(--accent-indigo)' }} />
            </div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.2rem' }}>Fair</h4>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>1 Person 1 Vote Guard</p>
          </div>

          <div style={{ padding: '1.1rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <FileCheck2 size={26} style={{ color: '#f59e0b' }} />
            </div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.2rem' }}>Trusted</h4>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Encrypted Anonymous Ballot</p>
          </div>
        </div>

        {/* Call to action */}
        <button
          onClick={() => navigate('/vote/verify')}
          className="btn btn-primary"
          style={{
            padding: '1.1rem 2.5rem',
            fontSize: '1.15rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-full)',
            boxShadow: '0 8px 30px rgba(14, 165, 233, 0.4)',
            letterSpacing: '0.02em'
          }}
        >
          Begin Biometric Verification <ArrowRight size={22} />
        </button>
      </div>
    </div>
  );
};

export default VoterLanding;
