import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Camera, RefreshCw, Sparkles } from 'lucide-react';

const CameraCapture = forwardRef(({ overlayText = "Position your face within the frame", isScanning = false }, ref) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Scan-sequence state
  const [scanning, setScanning] = useState(false);
  const [countdown, setCountdown] = useState(null); // 3 → 2 → 1 → null
  const [flashActive, setFlashActive] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle'); // idle | scanning | done

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
        setIsDemoMode(false);
      }
    } catch (err) {
      console.warn('Real webcam unavailable, activating simulated academic camera mode:', err);
      setCameraError(err.message);
      setIsDemoMode(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setStreamActive(false);
  };

  // Generate synthetic biometric frame when no webcam available
  const generateSyntheticBiometricFrame = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 480;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 640, 480);
    grad.addColorStop(0, '#1e293b'); grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = '#fbd38d';
    ctx.beginPath(); ctx.ellipse(320, 240, 110, 150, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(280, 210, 18, 0, Math.PI * 2); ctx.arc(360, 210, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b6cb0';
    ctx.beginPath(); ctx.arc(280, 210, 10, 0, Math.PI * 2); ctx.arc(360, 210, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(280, 210, 4, 0, Math.PI * 2); ctx.arc(360, 210, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#744210'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(280, 195, 20, Math.PI * 1.1, Math.PI * 1.9); ctx.arc(360, 195, 20, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.strokeStyle = '#c53030';
    ctx.beginPath(); ctx.arc(320, 290, 30, 0.2, Math.PI - 0.2); ctx.stroke();
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const captureFrame = useCallback(() => {
    if (videoRef.current && streamActive) {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.95);
    }
    return generateSyntheticBiometricFrame();
  }, [streamActive]);

  // scanAndCapture: shows countdown then calls onCapture(base64)
  const scanAndCapture = useCallback((onCapture) => {
    if (scanning) return; // already in progress
    setScanning(true);
    setScanStatus('scanning');
    let tick = 3;
    setCountdown(tick);

    const interval = setInterval(() => {
      tick -= 1;
      if (tick > 0) {
        setCountdown(tick);
      } else {
        clearInterval(interval);
        setCountdown(null);
        // Flash effect
        setFlashActive(true);
        setTimeout(() => {
          setFlashActive(false);
          const frame = captureFrame();
          setScanStatus('done');
          setScanning(false);
          if (onCapture) onCapture(frame);
          // Reset status badge after 2s
          setTimeout(() => setScanStatus('idle'), 2000);
        }, 200);
      }
    }, 1000);
  }, [scanning, captureFrame]);

  // Expose both methods to parent via ref
  useImperativeHandle(ref, () => ({
    captureFrame,
    scanAndCapture,
  }));

  /* ── overlay text logic ── */
  let liveOverlay = overlayText;
  if (scanning && countdown !== null) liveOverlay = `Hold Still… ${countdown}`;
  else if (scanning && countdown === null) liveOverlay = 'Capturing…';
  else if (scanStatus === 'done') liveOverlay = '✓ Captured!';

  const reticleColor = scanning
    ? 'rgba(16,185,129,0.85)'   // green while scanning
    : scanStatus === 'done'
      ? 'rgba(16,185,129,0.6)'
      : 'rgba(6,182,212,0.6)';

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '560px',
      aspectRatio: '4/3',
      background: '#000',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      border: scanning
        ? '2px solid rgba(16,185,129,0.7)'
        : scanStatus === 'done'
          ? '2px solid rgba(16,185,129,0.5)'
          : '2px solid rgba(56,189,248,0.4)',
      boxShadow: scanning
        ? '0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(16,185,129,0.3)'
        : '0 10px 40px rgba(0,0,0,0.6), 0 0 25px rgba(6,182,212,0.2)',
      transition: 'border 0.3s, box-shadow 0.3s',
    }}>

      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          display: streamActive ? 'block' : 'none',
        }}
      />

      {/* Synthetic placeholder when no webcam */}
      {!streamActive && (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,#0f172a,#1e293b)',
          padding: '2rem', textAlign: 'center', gap: '1rem',
        }}>
          <div style={{ padding: '1.25rem', borderRadius: '50%', background: 'rgba(6,182,212,0.1)', color: 'var(--accent-cyan)' }}>
            <Camera size={44} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isDemoMode ? 'Simulated Biometric Camera Active' : 'Initializing Camera…'}
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '320px', marginTop: '0.35rem' }}>
              {isDemoMode
                ? 'Physical webcam not detected. Simulated sensor ready.'
                : 'Requesting browser camera permission…'}
            </p>
          </div>
          {isDemoMode && (
            <button type="button" onClick={startCamera} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
              <RefreshCw size={14} /> Retry Real Camera
            </button>
          )}
        </div>
      )}

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* White flash overlay */}
      {flashActive && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.85)',
          animation: 'flashFade 0.25s ease-out forwards',
          pointerEvents: 'none',
          zIndex: 20,
        }} />
      )}

      {/* Scan-line (while scanning) */}
      {(isScanning || scanning) && <div className="scanner-scanline" style={{ background: 'linear-gradient(90deg,transparent,#10b981,#06b6d4,transparent)' }} />}

      {/* Reticle */}
      <div className="scanner-reticle" style={{ borderColor: reticleColor, borderStyle: scanning ? 'solid' : 'dashed' }} />

      {/* Countdown Badge */}
      {scanning && countdown !== null && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 15,
          width: '80px', height: '80px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.65)',
          border: '3px solid #10b981',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.5rem', fontWeight: 900,
          color: '#10b981',
          boxShadow: '0 0 30px rgba(16,185,129,0.6)',
          animation: 'countPop 0.35s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {countdown}
        </div>
      )}

      {/* Bottom overlay text */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '0.75rem 1rem',
        background: 'linear-gradient(transparent, rgba(10,15,29,0.92))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.5rem',
        color: scanning ? '#34d399' : scanStatus === 'done' ? '#34d399' : 'var(--text-primary)',
        fontSize: '0.875rem', fontWeight: 600,
        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
        transition: 'color 0.3s',
        zIndex: 10,
      }}>
        <Sparkles size={16} style={{ color: scanning || scanStatus === 'done' ? '#10b981' : 'var(--accent-cyan)' }} />
        <span>{liveOverlay}</span>
      </div>

      <style>{`
        @keyframes flashFade {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes countPop {
          from { transform: translate(-50%,-50%) scale(0.5); opacity: 0; }
          to   { transform: translate(-50%,-50%) scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
});

CameraCapture.displayName = 'CameraCapture';
export default CameraCapture;
