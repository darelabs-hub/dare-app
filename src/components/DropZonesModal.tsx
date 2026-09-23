import React, { useState, useEffect, useRef } from 'react';
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
  Globe,
  Sliders,
  ChevronRight,
  Award
} from 'lucide-react';
import { DropZone, UserProfile, ArmoryItem, DareCategory, ItemRarity } from '../types';
import { playSound } from '../utils/soundEffects';
import { triggerConfetti } from './ConfettiEffect';

interface DropZonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserUpdate: (updatedUser: UserProfile) => void;
  onNavigateToDare?: (dareTitle: string) => void;
}

const PRESET_CITIES = [
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194, country: 'USA', flag: '🇺🇸' },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, country: 'Japan', flag: '🇯🇵' },
  { name: 'New York', lat: 40.7128, lng: -74.0060, country: 'USA', flag: '🇺🇸' },
  { name: 'London', lat: 51.5074, lng: -0.1278, country: 'UK', flag: '🇬🇧' },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050, country: 'Germany', flag: '🇩🇪' },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, country: 'Australia', flag: '🇦🇺' },
  { name: 'Austin', lat: 30.2672, lng: -97.7431, country: 'USA', flag: '🇺🇸' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, country: 'France', flag: '🇫🇷' },
];

export const DropZonesModal: React.FC<DropZonesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  onNavigateToDare,
}) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'ar_scanner' | 'deploy'>('radar');
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState<DropZone | null>(null);
  
  // Geolocation state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; source: string }>({
    lat: 37.7749,
    lng: -122.4194,
    source: 'San Francisco Hub (Default)',
  });
  const [gpsLocating, setGpsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');

  // AR Scanner HUD State
  const [arScanning, setArScanning] = useState(false);
  const [arCameraActive, setArCameraActive] = useState(false);
  const [decryptionProgress, setDecryptionProgress] = useState(0);
  const [isLockedOn, setIsLockedOn] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [scanResult, setScanResult] = useState<{
    awardedCred: number;
    awardedXp: number;
    lootItem?: ArmoryItem;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [reticleOffset, setReticleOffset] = useState({ x: 0, y: 0 });

  // Camera video ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Deploy New Zone Form State
  const [deployName, setDeployName] = useState('');
  const [deployCategory, setDeployCategory] = useState<DareCategory>('cyber');
  const [deployBounty, setDeployBounty] = useState<number>(250);
  const [deployTitle, setDeployTitle] = useState('');
  const [deployDesc, setDeployDesc] = useState('');
  const [deployRadius, setDeployRadius] = useState<number>(250);
  const [deploying, setDeploying] = useState(false);
  const [deployFeedback, setDeployFeedback] = useState<string | null>(null);

  // Load Drop Zones from Backend
  const loadDropZones = async (lat?: number, lng?: number) => {
    setLoading(true);
    try {
      const currentLat = lat ?? userLocation.lat;
      const currentLng = lng ?? userLocation.lng;
      const res = await fetch(`/api/drop-zones?lat=${currentLat}&lng=${currentLng}`);
      if (res.ok) {
        const data = await res.json();
        setDropZones(data);
        if (data.length > 0 && !selectedZone) {
          setSelectedZone(data[0]);
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
      loadDropZones();
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Request Device GPS
  const handleAcquireGps = () => {
    setGpsLocating(true);
    setGpsError(null);
    playSound('laser');

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setGpsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: `Live GPS Lock (±${Math.round(pos.coords.accuracy)}m)`,
        };
        setUserLocation(newCoords);
        setGpsLocating(false);
        playSound('levelUp');
        loadDropZones(newCoords.lat, newCoords.lng);
      },
      (err) => {
        console.warn('GPS permission denied or unavailable', err);
        setGpsError('GPS permission denied or timeout. You can select a city hub manually.');
        setGpsLocating(false);
        playSound('error');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Switch City Hub
  const handleSelectCity = (city: typeof PRESET_CITIES[0]) => {
    playSound('pop');
    const newCoords = {
      lat: city.lat,
      lng: city.lng,
      source: `${city.flag} ${city.name}, ${city.country}`,
    };
    setUserLocation(newCoords);
    loadDropZones(newCoords.lat, newCoords.lng);
  };

  // Start Camera for AR Scanner
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setArCameraActive(true);
    } catch (err) {
      console.log('Camera access unavailable, running cyber synthetic optical matrix', err);
      setArCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setArCameraActive(false);
  };

  // Switch to AR Scanner mode for a specific zone
  const handleLaunchArScan = (zone: DropZone) => {
    setSelectedZone(zone);
    setActiveTab('ar_scanner');
    setDecryptionProgress(0);
    setScanResult(null);
    setDecrypting(false);
    setIsLockedOn(false);
    playSound('laser');
    startCamera();
  };

  // Handle AR Interactive Reticle Movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 40;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 40;
    setReticleOffset({ x, y });
  };

  // Decrypt AR Beacon
  const handleStartDecryption = () => {
    if (decrypting || decryptionProgress >= 100 || !selectedZone) return;
    setDecrypting(true);
    setIsLockedOn(true);
    playSound('laser');

    let current = decryptionProgress;
    const interval = setInterval(() => {
      current += 10;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setDecryptionProgress(100);
        setDecrypting(false);
        handleClaimDropZone(selectedZone);
      } else {
        setDecryptionProgress(current);
        if (current % 30 === 0) playSound('pop');
      }
    }, 180);
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

    try {
      const res = await fetch('/api/drop-zones/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: deployName,
          category: deployCategory,
          lat: userLocation.lat,
          lng: userLocation.lng,
          radiusMeters: deployRadius,
          city: userLocation.source.split(',')[0].replace(/[^a-zA-Z\s]/g, '').trim() || 'Sector Alpha',
          country: 'Grid',
          bountyCred: deployBounty,
          activeDareTitle: deployTitle,
          activeDareDescription: deployDesc,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl border border-cyan-500/40 bg-[#060b14] text-slate-100 shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glowing HUD Grid Accents */}
        <div className="absolute top-0 right-0 h-64 w-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-64 w-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 px-5 sm:px-6 py-4 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Compass className="h-6 w-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white font-tech">
                  GEOFENCED DROP ZONES & AR BEACONS
                </h2>
                <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-400/30">
                  RADAR V3.2 LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Discover localized GPS bounties, scan physical AR beacon nodes, and claim rare cyber loot.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-xl border border-white/10 p-2 text-slate-400 hover:border-white/20 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-5 sm:px-6 py-3 border-b border-white/10 bg-slate-900/60 font-mono text-xs">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-white/10">
            <button
              onClick={() => {
                playSound('pop');
                stopCamera();
                setActiveTab('radar');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'radar'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="h-4 w-4 text-cyan-400" />
              <span>Geofence Radar ({filteredZones.length})</span>
            </button>

            <button
              onClick={() => {
                playSound('pop');
                setActiveTab('ar_scanner');
                startCamera();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'ar_scanner'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="h-4 w-4 text-indigo-400" />
              <span>AR Beacon Viewfinder</span>
            </button>

            <button
              onClick={() => {
                playSound('pop');
                stopCamera();
                setActiveTab('deploy');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'deploy'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="h-4 w-4 text-amber-400" />
              <span>Deploy Drop Zone</span>
            </button>
          </div>

          {/* Current GPS Status Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-cyan-500/20 text-[11px] text-cyan-300">
              <Navigation className="h-3.5 w-3.5 text-cyan-400" />
              <span className="truncate max-w-[180px] sm:max-w-xs">{userLocation.source}</span>
            </div>
            <button
              onClick={handleAcquireGps}
              disabled={gpsLocating}
              className="flex items-center gap-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Acquire live GPS from browser location"
            >
              <RefreshCw className={`h-3 w-3 ${gpsLocating ? 'animate-spin' : ''}`} />
              <span>{gpsLocating ? 'Locating...' : 'Sync GPS'}</span>
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-5 sm:p-6 max-h-[72vh] overflow-y-auto space-y-6">

          {/* TAB 1: GEOFENCE RADAR & DROP LIST */}
          {activeTab === 'radar' && (
            <div className="space-y-6">
              
              {/* City Hub Quick Presets */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
                <span className="text-slate-400 text-[11px] shrink-0 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-cyan-400" />
                  Hub Sectors:
                </span>
                {PRESET_CITIES.map((city) => {
                  const isCurrent = userLocation.lat === city.lat && userLocation.lng === city.lng;
                  return (
                    <button
                      key={city.name}
                      onClick={() => handleSelectCity(city)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-white/5'
                      }`}
                    >
                      <span>{city.flag}</span>
                      <span>{city.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Radar Stage & Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual Tactical Radar Map View */}
                <div className="lg:col-span-7 rounded-2xl border border-cyan-500/30 bg-[#050912] p-4 relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[360px]">
                  
                  {/* Radar Background Grid */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff08_1px,transparent_1px),linear-gradient(to_bottom,#00ffff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                  
                  {/* Concentric distance rings */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="h-32 w-32 rounded-full border border-cyan-500/15" />
                    <div className="absolute h-56 w-56 rounded-full border border-cyan-500/15" />
                    <div className="absolute h-80 w-80 rounded-full border border-cyan-500/15" />
                    <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-500/10" />
                    <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-500/10" />
                  </div>

                  {/* Sweep radar hand */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="h-80 w-80 rounded-full overflow-hidden opacity-30 animate-spin" style={{ animationDuration: '6s' }}>
                      <div className="h-1/2 w-1/2 bg-gradient-to-br from-cyan-400 to-transparent" />
                    </div>
                  </div>

                  {/* Center Player Marker */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="relative flex items-center justify-center h-6 w-6 rounded-full bg-cyan-400 text-slate-950 font-bold shadow-[0_0_20px_rgba(6,182,212,1)] border-2 border-white">
                      <Navigation className="h-3 w-3" />
                      <span className="absolute -inset-2 rounded-full border border-cyan-400 animate-ping" />
                    </div>
                  </div>

                  {/* Dynamic Drop Zone Beacon Blips */}
                  <div className="relative w-full h-72 z-10">
                    {filteredZones.map((zone, idx) => {
                      // Relative layout projection
                      const angle = (idx * (360 / Math.max(1, filteredZones.length)) * Math.PI) / 180;
                      const distRadius = 35 + (idx % 3) * 22; // % from center
                      const posX = 50 + Math.cos(angle) * distRadius;
                      const posY = 50 + Math.sin(angle) * distRadius;
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
                          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-30"
                        >
                          <div className={`relative flex items-center justify-center h-8 w-8 rounded-2xl border transition-all transform group-hover:scale-125 ${
                            isSelected
                              ? 'border-white bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.9)] scale-110'
                              : isClaimed
                              ? 'border-emerald-500/60 bg-emerald-950/80 text-emerald-400'
                              : zone.lootRarity === 'legendary'
                              ? 'border-amber-400 bg-amber-950/80 text-amber-300 animate-pulse'
                              : 'border-cyan-500/60 bg-slate-900/90 text-cyan-300'
                          }`}>
                            <span className="text-sm">{zone.arObjectIcon || '💠'}</span>
                          </div>

                          {/* Hover Tooltip */}
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap z-40">
                            <div className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-[10px] font-mono shadow-xl">
                              <div className="font-bold text-white">{zone.name}</div>
                              <div className="text-cyan-400">+{zone.bountyCred} Cred • {zone.code}</div>
                            </div>
                            <div className="w-1.5 h-1.5 bg-slate-950 rotate-45 -mt-1 border-r border-b border-cyan-500/40" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Radar Telemetry Footer */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950/90 px-3 py-2 rounded-xl border border-white/5 z-20">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <Radio className="h-3.5 w-3.5 animate-pulse" />
                      <span>Radar Sweep: Active ({filteredZones.length} Nodes)</span>
                    </span>
                    <span>Range: 500m Geofence</span>
                  </div>
                </div>

                {/* Selected Beacon Details / Inspector Panel */}
                <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-5 shadow-xl">
                  {selectedZone ? (
                    <div className="space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${
                          selectedZone.lootRarity === 'legendary'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : selectedZone.lootRarity === 'epic'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        }`}>
                          {selectedZone.lootRarity} Beacon
                        </span>

                        <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-white/5">
                          {selectedZone.code}
                        </span>
                      </div>

                      {/* Title & Icon */}
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-2xl shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                          {selectedZone.arObjectIcon || '💠'}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                            {selectedZone.name}
                          </h3>
                          <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-cyan-400" />
                            {selectedZone.city}, {selectedZone.country} • Geofence: {selectedZone.radiusMeters}m
                          </p>
                        </div>
                      </div>

                      {/* Active Challenge Brief */}
                      <div className="rounded-xl bg-slate-950/80 border border-white/5 p-3 space-y-1.5">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                          <Flame className="h-3 w-3 text-amber-400" />
                          Field Objective
                        </div>
                        <div className="text-xs font-bold text-white">{selectedZone.activeDareTitle}</div>
                        <p className="text-xs text-slate-300">{selectedZone.activeDareDescription}</p>
                      </div>

                      {/* Passcode / AR Hint */}
                      {selectedZone.passcodeHint && (
                        <div className="text-[11px] text-slate-400 font-mono bg-cyan-950/30 p-2.5 rounded-xl border border-cyan-500/20 flex items-center gap-2">
                          <Eye className="h-4 w-4 text-cyan-400 shrink-0" />
                          <span><strong>AR Hint:</strong> {selectedZone.passcodeHint}</span>
                        </div>
                      )}

                      {/* Bounty & Rewards Breakdown */}
                      <div className="grid grid-cols-2 gap-2 font-mono">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 text-center">
                          <div className="text-[10px] text-slate-400 uppercase">Cred Bounty</div>
                          <div className="text-base font-black text-amber-400">+{selectedZone.bountyCred} CR</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 text-center">
                          <div className="text-[10px] text-slate-400 uppercase">Rank XP</div>
                          <div className="text-base font-black text-purple-400">+{selectedZone.bountyXp} XP</div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2">
                        {selectedZone.claimedUserIds?.includes(currentUser.id) ? (
                          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Bounty Secured for this Sector</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleLaunchArScan(selectedZone)}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 px-5 py-3 text-xs font-black text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition-all cursor-pointer"
                          >
                            <Camera className="h-4 w-4 fill-current text-slate-950" />
                            <span>Launch AR Beacon Scanner</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 space-y-2 font-mono">
                      <Radio className="h-8 w-8 text-cyan-400 animate-pulse" />
                      <p className="text-xs">Select any beacon blip on the radar grid to inspect its field dare & rewards.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                  <span className="text-slate-400 text-[11px] font-bold uppercase">Filter:</span>
                  {['all', 'cyber', 'tech', 'physical', 'creative', 'social', 'absurd'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-bold transition-all cursor-pointer ${
                        filterCategory === cat
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="text-xs font-mono text-slate-400">
                  Total Active Sectors: <strong className="text-white">{filteredZones.length}</strong>
                </div>
              </div>

              {/* Grid List of Available Drop Zones */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredZones.map((zone) => {
                  const isClaimed = zone.claimedUserIds?.includes(currentUser.id);
                  return (
                    <div
                      key={zone.id}
                      onClick={() => {
                        playSound('pop');
                        setSelectedZone(zone);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedZone?.id === zone.id
                          ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : 'border-white/10 bg-slate-900/60 hover:border-cyan-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{zone.arObjectIcon || '💠'}</span>
                          <div>
                            <h4 className="font-bold text-xs text-white line-clamp-1">{zone.name}</h4>
                            <span className="text-[10px] font-mono text-slate-400">{zone.city} • {zone.code}</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400">+{zone.bountyCred} CR</span>
                      </div>

                      <p className="text-xs text-slate-300 mt-2 line-clamp-2">{zone.activeDareTitle}</p>

                      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-purple-300">+{zone.bountyXp} XP</span>
                        {isClaimed ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Claimed
                          </span>
                        ) : (
                          <span className="text-cyan-400 font-bold group-hover:underline">Scan AR Beacon →</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 2: AR BEACON VIEWFINDER & SCANNER */}
          {activeTab === 'ar_scanner' && (
            <div className="space-y-4">
              
              {/* AR HUD Stage Container */}
              <div 
                onMouseMove={handleMouseMove}
                className="relative h-[420px] sm:h-[480px] w-full rounded-2xl overflow-hidden border border-cyan-500/40 bg-black shadow-2xl flex items-center justify-center select-none"
              >
                
                {/* Live Camera Stream or Synthetic Grid Background */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover ${arCameraActive ? 'opacity-90' : 'hidden'}`}
                />

                {!arCameraActive && (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0e1e38,#050a14)]">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff10_1px,transparent_1px),linear-gradient(to_bottom,#00ffff10_1px,transparent_1px)] bg-[size:32px_32px]" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-25">
                      <div className="h-96 w-96 rounded-full border border-cyan-400 animate-spin-slow" />
                    </div>
                  </div>
                )}

                {/* Cyber Optical Overlay Elements */}
                <div className="absolute top-4 left-4 flex flex-col gap-1 text-[11px] font-mono text-cyan-300 bg-black/60 backdrop-blur-sm p-2.5 rounded-xl border border-cyan-500/30 pointer-events-none z-20">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold">AR OPTICAL SENSOR 9000</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Target Node: {selectedZone?.code || 'DROP-LOC-01'}</div>
                  <div className="text-[10px] text-slate-400">Signal: 5.8 GHz Neural Link</div>
                </div>

                <div className="absolute top-4 right-4 flex items-center gap-2 text-[11px] font-mono text-amber-300 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-amber-500/30 pointer-events-none z-20">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span>Bounty: +{selectedZone?.bountyCred || 300} Cred</span>
                </div>

                {/* Central Reticle and Spatial AR Holographic Beacon */}
                <div 
                  style={{
                    transform: `translate(${reticleOffset.x}px, ${reticleOffset.y}px)`,
                    transition: 'transform 0.1s ease-out',
                  }}
                  className="relative flex flex-col items-center justify-center z-20 cursor-pointer"
                  onClick={handleStartDecryption}
                >
                  {/* Holographic Glowing 3D AR Beacon Object */}
                  <div className={`relative flex items-center justify-center h-24 w-24 rounded-3xl border-2 transition-all ${
                    isLockedOn
                      ? 'border-emerald-400 bg-emerald-950/60 shadow-[0_0_40px_rgba(52,211,153,0.8)] scale-110'
                      : 'border-cyan-400/80 bg-cyan-950/60 shadow-[0_0_35px_rgba(6,182,212,0.6)] animate-pulse'
                  }`}>
                    <span className="text-4xl animate-bounce">{selectedZone?.arObjectIcon || '💠'}</span>

                    {/* Outer Targeting Brackets */}
                    <div className="absolute -top-3 -left-3 h-5 w-5 border-t-2 border-l-2 border-cyan-300" />
                    <div className="absolute -top-3 -right-3 h-5 w-5 border-t-2 border-r-2 border-cyan-300" />
                    <div className="absolute -bottom-3 -left-3 h-5 w-5 border-b-2 border-l-2 border-cyan-300" />
                    <div className="absolute -bottom-3 -right-3 h-5 w-5 border-b-2 border-r-2 border-cyan-300" />
                  </div>

                  {/* Target Label */}
                  <div className="mt-3 px-3 py-1 rounded-full bg-black/80 border border-cyan-400/40 text-[10px] font-mono font-bold text-cyan-200">
                    {decrypting ? `DECRYPTING CIPHER... ${decryptionProgress}%` : isLockedOn ? 'BEACON SECURED' : 'TAP TO DECRYPT AR BEACON'}
                  </div>

                  {/* Decryption Progress Radial Bar */}
                  {decrypting && (
                    <div className="w-48 h-2 bg-slate-900 rounded-full mt-2 border border-cyan-500/40 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-200"
                        style={{ width: `${decryptionProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Bottom Viewfinder Controls */}
                <div className="absolute bottom-4 inset-x-4 flex items-center justify-between gap-3 text-xs font-mono bg-black/75 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 z-20">
                  <div className="text-slate-300">
                    <div>{selectedZone?.name || 'Tactical Node'}</div>
                    <div className="text-[10px] text-slate-400">{selectedZone?.activeDareTitle}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleStartDecryption}
                      disabled={decrypting || decryptionProgress >= 100}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Crosshair className="h-3.5 w-3.5" />
                      <span>{decryptionProgress >= 100 ? 'Secured' : decrypting ? 'Syncing...' : 'Lock & Decrypt'}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Successful Decryption & Loot Drop Card */}
              {scanResult && (
                <div className="p-5 rounded-2xl border border-emerald-500/50 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-cyan-950/40 space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-base">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span>AR BEACON CIPHER DECRYPTED!</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                      SUCCESS
                    </span>
                  </div>

                  <p className="text-xs text-slate-200">
                    You validated the physical coordinate beacon at <strong>{selectedZone?.name}</strong>. Rewards deposited directly to your neural wallet.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-center pt-2">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                      <div className="text-[10px] text-slate-400">Cred Awarded</div>
                      <div className="text-lg font-black text-amber-400">+{scanResult.awardedCred} CR</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                      <div className="text-[10px] text-slate-400">Experience Points</div>
                      <div className="text-lg font-black text-purple-400">+{scanResult.awardedXp} XP</div>
                    </div>
                    {scanResult.lootItem && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 col-span-2 sm:col-span-1">
                        <div className="text-[10px] text-amber-400 font-bold">Tactical Item Drop!</div>
                        <div className="text-xs font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                          <span>{scanResult.lootItem.icon}</span>
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
            <form onSubmit={handleDeployZone} className="space-y-5">
              
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <div className="font-bold text-amber-300 text-sm">Deploy a Geofenced Cyber Beacon</div>
                  Fund a localized GPS bounty for nearby agents to discover. Your beacon will broadcast at your active GPS coordinates with a custom AR field dare.
                </div>
              </div>

              {deployFeedback && (
                <div className="p-3 rounded-xl border border-red-500/40 bg-red-950/30 text-xs text-red-300 font-mono">
                  {deployFeedback}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300">Beacon / Location Name *</label>
                  <input
                    type="text"
                    value={deployName}
                    onChange={(e) => setDeployName(e.target.value)}
                    placeholder="e.g. Cyber Rooftop Lounge Node"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-mono font-bold text-slate-300">Dare Instructions & AR Verification Criteria *</label>
                  <textarea
                    rows={3}
                    value={deployDesc}
                    onChange={(e) => setDeployDesc(e.target.value)}
                    placeholder="Describe what the challenger must physically or digitally do when within geofence range..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    required
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
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>100 CR (Min)</span>
                    <span className="text-amber-400 font-bold">{deployBounty} Cred</span>
                    <span>1000 CR (Max)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300">Geofence Radius ({deployRadius}m)</label>
                  <input
                    type="range"
                    min={100}
                    max={1000}
                    step={50}
                    value={deployRadius}
                    onChange={(e) => setDeployRadius(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>100m (Strict)</span>
                    <span className="text-cyan-400 font-bold">{deployRadius} Meters</span>
                    <span>1000m (Wide)</span>
                  </div>
                </div>

              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
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
