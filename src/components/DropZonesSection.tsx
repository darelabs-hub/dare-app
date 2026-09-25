import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Compass, 
  Camera, 
  Navigation, 
  MapPin, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Zap,
  Globe,
  Plus
} from 'lucide-react';
import { DropZone, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

interface DropZonesSectionProps {
  currentUser: UserProfile;
  onOpenDropZonesModal: (tab?: 'radar' | 'ar_scanner' | 'deploy', targetZone?: DropZone) => void;
}

export const DropZonesSection: React.FC<DropZonesSectionProps> = ({
  currentUser,
  onOpenDropZonesModal,
}) => {
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHub, setSelectedHub] = useState('London');

  const HUBS = [
    { name: 'London', lat: 51.5074, lng: -0.1278, flag: '🇬🇧' },
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194, flag: '🇺🇸' },
    { name: 'Berlin', lat: 52.5200, lng: 13.4050, flag: '🇩🇪' },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503, flag: '🇯🇵' },
    { name: 'Paris', lat: 48.8566, lng: 2.3522, flag: '🇫🇷' },
    { name: 'New York', lat: 40.7128, lng: -74.0060, flag: '🇺🇸' },
  ];

  const fetchHubZones = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/drop-zones?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data: DropZone[] = await res.json();
        setDropZones(data.slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to load drop zones section', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hub = HUBS.find((h) => h.name === selectedHub) || HUBS[0];
    fetchHubZones(hub.lat, hub.lng);
  }, [selectedHub]);

  return (
    <section className="mb-8 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-[#060c18] via-slate-950 to-[#070e1c] p-5 sm:p-7 shadow-[0_0_40px_rgba(6,182,212,0.12)] relative overflow-hidden">
      
      {/* Subtle Spatial Mesh Glow */}
      <div className="absolute top-0 right-0 h-64 w-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-64 w-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10 relative z-10">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white font-tech uppercase tracking-wide">
                Geofenced Drop Zones & AR Beacons
              </h2>
              <span className="text-[11px] font-mono text-cyan-400 font-semibold tracking-wider">
                Physical World Grid
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Physical GPS bounties and 3D AR holograms broadcasting in real-world urban hubs.
            </p>
          </div>
        </div>

        {/* Global Hub Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 font-mono text-xs scrollbar-none">
          <span className="text-slate-400 text-[11px] font-bold uppercase shrink-0 mr-1 flex items-center gap-1">
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            Hub:
          </span>
          {HUBS.map((hub) => (
            <button
              key={hub.name}
              onClick={() => {
                playSound('pop');
                setSelectedHub(hub.name);
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedHub === hub.name
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.35)]'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <span>{hub.flag}</span>
              <span>{hub.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Showcase */}
      <div className="pt-6 relative z-10 space-y-5">
        
        {/* Active Beacons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dropZones.map((zone) => {
            const isClaimed = zone.claimedUserIds?.includes(currentUser.id);

            return (
              <div
                key={zone.id}
                className="group p-5 rounded-2xl border border-white/10 bg-slate-900/70 hover:border-cyan-500/50 hover:bg-slate-900/90 transition-all flex flex-col justify-between shadow-lg"
              >
                <div>
                  {/* Top Unboxed Metadata */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className={`font-bold uppercase ${
                        zone.lootRarity === 'legendary'
                          ? 'text-amber-400'
                          : zone.lootRarity === 'epic'
                          ? 'text-purple-400'
                          : 'text-cyan-400'
                      }`}>
                        {zone.lootRarity}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{zone.code}</span>
                    </div>

                    <span className="font-bold text-amber-400">
                      +{zone.bountyCred} CR
                    </span>
                  </div>

                  {/* Title & Icon */}
                  <div className="flex items-start gap-3 mt-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {zone.arObjectIcon || '💠'}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-white line-clamp-1">{zone.name}</h4>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-cyan-400" />
                        <span>{zone.city}</span>
                        <span aria-hidden="true">·</span>
                        <span>{zone.radiusMeters}m Geofence</span>
                      </div>
                    </div>
                  </div>

                  {/* Dare Title */}
                  <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                    {zone.activeDareTitle}
                  </p>
                </div>

                {/* Card Action */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                  <span className="text-purple-300">+{zone.bountyXp} XP</span>

                  {isClaimed ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Claimed
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        playSound('laser');
                        onOpenDropZonesModal('ar_scanner', zone);
                      }}
                      className="flex items-center gap-1 text-cyan-400 font-bold hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Scan AR Beacon →</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Launch Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/80 border border-white/5 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300 text-center sm:text-left">
            <Compass className="h-4 w-4 text-cyan-400 animate-spin-slow shrink-0" />
            <span>Discover localized GPS bounties or deploy a geofenced beacon for nearby peers to claim.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                playSound('laser');
                onOpenDropZonesModal('deploy');
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 font-bold transition-all cursor-pointer active:scale-95"
            >
              <Plus className="h-3.5 w-3.5 text-amber-400" />
              <span>Deploy Beacon</span>
            </button>

            <button
              onClick={() => {
                playSound('laser');
                onOpenDropZonesModal('radar');
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer active:scale-95"
            >
              <Radio className="h-4 w-4" />
              <span>Launch 360° AR Radar</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

    </section>
  );
};
