import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Terminal, 
  Compass, 
  Flame, 
  Trophy, 
  Swords, 
  MessageSquare, 
  Map, 
  Camera, 
  Coins, 
  ShoppingBag,
  ExternalLink,
  Layers
} from 'lucide-react';
import { UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

export interface HelpBubbleSystemProps {
  currentUser: UserProfile;
  onOpenCreateModal: () => void;
  onTriggerOracle: () => void;
  onOpenLeaderboard: () => void;
  onOpenCredLog: () => void;
  onOpenProofGallery: () => void;
  onOpenEventsMerch: () => void;
  onOpenTournaments?: () => void;
  onOpenProfile: (user: UserProfile, tab?: 'heatmap' | 'location-map' | 'completed' | 'created' | 'settings' | 'squad' | 'rivalry') => void;
  onSelectTargetFilter: (target: 'all' | 'public' | 'direct') => void;
  onSelectCategory: (category: string) => void;
  onResetFilters: () => void;
  onCloseAllModals: () => void;
}

interface TourStep {
  id: string;
  targetId: string;
  title: string;
  badge: string;
  category: string;
  icon: React.ReactNode;
  description: string;
  hint: string;
  position: 'bottom' | 'top' | 'left' | 'right';
  onEnter: () => void;
}

export const HelpBubbleSystem: React.FC<HelpBubbleSystemProps> = ({
  currentUser,
  onOpenCreateModal,
  onTriggerOracle,
  onOpenLeaderboard,
  onOpenCredLog,
  onOpenProofGallery,
  onOpenEventsMerch,
  onOpenTournaments,
  onOpenProfile,
  onSelectTargetFilter,
  onSelectCategory,
  onResetFilters,
  onCloseAllModals,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bubbleCoords, setBubbleCoords] = useState<{ top: number; left: number } | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any previous persistent hide so the user can see their tutorial button
  useEffect(() => {
    try {
      localStorage.removeItem('dareday_hide_tour_button');
    } catch {}
  }, []);

  // Listen for global tour trigger event from Navbar or Profile menu
  useEffect(() => {
    const handleTourTrigger = () => {
      setIsDismissed(false);
      setIsActive(true);
      setCurrentStep(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('dareday:open_tour', handleTourTrigger);
    return () => window.removeEventListener('dareday:open_tour', handleTourTrigger);
  }, []);

  // Maintain latest props in a ref to avoid recreating steps and triggering cascade renders
  const callbacksRef = useRef({
    currentUser,
    onOpenCreateModal,
    onTriggerOracle,
    onOpenLeaderboard,
    onOpenCredLog,
    onOpenProofGallery,
    onOpenEventsMerch,
    onOpenTournaments,
    onOpenProfile,
    onSelectTargetFilter,
    onSelectCategory,
    onResetFilters,
    onCloseAllModals,
  });

  callbacksRef.current = {
    currentUser,
    onOpenCreateModal,
    onTriggerOracle,
    onOpenLeaderboard,
    onOpenCredLog,
    onOpenProofGallery,
    onOpenEventsMerch,
    onOpenTournaments,
    onOpenProfile,
    onSelectTargetFilter,
    onSelectCategory,
    onResetFilters,
    onCloseAllModals,
  };

  // Platform Feature Tour Steps - Showcasing all DareDay capabilities with automatic view transitions
  const steps: TourStep[] = useMemo(() => [
    {
      id: 'oracle',
      targetId: 'ai-oracle-surge-btn',
      title: 'AI Oracle Gauntlet',
      badge: 'AI ENGINE',
      category: 'Algorithmic Dares',
      icon: <Sparkles className="h-4 w-4 text-indigo-400" />,
      description: 'Deploy on-demand, algorithmic challenges powered by Gemini. The Oracle dynamically constructs tailored cyber, social, tech, and physical dares with automated criteria and instant Cred stakes.',
      hint: 'Click next to explore direct peer challenges',
      position: 'bottom',
      onEnter: () => {
        callbacksRef.current.onCloseAllModals();
        callbacksRef.current.onResetFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    {
      id: 'direct-dares',
      targetId: 'target-direct-btn',
      title: 'Direct Peer Challenges',
      badge: 'PEER-TO-PEER',
      category: 'Challenges',
      icon: <Flame className="h-4 w-4 text-pink-400" />,
      description: 'Filter challenges targeted specifically to your handle. Issue 1-on-1 dares directly to friends and rivals, attach custom voice directives, and settle scores for Cred.',
      hint: 'Automatically switched to Direct Dares filter',
      position: 'bottom',
      onEnter: () => {
        callbacksRef.current.onCloseAllModals();
        callbacksRef.current.onSelectTargetFilter('direct');
      }
    },
    {
      id: 'sectors',
      targetId: 'category-tech-btn',
      title: 'Challenge Categories',
      badge: 'CATEGORIES',
      category: 'Categories',
      icon: <Terminal className="h-4 w-4 text-cyan-400" />,
      description: 'Browse challenges across 5 specialized categories: Tech & Code, Fitness & Outdoors, Social & Fun, Art & Creative, and Wild & Unusual. Switch categories anytime to find dares you love.',
      hint: 'Automatically switched to Tech & Code category',
      position: 'bottom',
      onEnter: () => {
        callbacksRef.current.onCloseAllModals();
        callbacksRef.current.onSelectTargetFilter('all');
        callbacksRef.current.onSelectCategory('tech');
      }
    },
    {
      id: 'create-dare',
      targetId: 'create-dare-modal-container',
      title: 'Custom Dare Creation',
      badge: 'CREATE DARE',
      category: 'Dare Creator',
      icon: <Flame className="h-4 w-4 text-amber-400" />,
      description: 'Create public dares or challenge friends directly. Attach live microphone audio briefings, tune the Cred reward slider (15–250 CR), specify difficulty levels, and set proof requirements.',
      hint: 'Automatically opened Dare Creation Modal',
      position: 'bottom',
      onEnter: () => {
        callbacksRef.current.onOpenCreateModal();
      }
    },
    {
      id: 'leaderboard',
      targetId: 'leaderboard-modal-container',
      title: 'Hall of Fame Leaderboard',
      badge: 'GLOBAL RANKINGS',
      category: 'Leaderboard',
      icon: <Trophy className="h-4 w-4 text-amber-400" />,
      description: 'Track the top players across platform leaderboards. Inspect all-time Cred accumulation, daily streak champions, verified proof rates, and prestigious PRO status.',
      hint: 'Automatically opened Hall of Fame Leaderboard',
      position: 'bottom',
      onEnter: () => {
        callbacksRef.current.onOpenLeaderboard();
      }
    },
    {
      id: 'rivalry',
      targetId: 'rivalry-view-section',
      title: 'Head-to-Head Rivalry Tracker',
      badge: 'HEAD-TO-HEAD',
      category: 'Social Competition',
      icon: <Swords className="h-4 w-4 text-pink-400" />,
      description: 'Analyze head-to-head win/loss ratios against friends! Compare community vote dominance (Legit vs. Busted), review shared direct duel records, and throw down direct rematches.',
      hint: 'Automatically opened Profile to Rivalry tab',
      position: 'bottom',
      onEnter: () => {
        callbacksRef.current.onOpenProfile(callbacksRef.current.currentUser, 'rivalry');
      }
    },
    {
      id: 'tournaments',
      targetId: 'squad-tournaments-modal-container',
      title: 'Squad vs. Squad Tournaments Arena',
      badge: 'TOURNAMENTS',
      category: 'Squad Battles',
      icon: <Swords className="h-4 w-4 text-amber-400" />,
      description: 'Squads compete for huge Cred prize pots! Back competing teams, submit verified proofs to score points for your squad, and claim prize rewards.',
      hint: 'Automatically opened Squad Tournaments Arena',
      position: 'bottom',
      onEnter: () => {
        if (callbacksRef.current.onOpenTournaments) {
          callbacksRef.current.onOpenTournaments();
        }
      }
    },
    {
      id: 'squad',
      targetId: 'squad-chat-section',
      title: 'Squad Chat & Teamwork',
      badge: 'SQUAD CHAT',
      category: 'Team Chat',
      icon: <MessageSquare className="h-4 w-4 text-indigo-400" />,
      description: 'Chat in real-time with your squad. Send messages, accept friend requests, see teammates, and collaborate on team dares.',
      hint: 'Automatically switched to Squad Chat tab',
      position: 'bottom',
      onEnter: () => {
        callbacksRef.current.onOpenProfile(callbacksRef.current.currentUser, 'squad');
      }
    },
    {
      id: 'heatmap',
      targetId: 'heatmap-view-container',
      title: 'Live World Challenge Map',
      badge: 'LIVE MAP',
      category: 'Global Map',
      icon: <Map className="h-4 w-4 text-cyan-400" />,
      description: 'Interactive map visualizing active challenge clusters worldwide. Inspect real-time hotspots in San Francisco, Tokyo, Berlin, London, and New York.',
      hint: 'Automatically switched to Challenge Map tab',
      position: 'bottom',
      onEnter: () => {
        callbacksRef.current.onOpenProfile(callbacksRef.current.currentUser, 'location-map');
      }
    },
    {
      id: 'proof-gallery',
      targetId: 'proof-gallery-modal-container',
      title: 'Proof Gallery & Reviews',
      badge: 'AI VERIFICATION',
      category: 'Proof Verification',
      icon: <Camera className="h-4 w-4 text-emerald-400" />,
      description: 'Inspect photo and video evidence submitted by challengers. Watch AI evaluate authenticity with automated confidence scores and bonus Cred, alongside community Legit/Busted voting.',
      hint: 'Automatically opened Proof Gallery',
      position: 'bottom',
      onEnter: () => {
        callbacksRef.current.onOpenProofGallery();
      }
    },
    {
      id: 'cred-log',
      targetId: 'cred-log-modal-container',
      title: 'Cred History & Rewards',
      badge: 'CRED REWARDS',
      category: 'Cred Balance',
      icon: <Coins className="h-4 w-4 text-amber-400" />,
      description: 'Your complete transaction history: track dare payouts, AI bonus multipliers, challenge fees, and streak rewards.',
      hint: 'Automatically opened Cred History',
      position: 'bottom',
      onEnter: () => {
        callbacksRef.current.onOpenCredLog();
      }
    },
    {
      id: 'events-merch',
      targetId: 'events-merch-modal-container',
      title: 'DARE Merch & Community Events',
      badge: 'MERCH & EVENTS',
      category: 'Merch & Meetups',
      icon: <ShoppingBag className="h-4 w-4 text-purple-400" />,
      description: 'Explore limited edition physical DARE streetwear, exclusive merchandise, and RSVP for upcoming community meetups.',
      hint: 'Automatically opened Merch & Events',
      position: 'bottom',
      onEnter: () => {
        callbacksRef.current.onOpenEventsMerch();
      }
    }
  ], []);

  // Helper to calculate coordinates of target element
  const updateBubblePosition = useCallback(() => {
    if (!isActive) return;
    const step = steps[currentStep];
    if (!step) return;
    const el = document.getElementById(step.targetId);

    const bubbleWidth = Math.min(390, window.innerWidth - 24);
    const bubbleHeight = 240;

    if (el) {
      const rect = el.getBoundingClientRect();
      const isModal = step.targetId.includes('modal') || rect.height > 420;

      let top = 0;
      let left = 0;

      if (isModal) {
        // Dock prominently without obscuring modal content
        if (window.innerWidth >= 768) {
          top = Math.max(80, Math.min(window.innerHeight - bubbleHeight - 24, rect.top + 20));
          left = Math.max(16, rect.right - bubbleWidth - 24);
        } else {
          top = window.innerHeight - bubbleHeight - 16;
          left = (window.innerWidth - bubbleWidth) / 2;
        }
      } else {
        top = rect.bottom + 14;
        left = rect.left + (rect.width / 2) - (bubbleWidth / 2);

        if (step.position === 'top') {
          top = rect.top - bubbleHeight - 14;
        } else if (step.position === 'left') {
          top = rect.top + (rect.height / 2) - (bubbleHeight / 2);
          left = rect.left - bubbleWidth - 14;
        } else if (step.position === 'right') {
          top = rect.top + (rect.height / 2) - (bubbleHeight / 2);
          left = rect.right + 14;
        }

        // Clamp within viewport margins
        const maxRightMargin = window.innerWidth >= 768 ? 56 : 12;
        if (left < 12) left = 12;
        if (left + bubbleWidth > window.innerWidth - maxRightMargin) left = window.innerWidth - bubbleWidth - maxRightMargin;
        if (top < 12) top = 12;
        if (top + bubbleHeight > window.innerHeight - 80) top = window.innerHeight - bubbleHeight - 80;
      }

      setBubbleCoords({ top, left });
    } else {
      // Fallback: center in screen
      setBubbleCoords({
        top: Math.max(80, (window.innerHeight - bubbleHeight) / 2),
        left: (window.innerWidth - bubbleWidth) / 2,
      });
    }
  }, [isActive, currentStep, steps]);

  // Execute transition and smooth scrolling on step change
  useEffect(() => {
    if (!isActive) return;

    const step = steps[currentStep];
    if (step && step.onEnter) {
      step.onEnter();
    }

    // Dynamic scroll into view and coordinate alignment
    const timer1 = setTimeout(() => {
      const el = document.getElementById(step.targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      updateBubblePosition();
    }, 60);

    const timer2 = setTimeout(updateBubblePosition, 200);
    const timer3 = setTimeout(updateBubblePosition, 450);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isActive, currentStep]);

  // Apply tactical spotlight glow to target element
  useEffect(() => {
    if (!isActive) return;
    const step = steps[currentStep];
    if (!step) return;
    const el = document.getElementById(step.targetId);
    if (el) {
      el.classList.add('tour-active-spotlight');
      return () => {
        el.classList.remove('tour-active-spotlight');
      };
    }
  }, [isActive, currentStep]);

  // Periodic poll & event listeners for position maintenance
  useEffect(() => {
    if (isActive) {
      updateBubblePosition();
      window.addEventListener('resize', updateBubblePosition);
      window.addEventListener('scroll', updateBubblePosition);
      const interval = setInterval(updateBubblePosition, 600);
      return () => {
        window.removeEventListener('resize', updateBubblePosition);
        window.removeEventListener('scroll', updateBubblePosition);
        clearInterval(interval);
      };
    } else {
      setBubbleCoords(prev => (prev !== null ? null : prev));
    }
  }, [isActive, updateBubblePosition]);

  // Listen for global custom event to trigger tour from any menu
  useEffect(() => {
    const handleGlobalLaunch = () => {
      handleStartTour();
    };
    window.addEventListener('start-dareday-tour', handleGlobalLaunch);
    return () => window.removeEventListener('start-dareday-tour', handleGlobalLaunch);
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStep]);

  const handleStartTour = () => {
    playSound('oracle');
    setIsActive(true);
    setCurrentStep(0);
  };

  const handleNext = () => {
    playSound('click');
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    playSound('click');
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleJumpToStep = (idx: number) => {
    playSound('click');
    setCurrentStep(idx);
  };

  const handleClose = () => {
    playSound('click');
    setIsActive(false);
    onCloseAllModals();
    onResetFilters();
  };

  const handleComplete = () => {
    playSound('complete');
    setIsActive(false);
    onCloseAllModals();
    onResetFilters();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If the user has disabled help bubbles or dismissed the tutorial, do not render
  if (currentUser.disableHelpBubbles || isDismissed) {
    return null;
  }

  const step = steps[currentStep];

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDismissed(true);
    if (isActive) {
      handleClose();
    }
  };

  return (
    <>
      {/* Sleek, Clearly Visible Platform Tour Tab on Screen Edge (Desktop only to prevent mobile overlap) */}
      <div 
        id="help-tour-side-tab-container"
        className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 items-center select-none transition-transform duration-200 hover:-translate-x-1"
      >
        {/* Subtle dismiss button on the left of the tab */}
        <button
          type="button"
          onClick={handleDismiss}
          className="mr-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950/90 border border-slate-700/80 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 transition-all cursor-pointer shadow-md"
          title="Close guide tab"
          aria-label="Hide guide tab"
        >
          <X className="h-3 w-3" />
        </button>

        {/* Visible, Polished Guide Pill */}
        <button
          onClick={isActive ? handleClose : handleStartTour}
          className={`flex h-9 items-center gap-1.5 rounded-l-full border-l-2 border-y-2 border-r-0 border-indigo-400/80 bg-gradient-to-r from-indigo-900/95 via-indigo-950/95 to-slate-950/95 px-2.5 sm:px-3.5 text-indigo-200 hover:text-white hover:border-cyan-400 hover:from-indigo-800/95 transition-all cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.4)] backdrop-blur-md ${
            isActive ? 'border-cyan-400 from-cyan-950 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.5)]' : ''
          }`}
          title={isActive ? 'Close Guide' : 'Platform Tour Guide'}
          id="help-tour-launcher-btn"
          aria-label="Platform Tour Guide"
        >
          {isActive ? (
            <>
              <X className="h-3.5 w-3.5 text-pink-400" />
              <span className="text-[11px] font-bold">Exit</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wide">Tour</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Floating Help Overlay */}
      {isActive && bubbleCoords && step && (
        <div 
          className="fixed z-[1050]" 
          style={{ top: `${bubbleCoords.top}px`, left: `${bubbleCoords.left}px` }}
        >
          <div className="w-[360px] sm:w-[390px] max-w-[calc(100vw-24px)] rounded-2xl border border-indigo-500/40 bg-[#070b13]/95 p-4 sm:p-5 shadow-[0_15px_50px_rgba(0,0,0,0.9),0_0_20px_rgba(99,102,241,0.25)] backdrop-blur-2xl animate-in zoom-in-95 duration-200 flex flex-col">
            
            {/* Progress bar line across top */}
            <div className="w-full bg-slate-800/80 h-1 rounded-full mb-3.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-300 h-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            {/* Header with category & step counter */}
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider bg-indigo-500/15 px-2 py-0.5 rounded-md border border-indigo-500/30">
                  {step.icon}
                  <span>{step.badge}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  {step.category}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  {currentStep + 1} / {steps.length}
                </span>
                <button
                  onClick={handleClose}
                  className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                  title="Exit Tour"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold font-mono text-white flex items-center gap-2 tracking-wide">
                <span>{step.title}</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {step.description}
              </p>

              {/* Step Hint */}
              <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono text-cyan-300/90 bg-cyan-950/30 border border-cyan-500/20 rounded-lg px-2.5 py-1">
                <Sparkles className="h-3 w-3 text-cyan-400 shrink-0" />
                <span className="truncate">{step.hint}</span>
              </div>
            </div>

            {/* Interactive Step Jump Dots */}
            <div className="flex items-center justify-center gap-1.5 py-2.5 mt-2 border-t border-indigo-500/10">
              {steps.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => handleJumpToStep(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStep 
                      ? 'bg-indigo-400 w-5 ring-1 ring-indigo-300' 
                      : 'bg-slate-700 hover:bg-slate-500 w-2'
                  }`}
                  title={`Jump to: ${s.title}`}
                />
              ))}
            </div>

            {/* Footer Navigation Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-indigo-500/20 gap-2">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={`flex items-center gap-1 text-xs font-mono font-bold uppercase transition-all px-2 py-1.5 rounded-lg ${
                  currentStep === 0 
                    ? 'text-slate-600 cursor-not-allowed opacity-40' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                onClick={(e) => handleDismiss(e)}
                className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors px-1 py-1 cursor-pointer whitespace-nowrap"
                title="Hide tutorial button completely"
              >
                Don't show again
              </button>

              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-slate-950 bg-indigo-400 hover:bg-indigo-300 px-3 py-1.5 rounded-lg transition-all shadow-md cursor-pointer"
              >
                <span>{currentStep === steps.length - 1 ? 'Finish' : 'Next'}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
