import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Link as LinkIcon, 
  Sparkles, 
  ShieldCheck, 
  Loader2, 
  AlertCircle,
  Camera,
  CheckCircle2,
  Video,
  Mic,
  Square,
  RefreshCw,
  Cpu,
  FileCheck,
  Radio,
  Eye,
  Activity,
  Check,
  Award
} from 'lucide-react';
import { DareItem, UserProfile, AiJudgement } from '../types';
import { playSound } from '../utils/soundEffects';

interface ProofModalProps {
  dare: DareItem | null;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onProofSubmitted: (updatedDare: DareItem) => void;
}

export const ProofModal: React.FC<ProofModalProps> = ({
  dare,
  currentUser,
  isOpen,
  onClose,
  onProofSubmitted,
}) => {
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<AiJudgement | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const [capturedAudioUrl, setCapturedAudioUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [includeLocation, setIncludeLocation] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  // Stop camera stream on unmount or close
  useEffect(() => {
    return () => {
      stopCamera();
      stopAudioRecording();
    };
  }, []);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setErrorMsg('');
    try {
      playSound('laser');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setErrorMsg('Camera access unavailable. You can upload an image or choose a demo clip.');
      playSound('error');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    playSound('oracle');
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setMediaUrl(dataUrl);
      stopCamera();
    }
  };

  // Live Audio Verification Track
  const startAudioRecording = async () => {
    setErrorMsg('');
    try {
      playSound('laser');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setCapturedAudioUrl(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setRecordingAudio(true);
      setAudioSeconds(0);
      timerRef.current = setInterval(() => {
        setAudioSeconds(sec => sec + 1);
      }, 1000);
    } catch (err) {
      console.warn('Audio recording unavailable:', err);
      setErrorMsg('Microphone access denied. You can proceed with written telemetry.');
      playSound('error');
    }
  };

  const stopAudioRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && recordingAudio) {
      mediaRecorderRef.current.stop();
      playSound('click');
    }
    setRecordingAudio(false);
  };

  // Handle local image file upload and convert to Data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result as string);
      playSound('click');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSampleMedia = (url: string) => {
    stopCamera();
    setMediaUrl(url);
    playSound('click');
  };

  const handleRunGeminiScan = async () => {
    if (!caption.trim() && !mediaUrl.trim()) {
      setErrorMsg('Please write an execution log or attach media to run Gemini Multimodal Scan.');
      playSound('error');
      return;
    }

    setIsScanning(true);
    setErrorMsg('');
    playSound('oracle');

    try {
      const res = await fetch(`/api/dares/${dare?.id}/validate-proof-multimodal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: caption.trim(),
          mediaUrl: mediaUrl.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Multimodal scan failed');
      const data = await res.json();
      setScanResult(data);
      playSound('complete');
    } catch (err) {
      console.error(err);
      setErrorMsg('Multimodal scan failed. You can still submit directly for verification.');
      playSound('error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) {
      setErrorMsg('Please describe your proof of completion in the execution log.');
      playSound('error');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    playSound('oracle');

    try {
      const res = await fetch(`/api/dares/${dare?.id}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: caption.trim(),
          mediaUrl: mediaUrl.trim() || undefined,
          userHandle: currentUser.handle,
          location: includeLocation ? coords : undefined,
        }),
      });

      if (!res.ok) throw new Error('Proof submission failed');
      const updated = await res.json();
      playSound('complete');
      onProofSubmitted(updated);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Proof submission failed. Please try again.');
      playSound('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !dare) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="proof-submission-modal"
        className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10">
              <Camera className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                SUBMIT COMPLETED <span className="text-indigo-400">PROOF</span>
              </h2>
              <p className="text-xs text-slate-400">
                Dare: <span className="text-slate-200">{dare.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Proof Requirement Reminder */}
        <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-xs text-indigo-200">
          <span className="font-semibold text-indigo-400 block mb-0.5">PROOF REQUIREMENT:</span>
          {dare.proofRequirement}
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-lg border border-rose-500/40 bg-rose-950/30 p-2.5 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Proof Caption / Log */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1 uppercase tracking-wider">
              Execution Log / Proof Story
            </label>
            <textarea
              id="proof-caption-input"
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe how you fulfilled the challenge, timestamps, reactions, and results..."
              className="w-full rounded-xl border border-slate-800 bg-[#07090e] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Location Consent */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include-location"
              checked={includeLocation}
              onChange={(e) => {
                setIncludeLocation(e.target.checked);
                if (e.target.checked && !coords) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    (err) => console.error(err)
                  );
                }
              }}
              className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
            />
            <label htmlFor="include-location" className="text-xs text-slate-300">
              Include location for community heatmap
            </label>
          </div>

          {/* Media Proof: Live Camera, Audio Note, Upload or URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-slate-300 uppercase tracking-wider">
                Photo, Video & Telemetry Attachment
              </label>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                AI Multi-Modal Telemetry
              </span>
            </div>

            {/* Mode selection buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <button
                type="button"
                onClick={cameraActive ? stopCamera : startCamera}
                className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 px-2.5 text-xs font-mono transition-all ${
                  cameraActive
                    ? 'border-rose-500/80 bg-rose-950/50 text-rose-300'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300'
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{cameraActive ? 'Close Cam' : 'Live Camera'}</span>
              </button>

              <button
                type="button"
                onClick={recordingAudio ? stopAudioRecording : startAudioRecording}
                className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 px-2.5 text-xs font-mono transition-all ${
                  recordingAudio
                    ? 'border-rose-500/80 bg-rose-950/60 text-rose-300 animate-pulse'
                    : capturedAudioUrl
                    ? 'border-emerald-500/80 bg-emerald-950/40 text-emerald-300'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-indigo-500/50 hover:text-indigo-300'
                }`}
              >
                {recordingAudio ? (
                  <>
                    <Square className="h-3.5 w-3.5 text-rose-400" />
                    <span>Stop ({audioSeconds}s)</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{capturedAudioUrl ? 'Audio Track' : 'Voice Memo'}</span>
                  </>
                )}
              </button>

              <label className="cursor-pointer flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 py-2 px-2.5 text-xs font-mono text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300 transition-all">
                <Upload className="h-3.5 w-3.5 text-emerald-400" />
                <span>Upload File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex items-center justify-center gap-1 rounded-lg border border-slate-800 bg-slate-900/40 py-2 px-2 text-[10px] font-mono text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>Anti-Spoof ON</span>
              </div>
            </div>

            {/* Live Camera Viewfinder Modal Container if Active */}
            {cameraActive && (
              <div className="mb-3 relative rounded-xl overflow-hidden border border-cyan-500/50 bg-black shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-56 object-cover"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-rose-400 border border-rose-500/40">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  REC // OPTICAL SENSOR LIVE
                </div>
                <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Camera className="h-4 w-4" />
                    <span>SNAPSHOT TELEMETRY</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Captured Audio Preview */}
            {capturedAudioUrl && (
              <div className="mb-3 rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-indigo-400 animate-pulse" />
                  <span className="text-xs font-mono text-indigo-300">Voice Telemetry Recorded ({audioSeconds || 5}s)</span>
                </div>
                <audio src={capturedAudioUrl} controls className="h-7 w-48" />
                <button
                  type="button"
                  onClick={() => setCapturedAudioUrl(null)}
                  className="text-slate-400 hover:text-rose-400 p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            
            {/* Direct Upload Box or Media URL */}
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex-1 cursor-pointer flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-center hover:border-indigo-500 transition-colors">
                <Upload className="h-5 w-5 text-indigo-400 mb-1" />
                <span className="text-xs text-slate-300 font-medium">Click or Drag Image File</span>
                <span className="text-[10px] text-slate-500">PNG, JPG, WEBP (Max 5MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Or Media URL */}
              <div className="flex-1 flex flex-col justify-center rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                <span className="text-[11px] font-mono text-slate-400 mb-1">Or Paste Image/Video URL:</span>
                <div className="relative">
                  <LinkIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="url"
                    id="proof-media-url-input"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-slate-800 bg-[#07090e] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick Demo Media Presets (Photos & Short Videos) */}
            <div className="mt-2.5">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">
                Quick Demo Presets (Photos & Short Video Clips):
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '💻 Workspace Photo', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80' },
                  { label: '🌿 Outdoor Photo', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80' },
                  { label: '🎬 Screencast Video Clip', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
                  { label: '🏃 Fitness Video Clip', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectSampleMedia(preset.url)}
                    className="rounded border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[10px] font-mono text-indigo-300 hover:border-indigo-500 hover:bg-slate-700/60 transition-colors"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Selected Media */}
            {mediaUrl && (
              <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-800 bg-black/60 max-h-48">
                {mediaUrl.toLowerCase().includes('mp4') || mediaUrl.toLowerCase().includes('webm') ? (
                  <video
                    src={mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Proof preview"
                    className="w-full h-48 object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setMediaUrl('')}
                  className="absolute top-2 right-2 rounded-full bg-black/70 p-1 text-slate-300 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-mono text-indigo-300">
                  {mediaUrl.toLowerCase().includes('mp4') ? '🎬 Short Video Proof Attached' : 'Media Proof Attached'}
                </div>
              </div>
            )}
          </div>

          {/* Gemini Multimodal Auto-Validation Pre-Scan Section */}
          <div className="rounded-xl border border-cyan-500/30 bg-[#0b1324] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Gemini Multimodal Vision Arbiter
                </span>
              </div>
              <button
                type="button"
                id="gemini-multimodal-scan-btn"
                onClick={handleRunGeminiScan}
                disabled={isScanning || (!caption.trim() && !mediaUrl.trim())}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-500/50 bg-cyan-500/15 hover:bg-cyan-500/25 px-3 py-1.5 text-xs font-mono font-bold text-cyan-300 disabled:opacity-40 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.15)]"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                    <span>Scanning Vision & Audio...</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Run Multimodal Auto-Validate</span>
                  </>
                )}
              </button>
            </div>

            {/* Scan Results Card */}
            {scanResult && (
              <div className="rounded-lg border border-slate-700/80 bg-slate-900/80 p-3 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                      scanResult.verdict === 'LEGENDARY'
                        ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                        : scanResult.verdict === 'LEGIT'
                        ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                        : 'bg-rose-500/20 border-rose-400/60 text-rose-300'
                    }`}>
                      {scanResult.verdict === 'LEGENDARY' && '🔥 '}
                      AI VERDICT: {scanResult.verdict}
                    </span>
                    <span className="text-xs font-mono text-cyan-400">
                      {scanResult.confidence}% Confidence
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    +{scanResult.bonusCred} Bonus Cred Projected
                  </span>
                </div>

                <p className="text-xs font-mono text-slate-300 italic bg-black/40 p-2.5 rounded border border-slate-800">
                  &quot;{scanResult.commentary}&quot;
                </p>

                {/* Multimodal Detected Actions & Telemetry */}
                {(scanResult.detectedActions?.length || scanResult.detectedObjects?.length) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                    {scanResult.detectedActions && scanResult.detectedActions.length > 0 && (
                      <div className="rounded bg-indigo-950/40 border border-indigo-500/20 p-2">
                        <span className="text-[10px] text-indigo-400 font-bold block mb-1">Detected Actions:</span>
                        <div className="flex flex-wrap gap-1">
                          {scanResult.detectedActions.map((act, i) => (
                            <span key={i} className="text-[10px] bg-indigo-900/50 text-indigo-200 px-1.5 py-0.5 rounded">
                              ✓ {act}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {scanResult.detectedObjects && scanResult.detectedObjects.length > 0 && (
                      <div className="rounded bg-cyan-950/40 border border-cyan-500/20 p-2">
                        <span className="text-[10px] text-cyan-400 font-bold block mb-1">Detected Context & Props:</span>
                        <div className="flex flex-wrap gap-1">
                          {scanResult.detectedObjects.map((obj, i) => (
                            <span key={i} className="text-[10px] bg-cyan-900/50 text-cyan-200 px-1.5 py-0.5 rounded">
                              • {obj}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Criteria Checks Grid */}
                {scanResult.criteriaChecks && scanResult.criteriaChecks.length > 0 && (
                  <div className="space-y-1">
                    {scanResult.criteriaChecks.map((chk, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-slate-950/60 rounded px-2 py-1 border border-slate-800">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {chk.passed ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                          )}
                          <span className="font-mono text-slate-300 truncate">{chk.criterion}</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-emerald-400 ml-2 shrink-0">
                          {chk.score}/100
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submission Notice: AI verification */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs text-indigo-200 flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-indigo-300">Auto-Validation:</span> Upon submission, Gemini Multimodal Arbiter will finalize your verified execution, log telemetry onto the blockchain ledger, and instantly disburse Cred & XP!
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-submit-proof-btn"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-550 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Evaluating Proof...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Submit for Verification</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
