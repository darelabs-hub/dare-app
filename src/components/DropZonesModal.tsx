import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MapPin, 
  Compass, 
  Crosshair, 
  Camera, 
  Zap, 
  Shield, 
  Radio, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Navigation, 
  RefreshCw, 
  Lock, 
  Unlock, 
  Gift, 
  Flame, 
  Eye, 
  Plus, 
  X,
  Volume2,
  VolumeX,
  Globe,
  Sliders,
  ChevronRight,
  Award,
  Maximize2,
  Minimize2,
  RotateCw,
  Sun,
  CameraOff,
  Target,
  ArrowUpRight,
  Download,
  Share2,
  Info
} from 'lucide-react';
import { DropZone, UserProfile, ArmoryItem, DareCategory, ItemRarity, ARBeaconType } from '../types';
import { playSound, triggerHaptic } from '../utils/soundEffects';
import { triggerConfetti } from './ConfettiEffect';

interface DropZonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserUpdate: (updatedUser: UserProfile) => void;
  onNavigateToDare?: (dareTitle: string) => void;
  initialTab?: 'radar' | 'ar_scanner' | 'deploy';
  initialZone?: DropZone | null;
}

const PRESET_CITIES = [
  { name: 'London', lat: 51.5074, lng: -0.1278, country: 'United Kingdom', flag: '🇬🇧' },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194, country: 'United States', flag: '🇺🇸' },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050, country: 'Germany', flag: '🇩🇪' },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, country: 'Japan', flag: '🇯🇵' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, country: 'France', flag: '🇫🇷' },
  { name: 'New York', lat: 40.7128, lng: -74.0060, country: 'United States', flag: '🇺🇸' },
  { name: 'Amsterdam', lat: 52.3702, lng: 4.8952, country: 'Netherlands', flag: '🇳🇱' },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, country: 'Australia', flag: '🇦🇺' },
];

const BEACON_ARCHETYPES: Array<{
  type: ARBeaconType;
  label: string;
  icon: string;
  desc: string;
}> = [
  { type: 'quantum_vault', label: 'Quantum Vault', icon: '💠', desc: 'Floating encrypted hypercube with rotating containment rings' },
  { type: 'holo_pod', label: 'Holo-Pod', icon: '🛸', desc: 'Hovering telemetry probe emitting vertical ion beacon beams' },
  { type: 'neural_node', label: 'Neural Node', icon: '🔮', desc: 'Pulsing synaptic crystal lattice broadcasting localized ciphers' },
  { type: 'cyber_relic', label: 'Cyber Relic', icon: '🔱', desc: 'Ancient high-tech obelisk carved with neon circuit glyphs' },
  { type: 'stealth_crate', label: 'Stealth Crate', icon: '📦', desc: 'Military-grade tactical cache sealed with biometric locks' },
];

export const DropZonesModal: React.FC<DropZonesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  onNavigateToDare,
  initialTab,
  initialZone,
}) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'ar_scanner' | 'deploy'>('radar');
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState<DropZone | null>(null);
  
  // Geolocation state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; source: string; isRealGps?: boolean }>({
    lat: 51.5074,
    lng: -0.1278,
    source: 'London Sector (Default)',
    isRealGps: false,
  });
  const [gpsLocating, setGpsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');

  // AR Scanner HUD & Spatial Motion State
  const [arCameraActive, setArCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchActive, setTorchActive] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // 3D Spatial Virtual Camera & Gyroscope
  const [viewOrientation, setViewOrientation] = useState({ yaw: 0, pitch: 0 }); // degrees
  const [isDraggingView, setIsDraggingView] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, yaw: 0, pitch: 0 });
  const [gyroActive, setGyroActive] = useState(false);

  // Decryption & Proximity Lock State
  const [decryptionProgress, setDecryptionProgress] = useState(0);
  const [decrypting, setDecrypting] = useState(false);
  const [isLockedOn, setIsLockedOn] = useState(false);
  const [lockDistanceFactor, setLockDistanceFactor] = useState(0); // 0 (far) to 1 (centered)
  const [scanResult, setScanResult] = useState<{
    awardedCred: number;
    awardedXp: number;
    lootItem?: ArmoryItem;
  } | null>(null);

  // AR Snapshot proof capture
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);

  // Audio Proximity Ping state
  const [audioSonarEnabled, setAudioSonarEnabled] = useState(true);
  const sonarIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Camera video and canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const arContainerRef = useRef<HTMLDivElement | null>(null);

  // Deploy New Zone Form State
  const [deployName, setDeployName] = useState('');
  const [deployCategory, setDeployCategory] = useState<DareCategory>('cyber');
  const [deployArchetype, setDeployArchetype] = useState<ARBeaconType>('quantum_vault');
  const [deployBounty, setDeployBounty] = useState<number>(250);
  const [deployRadius, setDeployRadius] = useState<number>(200);
  const [deployTitle, setDeployTitle] = useState('');
  const [deployDesc, setDeployDesc] = useState('');
  const [deployHint, setDeployHint] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [deployFeedback, setDeployFeedback] = useState<string | null>(null);

  // Web Audio Sonar Ping Generator
  const playSonarTone = useCallback((frequency: number, duration = 0.08) => {
    if (!audioSonarEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore audio context errors
    }
  }, [audioSonarEnabled]);

  // Load Drop Zones from Backend
  const loadDropZones = async (lat?: number, lng?: number) => {
    setLoading(true);
    try {
      const currentLat = lat ?? userLocation.lat;
      const currentLng = lng ?? userLocation.lng;
      const res = await fetch(`/api/drop-zones?lat=${currentLat}&lng=${currentLng}`);
      if (res.ok) {
        const data: DropZone[] = await res.json();
        setDropZones(data);
        if (data.length > 0) {
          // If no zone selected or current selection not in list, pick the closest
          setSelectedZone((prev) => {
            if (prev && data.some((z) => z.id === prev.id)) {
              return data.find((z) => z.id === prev.id) || data[0];
            }
            return data[0];
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch drop zones', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
        if (initialTab === 'ar_scanner') {
          startCamera();
        }
      }
      if (initialZone) {
        setSelectedZone(initialZone);
        if (typeof initialZone.bearingDegrees === 'number') {
          setViewOrientation({ yaw: initialZone.bearingDegrees, pitch: 0 });
        }
      }
      loadDropZones();
    } else {
      stopCamera();
      if (sonarIntervalRef.current) clearInterval(sonarIntervalRef.current);
    }
  }, [isOpen, initialTab, initialZone]);

  // Request Live Device GPS
  const handleAcquireGps = () => {
    setGpsLocating(true);
    setGpsError(null);
    playSound('laser');

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser environment.');
      setGpsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: `Live GPS Lock (±${Math.round(pos.coords.accuracy)}m)`,
          isRealGps: true,
        };
        setUserLocation(newCoords);
        setGpsLocating(false);
        playSound('levelUp');
        loadDropZones(newCoords.lat, newCoords.lng);
      },
      (err) => {
        console.warn('GPS permission denied or timeout', err);
        setGpsError('GPS permission was denied or timed out. You can choose any global city hub below.');
        setGpsLocating(false);
        playSound('error');
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  };

  // Switch City Hub
  const handleSelectCity = (city: typeof PRESET_CITIES[0]) => {
    playSound('pop');
    const newCoords = {
      lat: city.lat,
      lng: city.lng,
      source: `${city.flag} ${city.name}, ${city.country}`,
      isRealGps: false,
    };
    setUserLocation(newCoords);
    loadDropZones(newCoords.lat, newCoords.lng);
  };

  // Start Camera for AR Scanner
  const startCamera = async (targetFacing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: targetFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setArCameraActive(true);
      setFacingMode(targetFacing);

      // Check for torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as { torch?: boolean }) : {};
      setHasTorchSupport(Boolean(capabilities.torch));
    } catch (err: unknown) {
      console.warn('Physical camera unavailable, engaging synthetic cyber matrix viewport:', err);
      setArCameraActive(false);
      setCameraError('Camera access not granted. Running in synthetic tactical simulation mode.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setArCameraActive(false);
    setTorchActive(false);
  };

  // Toggle Torch / Flashlight
  const handleToggleTorch = async () => {
    if (!mediaStreamRef.current) return;
    const track = mediaStreamRef.current.getVideoTracks()[0];
    if (track && hasTorchSupport) {
      try {
        const nextState = !torchActive;
        await track.applyConstraints({
          advanced: [{ torch: nextState } as MediaTrackConstraintSet],
        });
        setTorchActive(nextState);
        playSound('click');
      } catch (err) {
        console.warn('Torch toggle failed', err);
      }
    }
  };

  // Switch between Front & Rear Cameras
  const handleSwitchCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    playSound('pop');
    startCamera(nextFacing);
  };

  // Request & Bind Gyroscope DeviceOrientation
  const handleEnableGyro = async () => {
    playSound('laser');
    if (typeof window === 'undefined') return;

    // iOS 13+ requires explicit permission request
    const DeviceOrientation = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (DeviceOrientation && typeof DeviceOrientation.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientation.requestPermission();
        if (permission === 'granted') {
          setGyroActive(true);
        } else {
          setGyroActive(false);
        }
      } catch {
        setGyroActive(false);
      }
    } else if ('ondeviceorientation' in window) {
      setGyroActive(true);
    }
  };

  // Gyroscope orientation listener
  useEffect(() => {
    if (!gyroActive || activeTab !== 'ar_scanner') return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null && e.beta !== null) {
        // Alpha is compass heading (0-360), Beta is front-back tilt (-180 to 180)
        setViewOrientation({
          yaw: e.alpha,
          pitch: Math.max(-60, Math.min(60, e.beta - 45)),
        });
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [gyroActive, activeTab]);

  // Mouse / Touch Drag Virtual Camera Orbit
  const handleViewDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDraggingView(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      yaw: viewOrientation.yaw,
      pitch: viewOrientation.pitch,
    };
  };

  const handleViewDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingView) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;

    const newYaw = (dragStartRef.current.yaw - deltaX * 0.25 + 360) % 360;
    const newPitch = Math.max(-45, Math.min(45, dragStartRef.current.pitch + deltaY * 0.25));

    setViewOrientation({ yaw: newYaw, pitch: newPitch });
  };

  const handleViewDragEnd = () => {
    setIsDraggingView(false);
  };

  // Launch AR Scanner mode for a target beacon
  const handleLaunchArScan = (zone: DropZone) => {
    setSelectedZone(zone);
    setActiveTab('ar_scanner');
    setDecryptionProgress(0);
    setScanResult(null);
    setDecrypting(false);
    setIsLockedOn(false);
    setCapturedSnapshot(null);
    playSound('laser');
    startCamera();

    // Orient virtual camera toward the beacon's relative bearing
    if (typeof zone.bearingDegrees === 'number') {
      setViewOrientation({ yaw: zone.bearingDegrees, pitch: 0 });
    }
  };

  // Calculate angular delta between user's current orientation and beacon bearing
  const beaconBearing = selectedZone?.bearingDegrees ?? 0;
  const angularDelta = ((beaconBearing - viewOrientation.yaw + 540) % 360) - 180; // -180 to +180 deg
  const pitchOffset = viewOrientation.pitch; // degrees
  const isTargetInViewport = Math.abs(angularDelta) < 35 && Math.abs(pitchOffset) < 30;

  // Compute lock distance factor: 1.0 = dead center, 0 = off target
  useEffect(() => {
    if (isTargetInViewport) {
      const dist = Math.sqrt(Math.pow(angularDelta / 35, 2) + Math.pow(pitchOffset / 30, 2));
      const factor = Math.max(0, 1 - dist);
      setLockDistanceFactor(factor);
      setIsLockedOn(factor > 0.65);
    } else {
      setLockDistanceFactor(0);
      setIsLockedOn(false);
    }
  }, [angularDelta, pitchOffset, isTargetInViewport]);

  // Sonar Audio Proximity Pings
  useEffect(() => {
    if (activeTab !== 'ar_scanner' || !audioSonarEnabled) {
      if (sonarIntervalRef.current) clearInterval(sonarIntervalRef.current);
      return;
    }

    // Interval speeds up as target gets closer to center (from 1400ms down to 180ms)
    const intervalMs = Math.max(160, Math.round(1300 - lockDistanceFactor * 1100));
    const toneFreq = 520 + Math.round(lockDistanceFactor * 680); // 520Hz to 1200Hz

    if (sonarIntervalRef.current) clearInterval(sonarIntervalRef.current);
    sonarIntervalRef.current = setInterval(() => {
      playSonarTone(toneFreq, 0.05 + lockDistanceFactor * 0.04);
      if (lockDistanceFactor > 0.7) {
        triggerHaptic(15);
      }
    }, intervalMs);

    return () => {
      if (sonarIntervalRef.current) clearInterval(sonarIntervalRef.current);
    };
  }, [activeTab, audioSonarEnabled, lockDistanceFactor, playSonarTone]);

  // Decrypt AR Beacon Action
  const handleStartDecryption = () => {
    if (decrypting || decryptionProgress >= 100 || !selectedZone) return;
    setDecrypting(true);
    playSound('laser');
    triggerHaptic([30, 60, 30]);

    let current = decryptionProgress;
    const interval = setInterval(() => {
      current += 8;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setDecryptionProgress(100);
        setDecrypting(false);
        handleClaimDropZone(selectedZone);
      } else {
        setDecryptionProgress(current);
        if (current % 24 === 0) {
          playSonarTone(880 + current * 4, 0.06);
          triggerHaptic(20);
        }
      }
    }, 150);
  };

  // Claim Drop Zone Bounty
  const handleClaimDropZone = async (zone: DropZone) => {
    try {
      playSound('laser');
      const res = await fetch('/api/drop-zones/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dropZoneId: zone.id,
          userId: currentUser.id,
          userLat: userLocation.lat,
          userLng: userLocation.lng,
          arProofVerified: true,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setScanResult({
          awardedCred: data.awardedCred,
          awardedXp: data.awardedXp,
          lootItem: data.lootItem,
        });
        triggerConfetti();
        playSound('complete');
        triggerHaptic([40, 80, 40, 80, 120]);
        if (data.user) {
          onUserUpdate(data.user);
        }
        loadDropZones();
      } else {
        alert(data.error || 'Failed to claim drop zone');
        playSound('error');
      }
    } catch (err) {
      console.error('Claim drop zone error', err);
      playSound('error');
    }
  };

  // Capture Live AR Snapshot Proof
  const handleCaptureSnapshot = () => {
    playSound('laser');
    triggerHaptic(40);

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video feed or synthetic cyber background
    if (arCameraActive && videoRef.current && videoRef.current.readyState >= 2) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      // Draw synthetic cyber matrix backdrop
      ctx.fillStyle = '#050a14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Overlay Tactical AR Hologram & Telemetry
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, 70);
    ctx.fillRect(0, canvas.height - 70, canvas.width, 70);

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#06b6d4';
    ctx.fillText(`DARE AR // NODE ${selectedZone?.code || 'TAC-01'}`, 30, 42);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${selectedZone?.name || 'Tactical Beacon'} · ${userLocation.source}`, 30, canvas.height - 28);
    ctx.fillText(`VERIFIED AT ${new Date().toLocaleTimeString()} · LAT ${userLocation.lat.toFixed(4)} LNG ${userLocation.lng.toFixed(4)}`, canvas.width - 450, canvas.height - 28);

    // Center Crosshair
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    const dataUrl = canvas.toDataURL('image/png');
    setCapturedSnapshot(dataUrl);
    playSound('pop');
  };

  // Deploy New Drop Zone
  const handleDeployZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployName.trim() || !deployTitle.trim() || !deployDesc.trim()) {
      setDeployFeedback('Please complete all required fields.');
      return;
    }

    if (currentUser.cred < deployBounty) {
      setDeployFeedback(`Insufficient Cred balance (${currentUser.cred} CR available).`);
      return;
    }

    setDeploying(true);
    setDeployFeedback(null);
    playSound('laser');

    const chosenArchetype = BEACON_ARCHETYPES.find((a) => a.type === deployArchetype);

    try {
      const res = await fetch('/api/drop-zones/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: deployName,
          category: deployCategory,
          arBeaconType: deployArchetype,
          arObjectIcon: chosenArchetype?.icon || '💠',
          lat: userLocation.lat,
          lng: userLocation.lng,
          radiusMeters: deployRadius,
          city: userLocation.source.split(',')[0].replace(/[^a-zA-Z\s]/g, '').trim() || 'Sector Alpha',
          country: 'Grid',
          bountyCred: deployBounty,
          activeDareTitle: deployTitle,
          activeDareDescription: deployDesc,
          passcodeHint: deployHint,
          userId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        playSound('levelUp');
        triggerConfetti();
        if (data.user) onUserUpdate(data.user);
        setDeployName('');
        setDeployTitle('');
        setDeployDesc('');
        setDeployHint('');
        setActiveTab('radar');
        loadDropZones();
      } else {
        setDeployFeedback(data.error || 'Failed to deploy drop zone');
        playSound('error');
      }
    } catch (err) {
      console.error('Deploy drop zone error', err);
      setDeployFeedback('Network failure during beacon deployment.');
      playSound('error');
    } finally {
      setDeploying(false);
    }
  };

  // Filtered drop zones
  const filteredZones = dropZones.filter((z) => {
    if (filterCategory !== 'all' && z.category !== filterCategory) return false;
    if (filterRarity !== 'all' && z.lootRarity !== filterRarity) return false;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-6xl rounded-3xl border border-cyan-500/30 bg-[#040812] text-slate-100 shadow-[0_0_80px_rgba(6,182,212,0.2)] overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Ambient Spatial Lighting Background */}
        <div className="absolute top-0 right-1/4 h-80 w-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 h-80 w-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 sm:px-7 py-4 bg-slate-950/90 z-20">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Compass className="h-6 w-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white font-tech uppercase">
                  Geofenced Drop Zones & AR Beacons
                </h2>
                <span className="hidden sm:inline-block text-[11px] font-mono text-cyan-400 font-semibold tracking-wider">
                  Tactical Spatial Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hunt real-world GPS geofences, scan 3D holographic beacons via AR viewfinder, and unlock exclusive loot.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="rounded-xl border border-white/10 p-2.5 text-slate-400 hover:border-white/20 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
              title="Close Drop Zones HUD"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sub-Header Navigation & Real-Time GPS Hub Selector */}
        <div className="flex items-center justify-between flex-wrap gap-3 px-5 sm:px-7 py-3 border-b border-white/10 bg-slate-900/70 text-xs font-mono z-20">
          
          {/* Functional Mode Switcher (Clean Segmented Bar) */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-white/10">
            <button
              onClick={() => {
                playSound('pop');
                stopCamera();
                setActiveTab('radar');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'radar'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="h-4 w-4" />
              <span>Tactical Radar ({filteredZones.length})</span>
            </button>

            <button
              onClick={() => {
                playSound('pop');
                setActiveTab('ar_scanner');
                startCamera();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'ar_scanner'
                  ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="h-4 w-4" />
              <span>AR Viewfinder</span>
            </button>

            <button
              onClick={() => {
                playSound('pop');
                stopCamera();
                setActiveTab('deploy');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'deploy'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Deploy Beacon</span>
            </button>
          </div>

          {/* Device GPS & Sector Locator */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-white/10 text-[11px] text-cyan-300">
              <Navigation className="h-3.5 w-3.5 text-cyan-400" />
              <span className="truncate max-w-[200px] sm:max-w-xs">{userLocation.source}</span>
            </div>

            <button
              onClick={handleAcquireGps}
              disabled={gpsLocating}
              className="flex items-center gap-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
              title="Acquire live device GPS coordinates"
            >
              <RefreshCw className={`h-3 w-3 ${gpsLocating ? 'animate-spin' : ''}`} />
              <span>{gpsLocating ? 'Locking GPS...' : 'Sync Live GPS'}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">

          {/* TAB 1: TACTICAL RADAR & GEOFENCE PROXIMITY GRID */}
          {activeTab === 'radar' && (
            <div className="space-y-6">
              
              {/* City Hub Quick Presets */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
                <span className="text-slate-400 text-[11px] shrink-0 font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
                  <Globe className="h-3.5 w-3.5 text-cyan-400" />
                  Sectors:
                </span>
                {PRESET_CITIES.map((city) => {
                  const isCurrent = userLocation.lat === city.lat && userLocation.lng === city.lng;
                  return (
                    <button
                      key={city.name}
                      onClick={() => handleSelectCity(city)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-white/5'
                      }`}
                    >
                      <span>{city.flag}</span>
                      <span>{city.name}</span>
                    </button>
                  );
                })}
              </div>

              {gpsError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 font-mono">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>{gpsError}</span>
                </div>
              )}

              {/* Main Radar Screen & Inspector Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 360° Polar Tactical Radar Screen */}
                <div className="lg:col-span-7 rounded-2xl border border-cyan-500/30 bg-[#030712] p-5 relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[420px] select-none">
                  
                  {/* Subtle Radar Background Grid Lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff08_1px,transparent_1px),linear-gradient(to_bottom,#00ffff08_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
                  
                  {/* Concentric Distance Geofence Rings */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="h-28 w-28 rounded-full border border-cyan-500/20 flex items-start justify-center pt-1 text-[9px] font-mono text-cyan-500/40">50m</div>
                    <div className="absolute h-52 w-52 rounded-full border border-cyan-500/20 flex items-start justify-center pt-1 text-[9px] font-mono text-cyan-500/40">150m</div>
                    <div className="absolute h-76 w-76 rounded-full border border-cyan-500/20 flex items-start justify-center pt-1 text-[9px] font-mono text-cyan-500/40">300m</div>
                    <div className="absolute h-96 w-96 rounded-full border border-cyan-500/15" />

                    {/* Cardinal Axis Lines */}
                    <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-500/15" />
                    <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-500/15" />

                    {/* Cardinal Labels */}
                    <span className="absolute top-2 font-mono text-[10px] font-bold text-cyan-400/80">N 000°</span>
                    <span className="absolute bottom-2 font-mono text-[10px] font-bold text-cyan-400/80">S 180°</span>
                    <span className="absolute right-3 font-mono text-[10px] font-bold text-cyan-400/80">E 090°</span>
                    <span className="absolute left-3 font-mono text-[10px] font-bold text-cyan-400/80">W 270°</span>
                  </div>

                  {/* Sweeping Radar Hand with Phosphor Trail */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="h-96 w-96 rounded-full overflow-hidden opacity-35 animate-spin" style={{ animationDuration: '5s' }}>
                      <div className="h-1/2 w-1/2 bg-gradient-to-br from-cyan-400 via-cyan-500/30 to-transparent" />
                    </div>
                  </div>

                  {/* Central Player Node */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="relative flex items-center justify-center h-7 w-7 rounded-full bg-cyan-400 text-slate-950 font-bold shadow-[0_0_25px_rgba(6,182,212,1)] border-2 border-white">
                      <Navigation className="h-3.5 w-3.5" />
                      <span className="absolute -inset-2.5 rounded-full border border-cyan-400 animate-ping opacity-75" />
                    </div>
                  </div>

                  {/* Dynamic AR Beacon Nodes on Radar Canvas */}
                  <div className="relative w-full h-80 z-20">
                    {filteredZones.map((zone, idx) => {
                      // Calculate polar coordinates on the circular radar
                      const bearing = zone.bearingDegrees ?? (idx * (360 / Math.max(1, filteredZones.length)));
                      const distM = zone.distanceMeters ?? 150;
                      // Normalize distance: 0m = 0%, 500m = 44% from center
                      const radiusPercent = Math.min(44, Math.max(12, (distM / 500) * 44));
                      const rad = ((bearing - 90) * Math.PI) / 180;
                      const posX = 50 + Math.cos(rad) * radiusPercent;
                      const posY = 50 + Math.sin(rad) * radiusPercent;

                      const isSelected = selectedZone?.id === zone.id;
                      const isClaimed = zone.claimedUserIds?.includes(currentUser.id);

                      return (
                        <div
                          key={zone.id}
                          onClick={() => {
                            playSound('pop');
                            setSelectedZone(zone);
                          }}
                          style={{ left: `${posX}%`, top: `${posY}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-30 transition-transform active:scale-90"
                        >
                          <div className={`relative flex items-center justify-center h-9 w-9 rounded-2xl border transition-all ${
                            isSelected
                              ? 'border-white bg-cyan-400 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,1)] scale-115'
                              : isClaimed
                              ? 'border-emerald-500/60 bg-emerald-950/80 text-emerald-400'
                              : zone.lootRarity === 'legendary'
                              ? 'border-amber-400 bg-amber-950/80 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse'
                              : 'border-cyan-500/50 bg-slate-900/90 text-cyan-300 hover:border-cyan-400 hover:scale-110'
                          }`}>
                            <span className="text-base">{zone.arObjectIcon || '💠'}</span>

                            {/* Ping beacon ring */}
                            {isSelected && (
                              <span className="absolute -inset-2 rounded-2xl border border-cyan-400 animate-ping opacity-60" />
                            )}
                          </div>

                          {/* Hover Tooltip */}
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap z-40">
                            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-[10px] font-mono shadow-2xl">
                              <div className="font-bold text-white">{zone.name}</div>
                              <div className="text-cyan-400">
                                {zone.distanceMeters ? `${zone.distanceMeters}m away · ` : ''}+{zone.bountyCred} CR
                              </div>
                            </div>
                            <div className="w-1.5 h-1.5 bg-slate-950 rotate-45 -mt-1 border-r border-b border-cyan-500/40" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Radar Telemetry Status Bar */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950/90 px-3.5 py-2.5 rounded-xl border border-white/5 z-20">
                    <span className="flex items-center gap-2 text-cyan-400">
                      <Radio className="h-3.5 w-3.5 animate-pulse" />
                      <span>Radar Active: {filteredZones.length} Nodes in Range</span>
                    </span>
                    <span>Max Range: 500m Geofence</span>
                  </div>

                </div>

                {/* Selected Beacon Inspector Panel */}
                <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 sm:p-6 shadow-2xl">
                  {selectedZone ? (
                    <div className="space-y-4">
                      
                      {/* Top Unboxed Metadata */}
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2 text-slate-400">
                          <span className={`font-bold uppercase ${
                            selectedZone.lootRarity === 'legendary'
                              ? 'text-amber-400'
                              : selectedZone.lootRarity === 'epic'
                              ? 'text-purple-400'
                              : 'text-cyan-400'
                          }`}>
                            {selectedZone.lootRarity} Beacon
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{selectedZone.code}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{selectedZone.category}</span>
                        </div>

                        {selectedZone.distanceMeters !== undefined && (
                          <div className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                            selectedZone.inGeofence
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-950 text-slate-300 border border-white/10'
                          }`}>
                            {selectedZone.distanceMeters}m · {selectedZone.cardinalHeading || 'NE'}
                          </div>
                        )}
                      </div>

                      {/* Title & Icon Header */}
                      <div className="flex items-start gap-3.5 pt-1">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-400/40 text-3xl shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                          {selectedZone.arObjectIcon || '💠'}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                            {selectedZone.name}
                          </h3>
                          <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                            <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                            <span>{selectedZone.city}, {selectedZone.country}</span>
                            <span aria-hidden="true">·</span>
                            <span>{selectedZone.radiusMeters}m Geofence</span>
                          </div>
                        </div>
                      </div>

                      {/* Field Objective Brief */}
                      <div className="rounded-xl bg-slate-950/90 border border-white/5 p-4 space-y-1.5">
                        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                          <Flame className="h-3.5 w-3.5 text-amber-400" />
                          <span>Field Objective</span>
                        </div>
                        <div className="text-sm font-bold text-white">{selectedZone.activeDareTitle}</div>
                        <p className="text-xs text-slate-300 leading-relaxed">{selectedZone.activeDareDescription}</p>
                      </div>

                      {/* AR Passcode / Optical Hint */}
                      {selectedZone.passcodeHint && (
                        <div className="text-xs text-slate-300 font-mono bg-cyan-950/20 p-3 rounded-xl border border-cyan-500/20 flex items-start gap-2.5">
                          <Eye className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-cyan-400 font-bold">AR Optical Hint: </span>
                            <span>{selectedZone.passcodeHint}</span>
                          </div>
                        </div>
                      )}

                      {/* Bounty & XP Yield */}
                      <div className="grid grid-cols-2 gap-3 font-mono">
                        <div className="p-3 rounded-xl bg-slate-950 border border-white/5 text-center">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Cred Bounty</div>
                          <div className="text-lg font-black text-amber-400 mt-0.5">+{selectedZone.bountyCred} CR</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-white/5 text-center">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Rank XP</div>
                          <div className="text-lg font-black text-purple-400 mt-0.5">+{selectedZone.bountyXp} XP</div>
                        </div>
                      </div>

                      {/* Tactical Armory Item Drop Preview if applicable */}
                      {selectedZone.itemDrop && (
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center gap-3">
                          <span className="text-2xl">{selectedZone.itemDrop.icon}</span>
                          <div className="text-xs">
                            <div className="font-bold text-amber-300">Guaranteed Item Drop</div>
                            <div className="text-slate-300">{selectedZone.itemDrop.name}</div>
                          </div>
                        </div>
                      )}

                      {/* Primary Action Button */}
                      <div className="pt-2">
                        {selectedZone.claimedUserIds?.includes(currentUser.id) ? (
                          <div className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Bounty Secured for this Sector</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleLaunchArScan(selectedZone)}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 px-5 py-3.5 text-xs font-black text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-95 transition-all cursor-pointer"
                          >
                            <Camera className="h-4 w-4" />
                            <span>Launch AR Viewfinder Scanner</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400 space-y-3 font-mono">
                      <Radio className="h-9 w-9 text-cyan-400 animate-pulse" />
                      <p className="text-xs">Select any beacon node on the radar grid to inspect its field objective, bounty, and AR cipher.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Filter Tabs & Total Count */}
              <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
                  <span className="text-slate-400 text-[11px] font-bold uppercase mr-1">Filter:</span>
                  {['all', 'cyber', 'tech', 'physical', 'creative', 'social'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-3 py-1 rounded-lg uppercase text-[11px] font-bold transition-all cursor-pointer ${
                        filterCategory === cat
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="text-xs font-mono text-slate-400">
                  Total Active Nodes: <strong className="text-white">{filteredZones.length}</strong>
                </div>
              </div>

              {/* Grid List of Available Drop Zones */}
              {filteredZones.length === 0 ? (
                <div className="py-16 text-center text-xs font-mono text-slate-400 rounded-2xl border border-white/10 bg-slate-900/40 p-8 flex flex-col items-center justify-center space-y-2">
                  <Radio className="h-8 w-8 text-cyan-500/50 animate-pulse mb-1" />
                  <p className="font-bold text-sm text-slate-300">
                    No drop zones or AR beacons deployed in this area yet.
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm">
                    Be the pioneer: fund and deploy an AR geofenced drop beacon to broadcast bounties to operatives nearby.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredZones.map((zone) => {
                  const isClaimed = zone.claimedUserIds?.includes(currentUser.id);
                  const isSelected = selectedZone?.id === zone.id;

                  return (
                    <div
                      key={zone.id}
                      onClick={() => {
                        playSound('pop');
                        setSelectedZone(zone);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                          : 'border-white/10 bg-slate-900/60 hover:border-cyan-500/40 hover:bg-slate-900/90'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{zone.arObjectIcon || '💠'}</span>
                            <div>
                              <h4 className="font-bold text-sm text-white line-clamp-1">{zone.name}</h4>
                              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                                <span>{zone.city}</span>
                                <span aria-hidden="true">·</span>
                                <span>{zone.code}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-black text-amber-400 whitespace-nowrap">
                            +{zone.bountyCred} CR
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
                          {zone.activeDareTitle}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-purple-300">+{zone.bountyXp} XP</span>
                        {isClaimed ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Claimed
                          </span>
                        ) : (
                          <span className="text-cyan-400 font-bold group-hover:underline flex items-center gap-1">
                            Scan AR Beacon →
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}

            </div>
          )}

          {/* TAB 2: IMMERSIVE 3D SPATIAL AR VIEWFINDER SCANNER */}
          {activeTab === 'ar_scanner' && (
            <div className="space-y-4">
              
              {/* AR HUD Stage Viewport */}
              <div 
                ref={arContainerRef}
                onMouseDown={handleViewDragStart}
                onMouseMove={handleViewDragMove}
                onMouseUp={handleViewDragEnd}
                onTouchStart={handleViewDragStart}
                onTouchMove={handleViewDragMove}
                onTouchEnd={handleViewDragEnd}
                className="relative h-[480px] sm:h-[560px] w-full rounded-2xl overflow-hidden border border-cyan-500/40 bg-black shadow-2xl flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
              >
                
                {/* Live Real-World Video Feed or Synthetic Cyber Matrix */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
                    arCameraActive ? 'opacity-90' : 'hidden'
                  }`}
                />

                {/* Synthetic Tactical Matrix Grid when camera is off or denied */}
                {!arCameraActive && (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0e223d,#030712)] pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff10_1px,transparent_1px),linear-gradient(to_bottom,#00ffff10_1px,transparent_1px)] bg-[size:32px_32px]" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <div className="h-[500px] w-[500px] rounded-full border border-cyan-400/40 animate-spin-slow" />
                      <div className="absolute h-[320px] w-[320px] rounded-full border border-indigo-400/30" />
                    </div>
                    {/* Horizon Grid Mesh */}
                    <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-cyan-950/40 to-transparent" />
                  </div>
                )}

                {/* Top Azimuth Compass Tape (0° to 360°) */}
                <div className="absolute top-4 inset-x-8 flex flex-col items-center pointer-events-none z-20">
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-cyan-500/30 text-xs font-mono text-cyan-300">
                    <Compass className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="font-bold">HEADING {Math.round(viewOrientation.yaw).toString().padStart(3, '0')}°</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-400">BEACON {beaconBearing.toString().padStart(3, '0')}°</span>
                  </div>

                  {/* Off-Screen Indicator Arrow if beacon is outside current field of view */}
                  {!isTargetInViewport && (
                    <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[11px] font-mono font-bold animate-pulse">
                      {angularDelta > 0 ? (
                        <><span>Turn Right {Math.round(Math.abs(angularDelta))}°</span> <span>→</span></>
                      ) : (
                        <><span>←</span> <span>Turn Left {Math.round(Math.abs(angularDelta))}°</span></>
                      )}
                    </div>
                  )}
                </div>

                {/* Top Left System Telemetry Box */}
                <div className="absolute top-4 left-4 flex flex-col gap-1 text-[11px] font-mono text-cyan-300 bg-black/75 backdrop-blur-md p-3 rounded-xl border border-cyan-500/30 pointer-events-none z-20">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${arCameraActive ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'}`} />
                    <span className="font-bold">{arCameraActive ? 'OPTICAL SENSOR ACTIVE' : 'TACTICAL SIMULATION'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Node: {selectedZone?.code || 'DROP-LOC-01'}</div>
                  <div className="text-[10px] text-slate-400">Signal: {selectedZone?.beaconSignalStrength || 95}% dBm</div>
                </div>

                {/* Top Right Controls & Bounty */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                  {/* Audio Sonar Toggle */}
                  <button
                    onClick={() => {
                      setAudioSonarEnabled(!audioSonarEnabled);
                      playSound('pop');
                    }}
                    className={`p-2 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                      audioSonarEnabled
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-black/60 border-white/10 text-slate-400'
                    }`}
                    title={audioSonarEnabled ? 'Mute Sonar Audio' : 'Unmute Sonar Audio'}
                  >
                    {audioSonarEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </button>

                  {/* Gyroscope Toggle */}
                  <button
                    onClick={handleEnableGyro}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur-md border text-[11px] font-mono font-bold transition-all cursor-pointer ${
                      gyroActive
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-black/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                    title="Toggle Device Gyroscope Tracking"
                  >
                    <RotateCw className={`h-3.5 w-3.5 ${gyroActive ? 'animate-spin-slow' : ''}`} />
                    <span className="hidden sm:inline">{gyroActive ? 'Gyro Locked' : 'Enable Gyro'}</span>
                  </button>

                  {/* Camera Torch Toggle (if available) */}
                  {hasTorchSupport && (
                    <button
                      onClick={handleToggleTorch}
                      className={`p-2 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                        torchActive
                          ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                          : 'bg-black/60 border-white/10 text-slate-400'
                      }`}
                      title="Toggle Flashlight Torch"
                    >
                      <Sun className="h-4 w-4" />
                    </button>
                  )}

                  {/* Switch Front/Rear Camera */}
                  {arCameraActive && (
                    <button
                      onClick={handleSwitchCameraFacing}
                      className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Switch Camera Facing"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Central Reticle Crosshairs */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className={`relative flex items-center justify-center h-32 w-32 rounded-full border border-dashed transition-all duration-150 ${
                    isLockedOn
                      ? 'border-emerald-400 scale-95 shadow-[0_0_30px_rgba(52,211,153,0.5)]'
                      : 'border-cyan-400/40 scale-100'
                  }`}>
                    {/* Targeting Brackets */}
                    <div className="absolute -top-3 -left-3 h-5 w-5 border-t-2 border-l-2 border-cyan-400" />
                    <div className="absolute -top-3 -right-3 h-5 w-5 border-t-2 border-r-2 border-cyan-400" />
                    <div className="absolute -bottom-3 -left-3 h-5 w-5 border-b-2 border-l-2 border-cyan-400" />
                    <div className="absolute -bottom-3 -right-3 h-5 w-5 border-b-2 border-r-2 border-cyan-400" />

                    {/* Artificial Horizon Crosshair */}
                    <div className="absolute inset-x-2 top-1/2 h-px bg-cyan-400/30" />
                    <div className="absolute inset-y-2 left-1/2 w-px bg-cyan-400/30" />
                  </div>
                </div>

                {/* 3D Holographic AR Beacon Object (Positioned by Angular Delta & Pitch) */}
                {isTargetInViewport && (
                  <div 
                    style={{
                      transform: `translate(${angularDelta * 8}px, ${pitchOffset * 6}px)`,
                      transition: isDraggingView ? 'none' : 'transform 0.12s ease-out',
                    }}
                    onClick={handleStartDecryption}
                    className="relative flex flex-col items-center justify-center z-20 cursor-pointer group"
                  >
                    {/* 3D Holographic Beacon Projection */}
                    <div className={`relative flex items-center justify-center h-28 w-28 rounded-3xl border-2 transition-all ${
                      isLockedOn
                        ? 'border-emerald-400 bg-emerald-950/70 shadow-[0_0_50px_rgba(52,211,153,0.9)] scale-110'
                        : 'border-cyan-400/80 bg-cyan-950/70 shadow-[0_0_40px_rgba(6,182,212,0.7)] animate-pulse'
                    }`}>
                      {/* Rotating Orbital Gyro Rings for 3D Cyber Depth */}
                      <div className="absolute inset-0 rounded-3xl border border-cyan-300/40 animate-spin-slow" />
                      <div className="absolute -inset-2 rounded-full border border-indigo-400/30 animate-spin" style={{ animationDuration: '8s' }} />

                      <span className="text-5xl animate-bounce transform hover:scale-125 transition-transform">
                        {selectedZone?.arObjectIcon || '💠'}
                      </span>
                    </div>

                    {/* Target Lock Status Badge */}
                    <div className="mt-3 px-3.5 py-1.5 rounded-full bg-black/85 border border-cyan-400/50 text-[11px] font-mono font-bold text-cyan-200 shadow-xl flex items-center gap-1.5">
                      <Target className={`h-3.5 w-3.5 ${isLockedOn ? 'text-emerald-400' : 'text-cyan-400'}`} />
                      <span>
                        {decrypting 
                          ? `DECRYPTING CIPHER... ${decryptionProgress}%`
                          : isLockedOn
                          ? 'TARGET LOCKED · TAP TO DECRYPT'
                          : 'ALIGN RETICLE TO LOCK BEACON'}
                      </span>
                    </div>

                    {/* Decryption Progress Bar */}
                    {decrypting && (
                      <div className="w-56 h-2.5 bg-slate-950 rounded-full mt-2 border border-cyan-500/50 overflow-hidden shadow-lg">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-emerald-300 transition-all duration-150"
                          style={{ width: `${decryptionProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Viewfinder Action Bar */}
                <div className="absolute bottom-4 inset-x-4 flex items-center justify-between gap-3 text-xs font-mono bg-black/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 z-20">
                  <div className="text-slate-300 max-w-[50%]">
                    <div className="font-bold text-white truncate">{selectedZone?.name || 'Tactical Node'}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {selectedZone?.activeDareTitle}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Capture Snapshot Button */}
                    <button
                      onClick={handleCaptureSnapshot}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-bold text-xs transition-all cursor-pointer active:scale-95"
                      title="Take AR Snapshot Proof"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Capture Proof</span>
                    </button>

                    {/* Decrypt CTA */}
                    <button
                      onClick={handleStartDecryption}
                      disabled={decrypting || decryptionProgress >= 100}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Crosshair className="h-3.5 w-3.5" />
                      <span>{decryptionProgress >= 100 ? 'Decrypted' : decrypting ? 'Syncing...' : 'Lock & Decrypt'}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Snapshot Captured Preview Modal */}
              {capturedSnapshot && (
                <div className="p-4 rounded-2xl border border-cyan-500/40 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <img 
                      src={capturedSnapshot} 
                      alt="AR Tactical Snapshot" 
                      className="h-16 w-24 object-cover rounded-xl border border-cyan-400/40" 
                    />
                    <div>
                      <div className="font-bold text-white text-xs">Tactical Snapshot Verified</div>
                      <div className="text-[11px] text-slate-400 font-mono">Proof stamped with GPS telemetry and AR overlay</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={capturedSnapshot}
                      download={`dare-ar-beacon-${selectedZone?.code || 'node'}.png`}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold transition-all cursor-pointer active:scale-95"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Proof</span>
                    </a>
                    <button
                      onClick={() => setCapturedSnapshot(null)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Successful Decryption & Loot Drop Card */}
              {scanResult && (
                <div className="p-5 sm:p-6 rounded-2xl border border-emerald-500/50 bg-gradient-to-br from-emerald-950/70 via-slate-900 to-cyan-950/50 space-y-3 animate-in fade-in zoom-in-95 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-base">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span>AR BEACON CIPHER DECRYPTED & VERIFIED!</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                      BOUNTY DEPOSITED
                    </span>
                  </div>

                  <p className="text-xs text-slate-200">
                    You authenticated the physical GPS geofence at <strong>{selectedZone?.name}</strong>. Cred rewards and XP have been deposited directly into your neural wallet.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-center pt-2">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                      <div className="text-[10px] text-slate-400 uppercase">Cred Bounty</div>
                      <div className="text-xl font-black text-amber-400 mt-0.5">+{scanResult.awardedCred} CR</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                      <div className="text-[10px] text-slate-400 uppercase">Experience Points</div>
                      <div className="text-xl font-black text-purple-400 mt-0.5">+{scanResult.awardedXp} XP</div>
                    </div>
                    {scanResult.lootItem && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 col-span-2 sm:col-span-1">
                        <div className="text-[10px] text-amber-400 font-bold uppercase">Armory Drop Unlocked!</div>
                        <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5 mt-1">
                          <span className="text-lg">{scanResult.lootItem.icon}</span>
                          <span className="truncate">{scanResult.lootItem.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: DEPLOY CUSTOM GEOFENCED DROP ZONE */}
          {activeTab === 'deploy' && (
            <form onSubmit={handleDeployZone} className="space-y-6">
              
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 flex items-start gap-3.5">
                <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <div className="font-bold text-amber-300 text-sm">Deploy a Geofenced Cyber Beacon</div>
                  Broadcast a real-world GPS bounty at your current coordinates. Nearby agents can scan and claim your field dare via AR tracking.
                </div>
              </div>

              {deployFeedback && (
                <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-950/30 text-xs text-red-300 font-mono">
                  {deployFeedback}
                </div>
              )}

              {/* AR Beacon Archetype Selector */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-300">Choose AR Beacon Archetype *</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {BEACON_ARCHETYPES.map((arch) => (
                    <button
                      key={arch.type}
                      type="button"
                      onClick={() => setDeployArchetype(arch.type)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        deployArchetype === arch.type
                          ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'border-white/10 bg-slate-900/60 hover:border-white/20'
                      }`}
                    >
                      <span className="text-2xl">{arch.icon}</span>
                      <div className="font-bold text-xs text-white mt-1">{arch.label}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{arch.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300">Beacon Location Name *</label>
                  <input
                    type="text"
                    value={deployName}
                    onChange={(e) => setDeployName(e.target.value)}
                    placeholder="e.g. Piccadilly Neon Vault"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300">Dare Category *</label>
                  <select
                    value={deployCategory}
                    onChange={(e) => setDeployCategory(e.target.value as DareCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  >
                    <option value="cyber">Cyber & Hacking</option>
                    <option value="tech">Tech & Terminal</option>
                    <option value="physical">Physical & Fitness</option>
                    <option value="creative">Creative & Audio</option>
                    <option value="social">Social & Guerrilla</option>
                    <option value="absurd">Absurd & Wildcard</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-mono font-bold text-slate-300">Field Objective Title *</label>
                  <input
                    type="text"
                    value={deployTitle}
                    onChange={(e) => setDeployTitle(e.target.value)}
                    placeholder="e.g. 50 Pushup Cipher Relay"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-mono font-bold text-slate-300">Dare Instructions & Verification Criteria *</label>
                  <textarea
                    rows={3}
                    value={deployDesc}
                    onChange={(e) => setDeployDesc(e.target.value)}
                    placeholder="Describe what the challenger must physically or digitally execute when within geofence range..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-mono font-bold text-slate-300">AR Optical / Passcode Hint (Optional)</label>
                  <input
                    type="text"
                    value={deployHint}
                    onChange={(e) => setDeployHint(e.target.value)}
                    placeholder="e.g. Align viewfinder directly with the copper statue facing West"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300">Cred Bounty Fund ({deployBounty} CR) *</label>
                  <input
                    type="range"
                    min={100}
                    max={1000}
                    step={50}
                    value={deployBounty}
                    onChange={(e) => setDeployBounty(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>100 CR (Min)</span>
                    <span className="text-amber-400 font-bold">{deployBounty} Cred</span>
                    <span>1000 CR (Max)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300">Geofence Radius ({deployRadius}m)</label>
                  <input
                    type="range"
                    min={50}
                    max={1000}
                    step={25}
                    value={deployRadius}
                    onChange={(e) => setDeployRadius(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>50m (Strict)</span>
                    <span className="text-cyan-400 font-bold">{deployRadius} Meters</span>
                    <span>1000m (Broad)</span>
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="text-xs font-mono text-slate-400">
                  Wallet Balance: <strong className="text-white">{currentUser.cred} CR</strong>
                </div>

                <button
                  type="submit"
                  disabled={deploying || currentUser.cred < deployBounty}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(245,158,11,0.35)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Radio className="h-4 w-4" />
                  <span>{deploying ? 'Deploying to Grid...' : `Fund & Deploy (${deployBounty} CR)`}</span>
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
