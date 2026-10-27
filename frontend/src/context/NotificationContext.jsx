import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const notify = useCallback((type, message, duration = 4000) => {
    const id = ++counterRef.current;
    setNotifications(prev => [...prev, { id, type, message, duration }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const api = {
    error:   (msg, dur) => notify('error', msg, dur),
    success: (msg, dur) => notify('success', msg, dur),
    warning: (msg, dur) => notify('warning', msg, dur),
    info:    (msg, dur) => notify('info', msg, dur),
    dismiss,
  };

  return (
    <NotificationContext.Provider value={api}>
      {children}
      <NotificationStack notifications={notifications} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used inside <NotificationProvider>');
  return ctx;
};

/* ── Inline stack renderer ── */
const TYPE_CONFIG = {
  error:   { bg: 'rgba(244,63,94,0.15)',  border: 'rgba(244,63,94,0.45)',  bar: '#f43f5e', icon: '✕', iconBg: 'rgba(244,63,94,0.25)',  label: 'Error'   },
  success: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.45)', bar: '#10b981', icon: '✓', iconBg: 'rgba(16,185,129,0.25)', label: 'Success' },
  warning: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.45)', bar: '#f59e0b', icon: '!', iconBg: 'rgba(245,158,11,0.25)', label: 'Warning' },
  info:    { bg: 'rgba(6,182,212,0.15)',  border: 'rgba(6,182,212,0.45)',  bar: '#06b6d4', icon: 'i', iconBg: 'rgba(6,182,212,0.25)',  label: 'Info'    },
};

const NotificationStack = ({ notifications, onDismiss }) => (
  <>
    <style>{`
      @keyframes nSlideIn {
        from { opacity: 0; transform: translateX(120%); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes nFadeOut {
        from { opacity: 1; }
        to   { opacity: 0; transform: translateX(120%); }
      }
      @keyframes nBar {
        from { width: 100%; }
        to   { width: 0%; }
      }
    `}</style>
    <div style={{
      position: 'fixed',
      top: '1.25rem',
      right: '1.25rem',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxWidth: '400px',
      width: 'calc(100vw - 2.5rem)',
      pointerEvents: 'none',
    }}>
      {notifications.map(n => (
        <NotificationItem key={n.id} n={n} onDismiss={onDismiss} />
      ))}
    </div>
  </>
);

const NotificationItem = ({ n, onDismiss }) => {
  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
  return (
    <div style={{
      pointerEvents: 'all',
      background: 'rgba(10,15,29,0.97)',
      border: `1px solid ${cfg.border}`,
      borderRadius: '14px',
      boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${cfg.border}`,
      backdropFilter: 'blur(20px)',
      overflow: 'hidden',
      animation: 'nSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
    }}>
      {/* Body */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', padding: '1rem 1rem 0.85rem' }}>
        {/* Icon */}
        <div style={{
          flexShrink: 0,
          width: '34px', height: '34px',
          borderRadius: '50%',
          background: cfg.iconBg,
          border: `1px solid ${cfg.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '1rem',
          color: cfg.bar,
        }}>
          {cfg.icon}
        </div>
        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.85rem', color: cfg.bar, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
            {cfg.label}
          </p>
          <p style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.45, wordBreak: 'break-word' }}>
            {n.message}
          </p>
        </div>
        {/* Close */}
        <button
          onClick={() => onDismiss(n.id)}
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.8rem',
            width: '26px', height: '26px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >✕</button>
      </div>
      {/* Progress bar */}
      {n.duration > 0 && (
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)' }}>
          <div style={{
            height: '100%',
            background: cfg.bar,
            animation: `nBar ${n.duration}ms linear forwards`,
            borderRadius: '0 0 14px 14px',
          }} />
        </div>
      )}
    </div>
  );
};
