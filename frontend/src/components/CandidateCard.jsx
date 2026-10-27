import React from 'react';
import { Flame, Rocket, Trees, Ban, Check, Award } from 'lucide-react';

const symbolIcons = {
  Torch: Flame,
  Rocket: Rocket,
  Tree: Trees,
  Prohibition: Ban,
  default: Award
};

const CandidateCard = ({ candidate, isSelected, onSelect }) => {
  const IconComponent = symbolIcons[candidate.symbol] || symbolIcons.default;
  const isNOTA = candidate.candidate_id === 'CAND-NOTA' || candidate.name.includes('NOTA');

  return (
    <div
      onClick={() => onSelect(candidate)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(candidate); }}
      className="glass-panel"
      style={{
        padding: '1.5rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-md)',
        border: isSelected ? '2px solid #06b6d4' : '1px solid var(--border-color)',
        background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-card)',
        boxShadow: isSelected ? '0 0 25px rgba(6, 182, 212, 0.35)' : 'none',
        transform: isSelected ? 'scale(1.01)' : 'scale(1)',
        transition: 'all var(--transition-normal)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Ballot Order Number */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: isSelected ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.08)',
          color: isSelected ? '#0a0f1d' : 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '1.1rem'
        }}>
          {candidate.ballot_order || 1}
        </div>

        {/* Candidate Symbol Icon */}
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: 'var(--radius-sm)',
          background: isNOTA ? 'rgba(244, 63, 94, 0.15)' : 'rgba(14, 165, 233, 0.12)',
          color: isNOTA ? 'var(--accent-rose)' : 'var(--accent-cyan)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <IconComponent size={28} />
        </div>

        {/* Candidate Details */}
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: isSelected ? '#ffffff' : 'var(--text-primary)',
            marginBottom: '0.2rem'
          }}>
            {candidate.name}
          </h3>
          <p style={{
            fontSize: '0.9rem',
            color: isNOTA ? 'var(--accent-rose)' : 'var(--accent-cyan)',
            fontWeight: 500
          }}>
            {candidate.party}
          </p>
        </div>
      </div>

      {/* Select Button / Check Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: isSelected ? '2px solid #06b6d4' : '2px solid rgba(255, 255, 255, 0.2)',
          background: isSelected ? '#06b6d4' : 'transparent',
          color: '#0a0f1d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all var(--transition-fast)'
        }}>
          {isSelected && <Check size={20} strokeWidth={3} />}
        </div>
      </div>
    </div>
  );
};

export default CandidateCard;
