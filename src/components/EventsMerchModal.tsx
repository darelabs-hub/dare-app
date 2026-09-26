import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  ShoppingBag, 
  MapPin, 
  Tag, 
  ThumbsUp, 
  ChevronDown, 
  ChevronUp, 
  Flame, 
  Terminal, 
  Award, 
  Zap,
  Sparkles,
  Info,
  Clock,
  Bell,
  CheckCircle2
} from 'lucide-react';
import { EventItem, MerchItem } from '../types';
import { playSound } from '../utils/soundEffects';

import challengeTeeImg from '../assets/images/dareday_challenge_tee_1790085129494.jpg';
import waterBottleImg from '../assets/images/dareday_water_bottle_1790085371766.jpg';
import wristWrapsImg from '../assets/images/dareday_wrist_wraps_1790085406444.jpg';
import stickerPackImg from '../assets/images/dareday_sticker_pack_1790085390749.jpg';
import challengeBadgeImg from '../assets/images/dareday_challenge_badge_1790085437719.jpg';
import gauntletBundleImg from '../assets/images/dareday_gauntlet_bundle_1790085421846.jpg';

interface EventsMerchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProposedDare {
  id: string;
  title: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'NETRUNNER';
  author: string;
  description: string;
  image: string;
  credReward: number;
  detailedRequirements: string[];
  initialVotes: number;
}

interface EventItemWithDares extends EventItem {
  dares: ProposedDare[];
}

const EVENTS_WITH_DARES: EventItemWithDares[] = [];

interface MerchItemCustom extends MerchItem {
  subtitle?: string;
  badge?: string;
}

const MOCK_MERCH: MerchItemCustom[] = [
  { id: 'm1', title: '300 / 100 Challenge Tee', price: 'TBA', image: challengeTeeImg, subtitle: 'Dawn Strength Gauntlet • 300 Squats & 100 Pushups • Partition & Conquer', badge: 'GAUNTLET SERIES' },
  { id: 'm2', title: 'DARE Water Bottle', price: 'TBA', image: waterBottleImg, subtitle: 'Vacuum-Sealed Steel • Magenta Core Finish • Hydration Protocol Ready', badge: 'HYDRATION' },
  { id: 'm3', title: 'Streak x2 Wrist Wraps', price: 'TBA', image: wristWrapsImg, subtitle: 'Heavy-Duty Support • Streak x2 Branding • Secure Thumb Loop', badge: 'PRO GEAR' },
  { id: 'm4', title: 'DARE Sticker Pack', price: 'TBA', image: stickerPackImg, subtitle: 'Durable Vinyl Stickers • Neon Reactive Finish • Perfect for Gear & Bottles', badge: 'COLLECTIBLE' },
  { id: 'm5', title: 'Challenge Complete Badge', price: 'TBA', image: challengeBadgeImg, subtitle: 'Embroidered Achievement Patch • 300 / 100 Gauntlet Mastery', badge: 'ACHIEVEMENT' },
  { id: 'm6', title: 'Gauntlet Pro Series Bundle', price: 'TBA', image: gauntletBundleImg, subtitle: 'Complete Series Bundle • Includes Tee, Bottle & Wrist Wraps in Signature Tones', badge: 'BUNDLE' },
];

export const EventsMerchModal: React.FC<EventsMerchModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'events' | 'merch'>('events');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [expandedDareId, setExpandedDareId] = useState<string | null>(null);
  
  // Dynamic user voting state
  const [votesState, setVotesState] = useState<Record<string, number>>({});
  const [votedDares, setVotedDares] = useState<Record<string, boolean>>({});
  const [notifiedMerchIds, setNotifiedMerchIds] = useState<Record<string, boolean>>({});
  const [notifiedAll, setNotifiedAll] = useState(false);

  const handleNotifyMerch = (merchId: string) => {
    const willBeNotified = !notifiedMerchIds[merchId];
    if (willBeNotified) {
      playSound('accept');
    } else {
      playSound('click');
    }
    setNotifiedMerchIds(prev => ({
      ...prev,
      [merchId]: willBeNotified
    }));
  };

  const handleNotifyAll = () => {
    playSound('complete');
    setNotifiedAll(true);
    const updated: Record<string, boolean> = {};
    MOCK_MERCH.forEach(m => {
      updated[m.id] = true;
    });
    setNotifiedMerchIds(updated);
  };

  const handleVote = (dareId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (votedDares[dareId]) {
      // Toggle off
      setVotesState(prev => ({ ...prev, [dareId]: prev[dareId] - 1 }));
      setVotedDares(prev => ({ ...prev, [dareId]: false }));
      playSound('click');
    } else {
      // Vote up
      setVotesState(prev => ({ ...prev, [dareId]: prev[dareId] + 1 }));
      setVotedDares(prev => ({ ...prev, [dareId]: true }));
      playSound('oracle');
    }
  };

  const handleToggleExpand = (dareId: string) => {
    playSound('click');
    setExpandedDareId(prev => prev === dareId ? null : dareId);
  };

  if (!isOpen) return null;

  const currentEvent = EVENTS_WITH_DARES.find(e => e.id === selectedEventId) || EVENTS_WITH_DARES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div id="events-merch-modal-container" className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-[#0a0f1d] text-slate-100 shadow-2xl flex flex-col max-h-[90vh] my-auto overflow-hidden">
        
        {/* Header Block */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-[#0c1222] shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 tracking-wide font-mono">
            {activeTab === 'events' ? (
              <>
                <Calendar className="h-5 w-5 text-indigo-400 animate-pulse" />
                <span>DAREDAY // CONVERGENCE EVENTS</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-5 w-5 text-pink-400" />
                <span>DAREDAY // GEAR ACCESS TERMINAL</span>
              </>
            )}
          </h2>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-[#080c16] shrink-0 text-xs sm:text-sm">
          <button 
            id="tab-events-grid-btn"
            onClick={() => {
              setActiveTab('events');
              playSound('click');
            }} 
            className={`flex-1 py-3 text-center font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'events' 
                ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🗓️ Events Grid
          </button>
          <button 
            id="tab-gear-merch-btn"
            onClick={() => {
              setActiveTab('merch');
              playSound('click');
            }} 
            className={`flex-1 py-3 text-center font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'merch' 
                ? 'text-pink-400 border-b-2 border-pink-400 bg-pink-500/5' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🛍️ Gear Store</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-normal normal-case">
              Coming Soon
            </span>
          </button>
        </div>

        {/* Content Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 bg-[#090d18]">
          {activeTab === 'events' ? (
            EVENTS_WITH_DARES.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <Calendar className="h-10 w-10 text-slate-600 animate-pulse" />
                <p className="font-mono text-sm font-bold text-slate-300">
                  No official events currently scheduled. Check back soon.
                </p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Official DARE convergence dates and physical community summits will appear here once announced.
                </p>
              </div>
            ) : (
            <div className="space-y-6">
              
              {/* Event Selector Row */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between border-b border-slate-800/60 pb-4">
                <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Select active convergence:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {EVENTS_WITH_DARES.map(event => (
                    <button
                      key={event.id}
                      onClick={() => {
                        setSelectedEventId(event.id);
                        setExpandedDareId(null);
                        playSound('click');
                      }}
                      className={`px-3 py-1.5 rounded-lg border font-mono font-semibold text-xs transition-all cursor-pointer ${
                        selectedEventId === event.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {event.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Overview Detail Card */}
              <div className="relative p-4 sm:p-5 rounded-2xl border border-slate-800 bg-[#0d1324] overflow-hidden shadow-lg shrink-0">
                <div className="absolute top-0 right-0 p-3 text-[9px] font-mono font-bold tracking-widest text-slate-500">EVENT OVERVIEW</div>
                <h3 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-400" />
                  <span>{currentEvent.title}</span>
                </h3>
                <div className="flex gap-4 text-[10px] sm:text-xs text-slate-400 mt-1.5 font-mono">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-500" />{currentEvent.date}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-500" />{currentEvent.location}</span>
                </div>
                <p className="text-xs text-slate-300 mt-3.5 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-900/60 font-sans">
                  {currentEvent.description}
                </p>
              </div>

              {/* Interactive Proposed Dares Header */}
              <div className="border-t border-slate-800/80 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    <Terminal className="h-4 w-4 text-cyan-400 animate-pulse" />
                    <span>Proposed Convergence Dares</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Community Votes Trigger Launch</span>
                </div>

                {/* Proposed Dares Stack */}
                <div className="space-y-3.5">
                  {currentEvent.dares.map(dare => {
                    const isExpanded = expandedDareId === dare.id;
                    const isVoted = votedDares[dare.id];
                    const activeVotes = votesState[dare.id];

                    return (
                      <div 
                        key={dare.id}
                        onClick={() => handleToggleExpand(dare.id)}
                        className={`rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer ${
                          isExpanded 
                            ? 'border-indigo-500 bg-[#0d1426] shadow-[0_4px_25px_rgba(99,102,241,0.08)]' 
                            : 'border-slate-800 bg-slate-900/35 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        {/* Upper Card Grid Summary */}
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5 min-w-0 flex-1">
                            {/* Image Thumbnail */}
                            <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shrink-0">
                              <img 
                                src={dare.image} 
                                alt={dare.title} 
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono ${
                                  dare.difficulty === 'NETRUNNER' 
                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                                    : dare.difficulty === 'HARD'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {dare.difficulty}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">{dare.category}</span>
                              </div>
                              <h4 className="font-bold text-white text-xs sm:text-sm mt-1 flex items-center gap-1.5">
                                <span>{dare.title}</span>
                                <span className="text-[10px] font-mono font-normal text-slate-500">by {dare.author}</span>
                              </h4>
                              <p className="text-xs text-slate-400 mt-1">{dare.description}</p>
                              
                              {/* Launch Progress Indicator */}
                              <div className="mt-2.5 max-w-sm">
                                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mb-1">
                                  <span>LAUNCH STATUS</span>
                                  <span className={Math.min(100, Math.round((activeVotes / 300) * 100)) >= 100 ? 'text-indigo-400 font-bold' : 'text-slate-400'}>
                                    {activeVotes} / 300 VOTES ({Math.min(100, Math.round((activeVotes / 300) * 100))}%)
                                  </span>
                                </div>
                                <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      Math.min(100, Math.round((activeVotes / 300) * 100)) >= 100 
                                        ? 'bg-gradient-to-r from-indigo-500 to-cyan-400' 
                                        : 'bg-indigo-500/80'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.round((activeVotes / 300) * 100))}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions Row */}
                          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2.5 md:pt-0 border-t border-slate-800/40 md:border-0">
                            {/* Reward Pill */}
                            <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded-lg border border-emerald-500/20">
                              <Zap className="h-3 w-3" />
                              <span>+{dare.credReward} CRED</span>
                            </div>

                            {/* Vote To Go Live Interactive Button */}
                            <button
                              type="button"
                              onClick={(e) => handleVote(dare.id, e)}
                              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-mono font-bold transition-all shadow-sm cursor-pointer ${
                                isVoted
                                  ? 'border-indigo-500 bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)] scale-105'
                                  : 'border-slate-800 bg-[#0d1222] text-indigo-300 hover:border-indigo-500/60 hover:text-indigo-200'
                              }`}
                            >
                              <ThumbsUp className={`h-3.5 w-3.5 ${isVoted ? 'fill-current animate-bounce' : ''}`} />
                              <span>{activeVotes} VOTES</span>
                            </button>

                            {/* Accordion trigger indicator */}
                            <div className="text-slate-500 hidden md:block">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Rich Detail Drawer */}
                        {isExpanded && (
                          <div className="border-t border-slate-800/80 bg-slate-950/40 p-4 sm:p-5 text-xs animate-in slide-in-from-top-1 duration-150">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {/* Large visual preview card */}
                              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 h-40 sm:h-48 shadow-inner">
                                <img 
                                  src={dare.image} 
                                  alt={dare.title} 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3.5">
                                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">TELEMETRY PREVIEW</span>
                                </div>
                              </div>

                              {/* Detailed rules & instructions */}
                              <div className="flex flex-col justify-between space-y-3.5">
                                <div>
                                  <h5 className="font-mono font-bold text-slate-300 flex items-center gap-1 uppercase tracking-wide text-[10px] mb-2">
                                    <Info className="h-3.5 w-3.5 text-cyan-400" />
                                    <span>CONVERGENCE VERIFICATION RULES</span>
                                  </h5>
                                  <ul className="space-y-1.5">
                                    {dare.detailedRequirements.map((req, index) => (
                                      <li key={index} className="flex gap-1.5 items-start text-slate-400 text-xs leading-relaxed">
                                        <span className="text-indigo-400 font-mono font-bold mt-0.5">•</span>
                                        <span>{req}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                                  <span className="text-[10px] font-mono text-slate-500">Voted already?</span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleVote(dare.id, e)}
                                    className={`px-3 py-1 rounded font-mono font-bold text-[10px] uppercase transition-colors cursor-pointer ${
                                      isVoted 
                                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                                        : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20'
                                    }`}
                                  >
                                    {isVoted ? 'Retract Vote' : 'Register Vote'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            )
          ) : (
            <div className="space-y-5">
              {/* Coming Soon Announcement Banner */}
              <div 
                id="merch-coming-soon-banner"
                className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-900/60 p-4 sm:p-5 shadow-lg backdrop-blur"
              >
                <div className="absolute top-0 right-0 -mt-2 -mr-2 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/20 text-amber-300">
                      <Clock className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                          PROTOTYPE FABRICATION PHASE
                        </span>
                        <span className="inline-flex items-center rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-mono font-bold text-amber-300 border border-amber-400/30">
                          COMING SOON
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                        Official DARE Merch & Physical Gear Collection
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                        These physical apparel and tech-gear products are currently in pre-production tooling and sample certification. These items are not ready for purchase yet, but will unlock for direct ordering and Cred redemption once batch certification completes.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 sm:self-center">
                    <button
                      id="notify-all-merch-btn"
                      onClick={handleNotifyAll}
                      disabled={notifiedAll}
                      className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-mono font-bold transition-all shadow-md cursor-pointer ${
                        notifiedAll
                          ? 'border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 cursor-default'
                          : 'border border-amber-500/50 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 active:scale-95'
                      }`}
                    >
                      {notifiedAll ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span>Drop Alerts Subscribed ✓</span>
                        </>
                      ) : (
                        <>
                          <Bell className="h-4 w-4" />
                          <span>Notify Me on Batch Drop</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Merch Grid with Coming Soon Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {MOCK_MERCH.map(item => {
                  const isNotified = notifiedMerchIds[item.id];
                  return (
                    <div 
                      key={item.id} 
                      id={`merch-card-${item.id}`}
                      className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between group hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.12)] transition-all"
                    >
                      <div>
                        <div className="relative mb-3 h-36 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100" 
                          />
                          {/* Coming Soon prominent badge */}
                          <div className="absolute top-2 left-2 rounded-md bg-amber-950/90 backdrop-blur px-2 py-0.5 text-[9px] font-mono font-bold text-amber-300 border border-amber-500/50 shadow flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            <span>COMING SOON</span>
                          </div>
                          <div className="absolute top-2 right-2 rounded bg-slate-900/90 px-1.5 py-0.5 text-[9px] font-mono text-slate-300 border border-slate-700">
                            NOT READY YET
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-mono font-bold text-indigo-400 tracking-wide uppercase">
                            {item.badge || 'DARE//DAY'}
                          </span>
                        </div>
                        <h3 className="font-bold text-white text-sm">{item.title}</h3>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 h-8">{item.subtitle}</p>
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-2.5 border-t border-slate-800/80">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Price</span>
                          <span className="text-xs font-mono font-bold text-amber-400/90 flex items-center gap-1">
                            <Tag className="h-3 w-3 text-amber-400/70" />
                            <span>TBA</span>
                          </span>
                        </div>

                        <button 
                          id={`notify-merch-btn-${item.id}`}
                          type="button"
                          onClick={() => handleNotifyMerch(item.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            isNotified
                              ? 'border border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                              : 'border border-slate-700 bg-slate-800 text-slate-200 hover:border-amber-500/50 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {isNotified ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Notified ✓</span>
                            </>
                          ) : (
                            <>
                              <Bell className="h-3.5 w-3.5 text-amber-400" />
                              <span>Notify Me</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
