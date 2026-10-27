import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import FaceCaptureModal from '../components/FaceCaptureModal';
import VerificationStatus from '../components/VerificationStatus';
import ErrorState from '../components/ErrorState';
import { ShieldCheck, Sparkles, RefreshCw, Eye, UserCheck, AlertTriangle } from 'lucide-react';

const VoterVerify = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [challenge, setChallenge] = useState("Look directly into the camera");
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);

  useEffect(() => {
    // Fetch liveness challenge
    api.get('/biometric/liveness-challenge')
      .then(res => {
        if (res.data && res.data.instruction) {
          setChallenge(res.data.instruction);
        }
      })
      .catch(err => console.warn("Liveness challenge fallback:", err));
  }, []);

  const handleStartVerification = async (frameBase64) => {
    setIsCaptureModalOpen(false);
    setError(null);
    setIsScanning(true);
    setCurrentStep(1);

    try {
      if (!frameBase64) throw new Error("Biometric frame missing");

      // Step 2 & 3: Face detection & verification
      setCurrentStep(2);
      await new Promise(r => setTimeout(r, 600)); // Smooth UX transition
      setCurrentStep(3);

      // Step 4 & 5: Iris localization & verification
      await new Promise(r => setTimeout(r, 600));
      setCurrentStep(4);

      // Call multimodal backend endpoint
      const res = await api.post('/biometric/verify-multimodal', {
        face_image_base64: frameBase64,
        iris_image_base64: frameBase64
      });

      // Step 6: Eligibility & anti-duplicate check
      setCurrentStep(5);
      await new Promise(r => setTimeout(r, 400));

      if (res.data.success) {
        setCurrentStep(6);
        // Store short-lived voting session in sessionStorage
        sessionStorage.setItem('voting_session', res.data.session_token);
        sessionStorage.setItem('voter_name', res.data.voter_name || 'Voter');
        if (res.data.voter_details) {
          sessionStorage.setItem('voter_details', JSON.stringify(res.data.voter_details));
        }
        
        setTimeout(() => {
          navigate('/vote/ballot');
        }, 1000);
      } else {
        // Handle specific rejection cases
        if (res.data.reason === 'ALREADY_VOTED') {
          sessionStorage.setItem('already_voted_name', res.data.voter_name || 'Voter');
          navigate('/vote/already-voted');
        } else {
          setError(res.data.message || "Biometric verification failed. Face or iris does not match.");
        }
      }
    } catch (err) {
      setError(err.message || "Biometric pipeline communication error");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <>
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(circle at 50% 30%, rgba(6, 182, 212, 0.08) 0%, transparent 60%)'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '2.5rem',
        maxWidth: '1100px',
        width: '100%',
        alignItems: 'center'
      }}>
        {/* Verification Action */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          
          <div style={{
            width: '100%', aspectRatio: '4/3',
            background: 'rgba(255,255,255,0.02)',
            border: '2px dashed rgba(255,255,255,0.1)',
            borderRadius: '16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '1rem'
          }}>
            <ShieldCheck size={48} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ready for biometric scan</p>
          </div>

          {/* Liveness prompt pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <Sparkles size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span>Active Challenge: <strong style={{ color: '#ffffff' }}>{challenge}</strong></span>
          </div>

          <button
            onClick={() => setIsCaptureModalOpen(true)}
            disabled={isScanning}
            className="btn btn-primary"
            style={{
              padding: '1rem 2rem',
              fontSize: '1.05rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-full)',
              boxShadow: '0 8px 25px rgba(6, 182, 212, 0.35)',
              minWidth: '260px'
            }}
          >
            <UserCheck size={20} />
            {isScanning ? "Authenticating..." : "Scan & Verify Identity"}
          </button>
        </div>

        {/* Pipeline Progress Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Multimodal Authentication
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Hold steady in front of the lens. The terminal captures facial geometry and iris texture simultaneously to unlock your one-time voting token.
            </p>
          </div>

          <VerificationStatus currentStep={currentStep} error={error} />
        </div>
      </div>
    </div>
    
    <FaceCaptureModal
      isOpen={isCaptureModalOpen}
      onCapture={(frameBase64) => handleStartVerification(frameBase64)}
      onClose={() => setIsCaptureModalOpen(false)}
    />
    </>
  );
};

export default VoterVerify;
