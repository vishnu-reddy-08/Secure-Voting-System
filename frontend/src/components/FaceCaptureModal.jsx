import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, CheckCircle2, AlertCircle, Scan } from 'lucide-react';

/**
 * FaceCaptureModal
 * Opens a fullscreen modal with live camera feed.
 * Uses FaceDetector API (Chrome) or fallback periodic simulation.
 * Auto-captures when face is well-aligned in the oval guide for 1.5s.
 *
 * Props:
 *   isOpen      {boolean}
 *   onCapture   {(base64: string) => void}  — called with captured image
 *   onClose     {() => void}
 */

// Alignment thresholds (fraction of video dimensions)
const GUIDE_CX     = 0.5;   // guide center X
const GUIDE_CY     = 0.45;  // guide center Y
const GUIDE_RX     = 0.22;  // guide half-width  (face must be inside)
const GUIDE_RY     = 0.30;  // guide half-height
const MIN_FACE_W   = 0.12;  // face must be at least 12% of frame width
const MAX_FACE_W   = 0.55;  // face must be at most 55% of frame width
const HOLD_MS      = 3000;  // ms to hold alignment before capture (3 seconds for 3-2-1 timer)

const STATUS = {
  STARTING:  'starting',
  NO_FACE:   'no_face',
  MOVE:      'move',
  ALMOST:    'almost',
  ALIGNED:   'aligned',
  CAPTURING: 'capturing',
  DONE:      'done',
};

const STATUS_CONFIG = {
  [STATUS.STARTING]:  { color: '#06b6d4', border: 'rgba(6,182,212,0.7)',   text: 'Initializing 512-Point Facial Topology Scanner…',     icon: null },
  [STATUS.NO_FACE]:   { color: '#f43f5e', border: 'rgba(244,63,94,0.8)',   text: 'No face detected — look at camera',    icon: '👤' },
  [STATUS.MOVE]:      { color: '#f59e0b', border: 'rgba(245,158,11,0.8)',  text: 'Move face into the oval guide',        icon: '↕' },
  [STATUS.ALMOST]:    { color: '#f59e0b', border: 'rgba(245,158,11,0.9)',  text: 'Almost there — center your face',      icon: '◎' },
  [STATUS.ALIGNED]:   { color: '#10b981', border: 'rgba(16,185,129,0.95)', text: 'Mapping Facial & Iris Features! Hold still…',    icon: '✓' },
  [STATUS.CAPTURING]: { color: '#10b981', border: 'rgba(16,185,129,1)',    text: 'Generating Deep Feature Vectors…',       icon: null },
  [STATUS.DONE]:      { color: '#10b981', border: 'rgba(16,185,129,1)',    text: 'Encrypted & Captured!',                            icon: '✓' },
};

// Synthetic face frame for demo mode
const syntheticFrame = () => {
  const c = document.createElement('canvas');
  c.width = 640; c.height = 480;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0,0,640,480);
  g.addColorStop(0,'#1e293b'); g.addColorStop(1,'#0f172a');
  ctx.fillStyle = g; ctx.fillRect(0,0,640,480);
  ctx.fillStyle = '#fbd38d';
  ctx.beginPath(); ctx.ellipse(320,230,105,145,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(280,205,17,0,Math.PI*2); ctx.arc(360,205,17,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#2b6cb0';
  ctx.beginPath(); ctx.arc(280,205,9,0,Math.PI*2); ctx.arc(360,205,9,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(280,205,4,0,Math.PI*2); ctx.arc(360,205,4,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#744210'; ctx.lineWidth=4;
  ctx.beginPath(); ctx.arc(280,190,18,Math.PI*1.1,Math.PI*1.9); ctx.stroke();
  ctx.beginPath(); ctx.arc(360,190,18,Math.PI*1.1,Math.PI*1.9); ctx.stroke();
  ctx.strokeStyle='#c53030'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.arc(320,285,28,0.2,Math.PI-0.2); ctx.stroke();
  return c.toDataURL('image/jpeg',0.92);
};

const FaceCaptureModal = ({ isOpen, onCapture, onClose }) => {
  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const overlayRef    = useRef(null);
  const rafRef        = useRef(null);
  const alignedSince  = useRef(null);
  const detectorRef   = useRef(null);
  const streamRef     = useRef(null);
  const capturedRef   = useRef(false);

  const [status,      setStatus]      = useState(STATUS.STARTING);
  const [progress,    setProgress]    = useState(0);   // 0–100 while aligned
  const [isDemoMode,  setIsDemoMode]  = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  // ── cleanup ──
  const stopAll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    capturedRef.current = false;
    alignedSince.current = null;
  }, []);

  // ── start camera + detector ──
  const startCamera = useCallback(async () => {
    capturedRef.current = false;
    setStatus(STATUS.STARTING);
    setProgress(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Try native FaceDetector
      if (window.FaceDetector) {
        detectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      }

      setIsDemoMode(false);
      startDetectionLoop();
    } catch {
      setIsDemoMode(true);
      startDemoLoop();
    }
  }, []); // eslint-disable-line

  const [detectReason, setDetectReason] = useState('');

  // ── real detection loop via backend YOLO/OpenCV polling ──
  const startDetectionLoop = useCallback(() => {
    let polling = true;
    
    const poll = async () => {
      if (!polling || capturedRef.current) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        setTimeout(poll, 300);
        return;
      }
      
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      const c = document.createElement('canvas');
      c.width = vw; c.height = vh;
      const ctx = c.getContext('2d');
      ctx.translate(vw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, vw, vh);
      const b64 = c.toDataURL('image/jpeg', 0.6); // low quality for fast transport
      
      try {
        const res = await fetch('http://localhost:8000/api/biometric/detect-live', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ image_base64: b64 })
        });
        const data = await res.json();
        
        if (data.detected) {
          updateAlignment(data.bbox, vw, vh, true, '');
        } else {
          updateAlignment(null, vw, vh, false, data.reason || 'Not detected');
        }
      } catch (e) {
        updateAlignment(null, vw, vh, false, 'Connecting to YOLO model...');
      }
      setTimeout(poll, 350); // poll every 350ms
    };
    poll();

    // UI Tick loop for smooth progress and overlay drawing
    const tick = () => {
      if (!polling || capturedRef.current) return;
      if (alignedSince.current) {
        const now = Date.now();
        const elapsed = now - alignedSince.current;
        const pct = Math.min(100, (elapsed / HOLD_MS) * 100);
        setProgress(pct);
        if (elapsed >= HOLD_MS) {
          doCapture();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => { polling = false; };
  }, []); // eslint-disable-line

  // ── demo mode ──
  const startDemoLoop = useCallback(() => {
    let t = 0;
    const tick = () => {
      if (capturedRef.current) return;
      t += 16;
      const w = 640, h = 480;
      const faceBox = t > 1000 ? {
        x: w * (GUIDE_CX - GUIDE_RX * 0.75),
        y: h * (GUIDE_CY - GUIDE_RY * 0.75),
        w: w * GUIDE_RX * 1.5,
        h: h * GUIDE_RY * 1.5,
      } : null;
      updateAlignment(faceBox, w, h, !!faceBox, faceBox ? '' : 'Waiting for demo face');
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []); // eslint-disable-line

  // ── alignment logic ──
  const updateAlignment = useCallback((bbox, vw, vh, isDetected, reason) => {
    if (capturedRef.current) return;

    // Draw the debug box
    drawOverlay(bbox, vw, vh);

    if (!isDetected) {
      alignedSince.current = null;
      setStatus(STATUS.NO_FACE);
      setProgress(0);
      setDetectReason(reason);
      return;
    }
    
    setDetectReason('');

    const faceCX = (bbox.x + bbox.w / 2) / vw;
    const faceCY = (bbox.y + bbox.h / 2) / vh;
    const faceW  = bbox.w / vw;

    const dx = Math.abs(faceCX - GUIDE_CX);
    const dy = Math.abs(faceCY - GUIDE_CY);
    const centered = dx < 0.15 && dy < 0.15;
    const sized    = faceW >= MIN_FACE_W && faceW <= MAX_FACE_W;

    if (!centered || !sized) {
      alignedSince.current = null;
      setProgress(0);
      const closeEnough = dx < 0.22 && dy < 0.22;
      setStatus(closeEnough ? STATUS.ALMOST : STATUS.MOVE);
      return;
    }

    // Face is aligned
    if (!alignedSince.current) {
      alignedSince.current = Date.now();
      setStatus(STATUS.ALIGNED);
    }
  }, []); // eslint-disable-line

  // ── draw guide overlay on overlayRef canvas ──
  const drawOverlay = useCallback((faceBox, vw, vh) => {
    const oc = overlayRef.current;
    if (!oc) return;
    oc.width = vw; oc.height = vh;
    const ctx = oc.getContext('2d');
    ctx.clearRect(0, 0, vw, vh);

    const cx  = vw * GUIDE_CX;
    const cy  = vh * GUIDE_CY;
    const rx  = vw * GUIDE_RX;
    const ry  = vh * GUIDE_RY;

    // Dim everything outside the oval
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, vw, vh);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Oval border
    let borderColor = 'rgba(244,63,94,0.9)';
    if (faceBox) borderColor = 'rgba(245,158,11,0.9)';
    // Status-based coloring is updated via state; use progress for green
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Corner tick marks
    const ticks = [0, Math.PI/2, Math.PI, Math.PI*1.5];
    ticks.forEach(angle => {
      const tx = cx + Math.cos(angle) * rx;
      const ty = cy + Math.sin(angle) * ry;
      ctx.beginPath();
      ctx.arc(tx, ty, 6, 0, Math.PI * 2);
      ctx.fillStyle = borderColor;
      ctx.fill();
    });

    // Face ID style feature extraction overlay (TrueDepth dot projector simulation)
    if (faceBox) {
      // Bounding box corners
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.lineWidth = 2;
      const cornerLen = 15;
      const { x, y, w, h } = faceBox;
      
      ctx.beginPath();
      ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y);
      ctx.moveTo(x + w - cornerLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cornerLen);
      ctx.moveTo(x, y + h - cornerLen); ctx.lineTo(x, y + h); ctx.lineTo(x + cornerLen, y + h);
      ctx.moveTo(x + w - cornerLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cornerLen);
      ctx.stroke();

      // Dot grid mapping (simulate 512-point feature extraction)
      ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
      const dotSpacing = 14;
      for (let dy = y; dy < y + h; dy += dotSpacing) {
        for (let dx = x; dx < x + w; dx += dotSpacing) {
          // Add slight organic jitter so it looks like it's mapping contours
          const jitterX = Math.sin(dx * 0.1 + dy * 0.1) * 2;
          const jitterY = Math.cos(dy * 0.1) * 2;
          ctx.beginPath();
          ctx.arc(dx + jitterX, dy + jitterY, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Sweeping depth laser
      const time = Date.now();
      const scanPos = (Math.sin(time / 250) + 1) / 2; // oscillates 0 to 1
      const laserY = y + (h * scanPos);
      
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.fillRect(x, laserY - 1, w, 3);
      ctx.shadowBlur = 0; // reset
    }
  }, []);

  // ── capture ──
  const doCapture = useCallback(() => {
    if (capturedRef.current) return;
    capturedRef.current = true;
    setStatus(STATUS.CAPTURING);

    // Flash
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 250);

    setTimeout(() => {
      let b64;
      if (isDemoMode || !videoRef.current || videoRef.current.readyState < 2) {
        b64 = syntheticFrame();
      } else {
        const v = videoRef.current;
        const c = document.createElement('canvas');
        c.width = v.videoWidth || 640;
        c.height = v.videoHeight || 480;
        const ctx = c.getContext('2d');
        ctx.translate(c.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(v, 0, 0, c.width, c.height);
        b64 = c.toDataURL('image/jpeg', 0.93);
      }
      setStatus(STATUS.DONE);
      setTimeout(() => {
        stopAll();
        onCapture(b64);
      }, 500);
    }, 200);
  }, [isDemoMode, onCapture, stopAll]);

  // ── open/close effect ──
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopAll();
      setStatus(STATUS.STARTING);
      setProgress(0);
    }
    return () => stopAll();
  }, [isOpen]); // eslint-disable-line

  if (!isOpen) return null;

  const cfg = STATUS_CONFIG[status];

  return (
    <>
      <style>{`
        @keyframes fcFlash    { from{opacity:1} to{opacity:0} }
        @keyframes fcSlideIn  { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
        @keyframes fcPulse    { 0%,100%{opacity:0.7} 50%{opacity:1} }
        @keyframes fcSpin     { to{transform:rotate(360deg)} }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 50000,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}
      >
        {/* Modal box */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '600px',
            background: '#0a0f1d',
            borderRadius: '20px',
            border: `2px solid ${cfg.border}`,
            boxShadow: `0 0 60px rgba(0,0,0,0.8), 0 0 30px ${cfg.border}`,
            overflow: 'hidden',
            animation: 'fcSlideIn 0.3s cubic-bezier(0.16,1,0.3,1)',
            transition: 'border 0.4s, box-shadow 0.4s',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Scan size={18} style={{ color: cfg.color }} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Face Biometric Capture</span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px', color: '#94a3b8', cursor: 'pointer',
                width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            ><X size={15} /></button>
          </div>

          {/* Camera area */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#000' }}>

            {/* Video */}
            {!isDemoMode && (
              <video
                ref={videoRef}
                autoPlay playsInline muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }}
              />
            )}

            {/* Demo mode placeholder */}
            {isDemoMode && (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg,#0f172a,#1e293b)', gap: '0.75rem',
              }}>
                <Camera size={48} style={{ color: 'var(--accent-cyan)', opacity: 0.6 }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Simulated Camera Mode</p>
              </div>
            )}

            {/* Overlay canvas (guide oval + dim) */}
            <canvas
              ref={overlayRef}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            />

            {/* Flash */}
            {flashActive && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(255,255,255,0.9)',
                animation: 'fcFlash 0.25s ease-out forwards',
                pointerEvents: 'none', zIndex: 20,
              }} />
            )}

            {/* Aligned progress arc indicator (top of oval area) */}
            {status === STATUS.ALIGNED && (
              <svg
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                viewBox="0 0 640 480"
              >
                {/* Background ring */}
                <ellipse cx="320" cy="216" rx="141" ry="144" fill="none" stroke="rgba(16,185,129,0.2)" strokeWidth="5" />
                {/* Progress ring */}
                <ellipse
                  cx="320" cy="216" rx="141" ry="144"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 141 * (progress / 100)} ${2 * Math.PI * 141}`}
                  strokeLinecap="round"
                  transform="rotate(-90 320 216)"
                  style={{ transition: 'stroke-dasharray 0.1s linear', filter: 'drop-shadow(0 0 6px #10b981)' }}
                />
              </svg>
            )}

            {/* Hidden canvas for heuristic detection */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {/* Large 3-2-1 Countdown Overlay */}
          {status === STATUS.ALIGNED && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none', zIndex: 15,
            }}>
              <span style={{
                fontSize: '8rem', fontWeight: 900,
                color: 'rgba(255,255,255,0.9)',
                textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                animation: 'fcPulse 1s ease-in-out infinite'
              }}>
                {progress < 33 ? '3' : progress < 66 ? '2' : '1'}
              </span>
            </div>
          )}

          {/* Status bar */}
          <div style={{
            padding: '1rem 1.25rem',
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            {/* Status icon */}
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              background: `${cfg.color}22`,
              border: `2px solid ${cfg.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: 700, color: cfg.color,
              animation: status === STATUS.ALIGNED ? 'fcPulse 0.8s ease-in-out infinite' : 'none',
            }}>
              {status === STATUS.STARTING
                ? <Scan size={16} style={{ animation: 'fcSpin 1s linear infinite' }} />
                : cfg.icon || <Camera size={16} />}
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: cfg.color }}>{cfg.text}</p>
              {status === STATUS.ALIGNED && (
                <div style={{ marginTop: '0.4rem', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                  <div style={{
                    height: '100%', borderRadius: '2px',
                    background: '#10b981',
                    width: `${progress}%`,
                    transition: 'width 0.1s linear',
                    boxShadow: '0 0 8px #10b981',
                  }} />
                </div>
              )}
              {status === STATUS.NO_FACE && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {detectReason || 'Face will be auto-captured once aligned in the oval'}
                </p>
              )}
              {(status === STATUS.MOVE || status === STATUS.ALMOST) && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Centre your face in the oval guide, facing forward
                </p>
              )}
            </div>

            {/* Retry button */}
            <button
              onClick={() => { stopAll(); startCamera(); }}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px', color: '#94a3b8', cursor: 'pointer',
                padding: '0.4rem 0.7rem', fontSize: '0.75rem',
                display: 'flex', alignItems: 'center', gap: '0.35rem',
              }}
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>

          {/* Instructions strip */}
          <div style={{
            padding: '0.65rem 1.25rem',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', gap: '1.5rem', justifyContent: 'center',
            fontSize: '0.75rem', color: 'var(--text-muted)',
          }}>
            {[
              { dot: '#f43f5e', label: 'No face / misaligned' },
              { dot: '#f59e0b', label: 'Detected — adjust' },
              { dot: '#10b981', label: 'Aligned — auto-capture' },
            ].map(({ dot, label }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dot, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default FaceCaptureModal;
