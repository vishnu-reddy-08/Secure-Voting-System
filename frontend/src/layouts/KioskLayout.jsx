import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Fingerprint, Clock, Lock } from 'lucide-react';

const KioskLayout = () => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'transparent',
      color: 'var(--text-primary)',
      userSelect: 'none'
    }}>
      {/* Top Kiosk Header */}
      <header style={{
        height: '68px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            color: '#ffffff',
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.35)'
          }}>
            <Fingerprint size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.02em' }}>
              SECURE VOTING SYSTEM TERMINAL
            </h1>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Multimodal Face + Iris Verification Protocol • Zero Tracking Ballot
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>
            <Clock size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span>{timeStr}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="badge badge-success">
              <Lock size={12} /> SECURE BOOTH
            </span>
          </div>
        </div>
      </header>

      {/* Full-Screen Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>

      {/* Disturbance-Free Bottom Disclaimer Footer */}
      <footer style={{
        padding: '0.75rem 2rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(10, 15, 29, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <div>
          <span>Academic Final-Year Project Prototype • Not for Real Government Elections</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Admin Access
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default KioskLayout;
