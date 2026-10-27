import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import FaceCaptureModal from '../components/FaceCaptureModal';
import { useNotification } from '../context/NotificationContext';
import {
  UserPlus, Camera, Fingerprint, ShieldCheck,
  ArrowLeft, Eye, CheckCircle2, Loader2
} from 'lucide-react';

const VoterCreate = () => {
  const navigate = useNavigate();
  const notify   = useNotification();
  const cameraRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', age: '', mobile: '', aadhaar_raw: '', eligible: true,
  });

  const [faceImage,    setFaceImage]    = useState(null);
  const [irisImage,    setIrisImage]    = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturing,  setIsCapturing]  = useState(false); // face scan in progress

  /* ── helpers ── */
  const field = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  /* ── face scan sequence ── */
  const handleCaptureFace = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    cameraRef.current?.scanAndCapture((b64) => {
      setFaceImage(b64);
      if (!irisImage) setIrisImage(b64);   // auto-fill iris from same frame
      setIsCapturing(false);
      notify.success('Face captured successfully!', 2500);
    });
  };

  /* ── iris retake ── */
  const handleCaptureIris = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    cameraRef.current?.scanAndCapture((b64) => {
      setIrisImage(b64);
      setIsCapturing(false);
      notify.success('Iris / Eye sample captured!', 2500);
    });
  };

  /* ── registration guard + submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all required fields
    const missing = [];
    if (!formData.name.trim())        missing.push('Full Name');
    if (!formData.age)                missing.push('Age');
    if (!formData.mobile.trim())      missing.push('Mobile Number');
    if (!formData.aadhaar_raw.trim()) missing.push('Aadhaar Number');
    if (!faceImage)                   missing.push('Face Biometric (Capture required)');

    if (missing.length > 0) {
      notify.error(`Please complete: ${missing.join(', ')}`);
      return;
    }

    // Age range check
    const age = parseInt(formData.age, 10);
    if (age < 18 || age > 120) {
      notify.error('Age must be between 18 and 120.');
      return;
    }

    // Mobile format check
    if (!/^[0-9]{10}$/.test(formData.mobile.trim())) {
      notify.error('Mobile number must be exactly 10 digits.');
      return;
    }

    setIsSubmitting(true);
    let createdVoterId = null;
    try {
      // 1. Create voter record with registered face
      const voterRes = await api.post('/admin/voters', {
        name:        formData.name.trim(),
        age,
        mobile:      formData.mobile.trim(),
        aadhaar_raw: formData.aadhaar_raw.trim(),
        eligible:    formData.eligible,
        face_image_base64: faceImage,
      });
      createdVoterId = voterRes.data.voter_id;

      // 2. Enroll biometrics
      try {
        await api.post('/biometric/enroll-multimodal', {
          voter_id:          createdVoterId,
          face_image_base64: faceImage,
          iris_image_base64: irisImage || faceImage,
        });
      } catch (bioErr) {
        // Rollback voter creation so they can try again without duplicate mobile error
        await api.delete(`/admin/voters/${createdVoterId}`);
        throw new Error(`Biometric rejection: ${bioErr.message || 'Face/Iris not detected correctly'}. Please retake image.`);
      }

      notify.success(`Voter ${createdVoterId} registered & biometrics enrolled!`, 5000);
      setTimeout(() => navigate('/admin/voters'), 1800);
    } catch (err) {
      notify.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/admin/voters" className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem' }}>
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Register New Voter
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Complete voter credentials and capture multimodal Face + Iris biometric templates.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>

        {/* ── Left: Identity Credentials ── */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            1. Identity Credentials
          </h3>

          {/* Full Name */}
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => field('name', e.target.value)}
              className="form-input"
              placeholder="e.g. Vikramaditya Rao"
            />
          </div>

          {/* Age + Mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Age *</label>
              <input
                type="number"
                required
                min="18" max="120"
                value={formData.age}
                onChange={e => field('age', e.target.value)}
                className="form-input"
                placeholder="25"
              />
            </div>
            <div>
              <label style={labelStyle}>Mobile Number *</label>
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                value={formData.mobile}
                onChange={e => field('mobile', e.target.value)}
                className="form-input"
                placeholder="9876543210"
              />
            </div>
          </div>

          {/* Aadhaar */}
          <div>
            <label style={labelStyle}>Aadhaar Number (12 Digits) *</label>
            <input
              type="text"
              required
              maxLength="16"
              value={formData.aadhaar_raw}
              onChange={e => field('aadhaar_raw', e.target.value)}
              className="form-input"
              placeholder="4829-1038-9281"
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Data Minimization: Only masked (XXXX-XXXX-9281) stored in database.
            </p>
          </div>

          {/* Eligible checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <input
              type="checkbox"
              id="eligible"
              checked={formData.eligible}
              onChange={e => field('eligible', e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)' }}
            />
            <label htmlFor="eligible" style={{ fontSize: '0.875rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              Eligible to vote in current constituency
            </label>
          </div>

          {/* Checklist summary */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
            {[
              { label: 'Full Name',        ok: !!formData.name.trim() },
              { label: 'Age',              ok: !!formData.age },
              { label: 'Mobile',           ok: /^[0-9]{10}$/.test(formData.mobile) },
              { label: 'Aadhaar',          ok: !!formData.aadhaar_raw.trim() },
              { label: 'Face Biometric',   ok: !!faceImage },
            ].map(({ label, ok }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: ok ? '#34d399' : 'var(--text-muted)' }}>
                <CheckCircle2 size={13} style={{ opacity: ok ? 1 : 0.3 }} />
                {label}
              </div>
            ))}
          </div>

          {/* Submit */}
          <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
            >
              {isSubmitting ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Enrolling Biometrics…</> : <><UserPlus size={18} /> Register &amp; Enroll Biometrics</>}
            </button>
          </div>
        </div>

        {/* ── Right: Biometric Capture Station ── */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            2. Biometric Capture Station
          </h3>

          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '3rem 2rem', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-lg)',
            border: '1px dashed rgba(255,255,255,0.2)', gap: '1rem', flex: 1
          }}>
            <Camera size={48} style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
              Face and Iris templates must be captured live.
            </p>
            <button
              type="button"
              onClick={() => setIsCapturing(true)}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.5rem', marginTop: '0.5rem' }}
            >
              <Camera size={18} /> {faceImage ? 'Retake Biometrics' : 'Start Biometric Capture'}
            </button>
          </div>

          {/* Preview thumbnails */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
            <Thumb label="Face Sample" src={faceImage} borderColor="var(--accent-cyan)" />
            <Thumb label="Iris / Eye Sample" src={irisImage} borderColor="var(--accent-emerald)" />
          </div>

          {/* Instructions */}
          <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            <strong style={{ color: 'var(--accent-cyan)' }}>Note:</strong> The system will automatically capture both Face and Iris when you align your face inside the guide oval.
          </div>
        </div>
      </form>

      {/* Pop-up auto-capture modal */}
      <FaceCaptureModal
        isOpen={isCapturing}
        onClose={() => setIsCapturing(false)}
        onCapture={(b64) => {
          setFaceImage(b64);
          setIrisImage(b64); // use same frame for iris extraction
          setIsCapturing(false);
          notify.success('Biometrics captured successfully!');
        }}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const labelStyle = {
  display: 'block', fontSize: '0.85rem', fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: '0.4rem',
};

const Thumb = ({ label, src, borderColor }) => (
  <div style={{ flex: 1, textAlign: 'center' }}>
    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</p>
    {src ? (
      <img src={src} alt={label} style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: `2px solid ${borderColor}` }} />
    ) : (
      <div style={{ width: '100%', height: '90px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
        No sample
      </div>
    )}
  </div>
);

export default VoterCreate;
