import React, { useEffect, useRef } from 'react';
import {
  CheckCircle2, ShieldCheck, User, Hash, Clock,
  Lock, ArrowRight, Sparkles, Check, FileCheck, Award
} from 'lucide-react';

/**
 * VoteSuccessModal
 * 
 * Pops up immediately after a voter casts their anonymous ballot.
 * Prominently displays:
 * 1. "Successfully Voted" celebratory confirmation.
 * 2. Official details of the voter who cast the ballot.
 * 3. Their REGISTERED Face image (the enrolled reference photo from the database,
 *    strictly NOT the webcam frame captured during kiosk verification check-in).
 * 4. Cryptographic receipt verification hash for auditability.
 * 5. A prominent "Done" button that resets all session state and returns to
 *    the original kiosk state ready for the next new voter.
 */
const VoteSuccessModal = ({
  isOpen,
  voterDetails,
  receipt,
  onDone
}) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Focus on dialog for accessibility
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Format Registered Face Image Source
  const rawFace = voterDetails?.registered_face_image;
  const faceSrc = rawFace
    ? (rawFace.startsWith('data:') ? rawFace : `data:image/jpeg;base64,${rawFace}`)
    : null;

  const voterName = voterDetails?.name || 'Registered Voter';
  const voterId = voterDetails?.voter_id || 'VOTER-ID';
  const aadhaarLast4 = voterDetails?.aadhaar_last4 || '••••';
  const age = voterDetails?.age || '--';
  const mobile = voterDetails?.mobile
    ? (voterDetails.mobile.length === 10
        ? `+91 ••••• ${voterDetails.mobile.slice(6)}`
        : voterDetails.mobile)
    : '--';

  const receiptHash = receipt?.receipt_hash || 'SHA256-VOTE-CONFIRMED';
  const timestamp = receipt?.timestamp || new Date().toLocaleString();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
      ref={dialogRef}
      tabIndex={-1}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(5, 10, 24, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        overflowY: 'auto'
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '680px',
          width: '100%',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 29, 0.98) 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(16, 185, 129, 0.45)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 50px rgba(16, 185, 129, 0.25)',
          padding: '2.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          animation: 'votePopupAppear 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
      >
        {/* Top Glow Ribbon */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '10%',
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #10b981, #06b6d4, transparent)',
            borderRadius: '999px'
          }}
        />

        {/* Header: Celebratory Title & Status */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 35px rgba(16, 185, 129, 0.55)',
              marginBottom: '1rem'
            }}
          >
            <CheckCircle2 size={40} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.85rem',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.5rem'
            }}
          >
            <Sparkles size={13} />
            Official Ballot Successfully Recorded
          </div>

          <h2
            id="success-modal-title"
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              margin: '0 0 0.35rem 0'
            }}
          >
            Vote Cast Successfully!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, maxWidth: '480px' }}>
            Thank you for participating in the election. Your anonymous vote has been confirmed and sealed.
          </p>
        </div>

        {/* Registered Person Details Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          {/* Card Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
              paddingBottom: '0.65rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} style={{ color: 'var(--accent-cyan)' }} />
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Voter Profile & Registered Identity
              </span>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontWeight: 600
              }}
            >
              Status: VOTED
            </span>
          </div>

          {/* Profile Content: Registered Photo + Details */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: '1.25rem',
              alignItems: 'center'
            }}
          >
            {/* Registered Photo Column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
              <div
                style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(6, 182, 212, 0.6)',
                  boxShadow: '0 4px 15px rgba(6, 182, 212, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                {faceSrc ? (
                  <img
                    src={faceSrc}
                    alt={`Registered biometric photo for ${voterName}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(16, 185, 129, 0.15))',
                      color: 'var(--accent-cyan)'
                    }}
                  >
                    <User size={40} />
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Official ID
                    </span>
                  </div>
                )}
              </div>

              {/* Explicit badge stating Registered Face vs Captured Face */}
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  textAlign: 'center',
                  lineHeight: 1.2
                }}
              >
                Registered Photo
              </div>
            </div>

            {/* Voter Data Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.65rem 1rem',
                fontSize: '0.85rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                  Full Legal Name
                </span>
                <strong style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700 }}>
                  {voterName}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                  Voter Identification (ID)
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700,
                    fontSize: '0.92rem'
                  }}
                >
                  {voterId}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                  National ID / Aadhaar
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  XXXX-XXXX-{aadhaarLast4}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                  Age & Eligibility
                </span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>
                  {age} yrs • Verified Eligible
                </span>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                  Registered Mobile
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  {mobile}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
              paddingTop: '0.5rem',
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <ShieldCheck size={13} style={{ color: '#34d399', flexShrink: 0 }} />
            <span>
              Photo verified from official registration database (not temporary kiosk camera frame).
            </span>
          </div>
        </div>

        {/* Cryptographic Digital Receipt Card */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            fontSize: '0.825rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Hash size={14} style={{ color: 'var(--accent-cyan)' }} /> Receipt Verification Hash:
            </span>
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
              {receiptHash}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={14} /> Recorded Timestamp:
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {timestamp}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} style={{ color: '#34d399' }} /> Ballot Anonymity:
            </span>
            <span style={{ color: '#34d399', fontWeight: 600 }}>
              Cryptographically Unlinked from Voter Identity
            </span>
          </div>
        </div>

        {/* Primary Action Button: DONE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={onDone}
            className="btn btn-primary"
            style={{
              padding: '0.95rem 2rem',
              fontSize: '1.1rem',
              fontWeight: 800,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
          >
            <Check size={22} strokeWidth={2.8} />
            Done
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            Clicking <strong>Done</strong> safely ends this session and returns the kiosk to the welcome screen for the next voter.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes votePopupAppear {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(24px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default VoteSuccessModal;
