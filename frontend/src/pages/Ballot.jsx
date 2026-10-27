import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api from '../services/api';
import CandidateCard from '../components/CandidateCard';
import ConfirmationModal from '../components/ConfirmationModal';
import VoteSuccessModal from '../components/VoteSuccessModal';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { Vote, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

const Ballot = () => {
  const navigate = useNavigate();
  const sessionToken = sessionStorage.getItem('voting_session');
  const voterName = sessionStorage.getItem('voter_name') || 'Voter';

  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  // Post-vote success popup state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [voteReceipt, setVoteReceipt] = useState(null);
  const [voterDetails, setVoterDetails] = useState(() => {
    try {
      const stored = sessionStorage.getItem('voter_details');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!sessionToken && !showSuccessModal) {
      navigate('/vote/verify');
      return;
    }

    const fetchBallot = async () => {
      try {
        const res = await api.get('/voting/ballot-info', {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
        setElection(res.data.election);
        setCandidates(res.data.candidates);
        if (res.data.voter_details) {
          setVoterDetails(res.data.voter_details);
          sessionStorage.setItem('voter_details', JSON.stringify(res.data.voter_details));
        }
        if (res.data.expires_at) {
          const remaining = Math.max(0, Math.floor(res.data.expires_at - (Date.now() / 1000)));
          setTimeLeft(remaining);
        }
      } catch (err) {
        setError(err.message || "Failed to load active ballot or session expired");
      } finally {
        setLoading(false);
      }
    };

    if (sessionToken) {
      fetchBallot();
    }
  }, [sessionToken, navigate, showSuccessModal]);

  // Countdown timer for session expiration
  useEffect(() => {
    if (showSuccessModal) return; // Keep modal visible after voting completes
    if (timeLeft <= 0) {
      sessionStorage.removeItem('voting_session');
      navigate('/vote');
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, navigate, showSuccessModal]);

  const handleCandidateSelect = (cand) => {
    setSelectedCandidate(cand);
  };

  const handleCastVote = async () => {
    if (!selectedCandidate) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/voting/cast', {
        session_token: sessionToken,
        candidate_id: selectedCandidate.candidate_id
      });

      // Clear session token from storage immediately after casting
      sessionStorage.removeItem('voting_session');
      const receiptData = res.data;
      sessionStorage.setItem('vote_receipt', JSON.stringify(receiptData));

      // Capture and persist voter details with registered face image
      let currentVoter = voterDetails;
      if (receiptData?.voter_details) {
        currentVoter = receiptData.voter_details;
        sessionStorage.setItem('voter_details', JSON.stringify(currentVoter));
        setVoterDetails(currentVoter);
      }
      setVoteReceipt(receiptData);

      // Close confirmation modal & show Successfully Voted popup modal
      setShowModal(false);
      setShowSuccessModal(true);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
    } catch (err) {
      setError(err.message || 'Failed to record vote');
      setShowModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // When user hits "Done" in the popup, reset everything and return to kiosk landing for next voter
  const handleDone = () => {
    sessionStorage.clear();
    navigate('/vote', { replace: true });
  };

  if (loading) return <LoadingState message="Loading official ballot paper..." />;
  if (error) return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '1rem' }}>
      <ErrorState title="Session Terminated" message={error} onRetry={() => navigate('/vote')} />
    </div>
  );

  const formatMinutes = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{
      flex: 1,
      maxWidth: '860px',
      margin: '0 auto',
      padding: '2.5rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      {/* Top Banner with Election Title and Session Timer */}
      <div className="glass-panel" style={{
        padding: '1.5rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        border: '1px solid rgba(56, 189, 248, 0.3)'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Official Electronic Ballot
          </span>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {election?.name || "General Election 2026"}
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Voter Authenticated • One Single-Use Vote Authorized
          </p>
        </div>

        {/* Timer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-full)',
          background: timeLeft < 60 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          border: timeLeft < 60 ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-color)',
          color: timeLeft < 60 ? '#fb7185' : 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700
        }}>
          <Clock size={18} style={{ color: timeLeft < 60 ? '#fb7185' : 'var(--accent-cyan)' }} />
          <span>Session: {formatMinutes(timeLeft)}</span>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)',
        fontSize: '0.875rem',
        color: 'var(--text-secondary)'
      }}>
        Select your preferred candidate tile below. Click <strong>Review & Confirm Vote</strong> to cast your anonymous ballot.
      </div>

      {/* Candidate Tiles List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {candidates.map((cand) => (
          <CandidateCard
            key={cand.candidate_id}
            candidate={cand}
            isSelected={selectedCandidate?.candidate_id === cand.candidate_id}
            onSelect={handleCandidateSelect}
          />
        ))}
      </div>

      {/* Bottom Submit Actions */}
      <div style={{
        position: 'sticky',
        bottom: '1.5rem',
        background: 'rgba(10, 15, 29, 0.95)',
        backdropFilter: 'blur(16px)',
        padding: '1.25rem 2rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '1rem'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Selection:</span>
          <p style={{ fontWeight: 700, color: selectedCandidate ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {selectedCandidate ? selectedCandidate.name : "No candidate selected"}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          disabled={!selectedCandidate || isSubmitting}
          className="btn btn-success"
          style={{
            padding: '0.85rem 2rem',
            fontSize: '1rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <Vote size={20} /> Review & Confirm Vote
        </button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showModal}
        candidate={selectedCandidate}
        isSubmitting={isSubmitting}
        onCancel={() => setShowModal(false)}
        onConfirm={handleCastVote}
      />

      {/* Post-Vote Success Popup Modal */}
      <VoteSuccessModal
        isOpen={showSuccessModal}
        voterDetails={voterDetails}
        receipt={voteReceipt}
        onDone={handleDone}
      />
    </div>
  );
};

export default Ballot;
