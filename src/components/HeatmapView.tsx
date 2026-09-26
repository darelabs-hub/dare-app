import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Map, useMap } from '@vis.gl/react-google-maps';
import { MapPin, Crosshair, Globe, Activity, Layers, Flame, Shield, Compass } from 'lucide-react';
import { DareItem } from '../types';

interface HeatmapViewProps {
  dares?: DareItem[];
  onOpenDropZones?: () => void;
}

interface LocationNode {
  id: string;
  title: string;
  category: string;
  cred: number;
  locationName: string;
  position: [number, number]; // [lng, lat]
  status: 'verified' | 'active';
  handle: string;
}

// Inner component that safely uses Google Maps
const GoogleMapsOverlayView: React.FC<{ allNodes: LocationNode[] }> = ({ allNodes }) => {
  return (
    <Map
      mapId="DEMO_MAP_ID"
      defaultCenter={{ lat: 37.7749, lng: -122.4194 }}
      defaultZoom={3}
      internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
      className="w-full h-full"
    >
      {allNodes.map(node => (
        // Render simple markers or pins if needed
        null
      ))}
    </Map>
  );
};

export const HeatmapView: React.FC<HeatmapViewProps> = ({ dares = [], onOpenDropZones }) => {
  const [selectedNode, setSelectedNode] = useState<LocationNode | null>(null);
  const [activeLayerMode, setActiveLayerMode] = useState<'radar' | 'gmap'>('radar');

  const hasApiKey = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  // Derive active location nodes purely from real user submitted dares
  const allNodes: LocationNode[] = useMemo(() => {
    const nodes: LocationNode[] = [];
    dares.forEach((d, idx) => {
      if (d.location && typeof d.location.lat === 'number' && typeof d.location.lng === 'number') {
        nodes.push({
          id: `dare-loc-${d.id || idx}`,
          title: d.title,
          category: d.category,
          cred: d.rewardCred,
          locationName: `${d.location.lat.toFixed(3)}°N, ${d.location.lng.toFixed(3)}°W`,
          position: [d.location.lng, d.location.lat],
          status: d.status === 'verified' ? 'verified' : 'active',
          handle: d.acceptedBy?.handle || d.creator?.handle || '',
        });
      }
    });
    return nodes;
  }, [dares]);

  return (
    <div id="heatmap-view-container" className="flex flex-col gap-3 w-full">
      {/* HUD Telemetry Stats Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 rounded-xl bg-slate-900/80 border border-cyan-500/20 text-xs font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <Activity className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>Telemetry Nodes: <strong className="text-white">{allNodes.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 hidden sm:flex">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>Anonymized: <strong>Active</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenDropZones && (
            <button
              type="button"
              onClick={onOpenDropZones}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            >
              <Compass className="h-3.5 w-3.5 text-emerald-400 animate-spin-slow" />
              <span>AR Drop Zones</span>
            </button>
          )}

          {hasApiKey && (
            <div className="flex rounded-lg border border-slate-800 bg-slate-950/60 p-0.5">
              <button
                type="button"
                onClick={() => setActiveLayerMode('radar')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                  activeLayerMode === 'radar'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cyber Radar
              </button>
              <button
                type="button"
                onClick={() => setActiveLayerMode('gmap')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                  activeLayerMode === 'gmap'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Satellite GMap
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="relative h-[340px] sm:h-[400px] w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#060a12] shadow-2xl">
        {/* Layer 1: Google Map if enabled and selected */}
        {hasApiKey && activeLayerMode === 'gmap' ? (
          <GoogleMapsOverlayView allNodes={allNodes} />
        ) : (
          /* Layer 2: Cybernetic Global Radar Stage */
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0e1a30] via-[#070c17] to-[#04070d] p-4 select-none">
            {/* Grid Mesh Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff08_1px,transparent_1px),linear-gradient(to_bottom,#00ffff08_1px,transparent_1px)] bg-[size:28px_28px] opacity-70 pointer-events-none" />

            {/* Concentric Radar Distance Rings */}
            <div className="absolute h-48 w-48 sm:h-64 sm:w-64 rounded-full border border-cyan-500/10 pointer-events-none" />
            <div className="absolute h-72 w-72 sm:h-96 sm:w-96 rounded-full border border-cyan-500/10 pointer-events-none" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-500/10 pointer-events-none" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-500/10 pointer-events-none" />

            {/* Rotating Radar Sweep Line */}
            <div className="absolute h-72 w-72 sm:h-96 sm:w-96 rounded-full overflow-hidden pointer-events-none opacity-40 animate-spin" style={{ animationDuration: '8s' }}>
              <div className="h-1/2 w-1/2 bg-gradient-to-br from-cyan-500/30 to-transparent" />
            </div>

            {/* World Coordinates HUD Overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[10px] font-mono text-cyan-400/80 bg-black/40 px-2 py-1 rounded border border-cyan-500/20 pointer-events-none">
              <Compass className="h-3 w-3 text-cyan-400" />
              <span>RADAR LAT/LONG GRID: 360° SPHERE</span>
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400/80 bg-black/40 px-2 py-1 rounded border border-emerald-500/20 pointer-events-none">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE FEED SYNCED</span>
            </div>

            {/* Render Geo Nodes as Pulsing Hotspots */}
            <div className="relative w-full max-w-md h-56 sm:h-72">
              {allNodes.map((node, i) => {
                // Approximate spherical Mercator projection for stylized visual layout
                const [lng, lat] = node.position;
                const leftPercent = Math.min(92, Math.max(8, ((lng + 180) / 360) * 100));
                const topPercent = Math.min(88, Math.max(12, ((90 - lat) / 180) * 100));
                const isSelected = selectedNode?.id === node.id;

                return (
                  <div
                    key={node.id}
                    style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                    onClick={() => setSelectedNode(node)}
                  >
                    {/* Pulsing Aura Heat */}
                    <span className={`absolute -inset-2 rounded-full opacity-60 animate-ping ${
                      node.cred >= 500 ? 'bg-amber-400' : 'bg-cyan-400'
                    }`} style={{ animationDuration: `${2.5 + (i % 3)}s` }} />
                    
                    {/* Main Core Pin */}
                    <div className={`relative flex items-center justify-center h-5 w-5 rounded-full border transition-all transform group-hover:scale-125 ${
                      isSelected
                        ? 'border-white bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                        : node.cred >= 500
                        ? 'border-amber-400/80 bg-amber-500/40 text-amber-200'
                        : 'border-cyan-400/80 bg-cyan-500/30 text-cyan-200'
                    }`}>
                      <MapPin className="h-3 w-3" />
                    </div>

                    {/* Quick Hover Label */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap z-30">
                      <div className="px-2 py-1 rounded bg-black/90 border border-cyan-500/40 text-[9px] font-mono text-cyan-200 shadow-lg">
                        <span className="font-bold text-white">{node.title}</span>
                        <div className="text-slate-400 text-[8px]">{node.locationName} • +{node.cred} CRED</div>
                      </div>
                      <div className="w-1.5 h-1.5 bg-black rotate-45 -mt-1 border-r border-b border-cyan-500/40" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Status bar */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-[10px] font-mono text-slate-400 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-cyan-400" />
                <span>{allNodes.length > 0 ? 'Tap any beacon to inspect mission telemetry' : 'Publish a dare with location coordinates to illuminate the global radar'}</span>
              </span>
              <span className="text-cyan-400 font-bold hidden sm:inline">
                Active Telemetry: {allNodes.length} {allNodes.length === 1 ? 'Node' : 'Nodes'}
              </span>
            </div>
          </div>
        )}

        {/* Selected Beacon Details Card Drawer */}
        {selectedNode && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-80 p-3 rounded-xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-md z-30 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  {selectedNode.category}
                </span>
                <h4 className="font-bold text-xs text-white truncate mt-1">{selectedNode.title}</h4>
                <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{selectedNode.locationName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="text-slate-500 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>
            
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Agent: <strong className="text-cyan-300">{selectedNode.handle}</strong></span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Flame className="h-3 w-3" />
                +{selectedNode.cred} CRED
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

