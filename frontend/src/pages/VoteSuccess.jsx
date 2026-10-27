import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import VoteSuccessModal from '../components/VoteSuccessModal';

const VoteSuccess = () => {
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [voterDetails, setVoterDetails] = useState(null);

  useEffect(() => {
    const rawReceipt = sessionStorage.getItem('vote_receipt');
    if (rawReceipt) {
      try {
        setReceipt(JSON.parse(rawReceipt));
      } catch (e) {
        console.error(e);
      }
    }

    const rawVoter = sessionStorage.getItem('voter_details');
    if (rawVoter) {
      try {
        setVoterDetails(JSON.parse(rawVoter));
      } catch (e) {
        console.error(e);
      }
    }

    // Trigger subtle celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const handleDone = () => {
    // Clear all session storage so kiosk returns to clean original state for new user
    sessionStorage.clear();
    navigate('/vote', { replace: true });
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh'
    }}>
      <VoteSuccessModal
        isOpen={true}
        voterDetails={voterDetails}
        receipt={receipt}
        onDone={handleDone}
      />
    </div>
  );
};

export default VoteSuccess;
