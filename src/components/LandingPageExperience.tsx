import React, { useState } from 'react';
import { 
  Flame, 
  Sparkles, 
  Trophy, 
  Target, 
  Shield, 
  Compass, 
  Swords, 
  ArrowRight, 
  Play, 
  Check, 
  CheckCircle2, 
  ChevronRight, 
  Zap, 
  RefreshCw, 
  Camera, 
  Video, 
  Bot, 
  MapPin, 
  Users, 
  Heart, 
  MessageSquare, 
  Share2, 
  Smartphone, 
  Coins, 
  Crown, 
  Clock,
  Layers,
  Radio,
  CheckCheck
} from 'lucide-react';
import { UserProfile, DareItem } from '../types';
import { playSound } from '../utils/soundEffects';
import { DareDayLogo } from './DareDayLogo';

interface LandingPageExperienceProps {
  currentUser: UserProfile;
  dailyMission?: any;
  onStartMission: (dare: DareItem) => void;
  onOpenCreateModal: () => void;
  onOpenDropZones: () => void;
  onOpenLiveDuels: () => void;
  onOpenTournaments: () => void;
  onOpenLeaderboard: () => void;
  onOpenProUpgrade: () => void;
  onOpenArmory: () => void;
  onAcceptDare?: (dare: DareItem) => void;
  onViewProof?: (dare: DareItem) => void;
  dares?: DareItem[];
}

export const LandingPageExperience: React.FC<LandingPageExperienceProps> = ({
  currentUser,
  dailyMission,
  onStartMission,
  onOpenCreateModal,
  onOpenDropZones,
  onOpenLiveDuels,
  onOpenTournaments,
  onOpenLeaderboard,
  onOpenProUpgrade,
  onOpenArmory,
  onAcceptDare,
  onViewProof,
  dares = [],
}) => {
  // State for interactive UI elements
  const [activeStep, setActiveStep] = useState<number>(0);
  const [activePhoneTab, setActivePhoneTab] = useState<'ops' | 'gps' | '1v1'>('ops');
  const [aiJudgeStage, setAiJudgeStage] = useState<'upload' | 'analyzing' | 'verified'>('verified');
  const [isDailyAccepted, setIsDailyAccepted] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  // Sample or live daily challenge
  const dailyDareTitle = dailyMission?.dare?.title || "FIND SOMETHING RED YOU'VE NEVER NOTICED BEFORE.";
  const dailyDareCategory = dailyMission?.dare?.category || "Real World Mission";
  const dailyDareCred = dailyMission?.dare?.credReward || 50;

  const handleAcceptDailyHero = () => {
    playSound('levelUp');
    setIsDailyAccepted(true);
    if (dailyMission?.dare) {
      onStartMission(dailyMission.dare);
    } else {
      const el = document.getElementById('dare-feed-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToFeed = () => {
    playSound('click');
    const el = document.getElementById('dare-feed-section') || document.querySelector('.dare-feed');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleLike = (id: string) => {
    playSound('pop');
    setLikedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 5 Step Process Data
  const STEPS = [
    {
      num: '01',
      tag: 'CHALLENGE',
      title: 'Deploy the Dare',
      quote: '"I DARE @josh to reach the viewpoint before sunset."',
      desc: 'Target a specific friend, your squad, or broadcast a bounty to the entire city grid.',
      icon: <Target className="h-5 w-5 text-pink-400" />,
      color: 'from-pink-500/20 via-pink-500/10 to-transparent border-pink-500/40',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30'
    },
    {
      num: '02',
      tag: 'ACCEPT',
      title: 'Lock the Stakes',
      quote: '"DARE ACCEPTED 🔥 — 24H CLOCK ACTIVE"',
      desc: 'Your friend receives an instant push notification, accepts the challenge, and starts the countdown.',
      icon: <Flame className="h-5 w-5 text-amber-400" />,
      color: 'from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/40',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      num: '03',
      tag: 'COMPLETE',
      title: 'Real-World Action',
      quote: 'Camera recording · Location verified · Mission ongoing',
      desc: 'Get off the sofa, step outside, and complete the physical or creative task before time runs out.',
      icon: <Zap className="h-5 w-5 text-cyan-400" />,
      color: 'from-cyan-500/20 via-cyan-500/10 to-transparent border-cyan-500/40',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    },
    {
      num: '04',
      tag: 'PROVE',
      title: 'AI Verification',
      quote: '🤖 Multimodal Neural Vision analyzing timestamp & criteria...',
      desc: 'Submit video or photo proof. DARE\'s AI engine analyzes the submission and provides instant, impartial judging.',
      icon: <Bot className="h-5 w-5 text-purple-400" />,
      color: 'from-purple-500/20 via-purple-500/10 to-transparent border-purple-500/40',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    },
    {
      num: '05',
      tag: 'EARN',
      title: 'Bank Your Cred',
      quote: '🏆 +50 CRED AWARDED · 7-DAY STREAK EXTENDED',
      desc: 'Level up your profile rank, climb the global leaderboard, unlock rare Cyber Armory gear, and pass the dare on.',
      icon: <Trophy className="h-5 w-5 text-emerald-400" />,
      color: 'from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500/40',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
  ];

  return (
    <div className="relative w-full max-w-full bg-[#050509] text-slate-100 overflow-x-hidden selection:bg-pink-500/30 selection:text-pink-200">
      
      {/* ========================================================================= */}
      {/* 1. CINEMATIC HERO SECTION                                                */}
      {/* ========================================================================= */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-6 sm:pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-pink-500/10 overflow-hidden">
        
        {/* Ambient Dark Atmospheric Lighting & Grid Mesh */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Magenta & Twilight Glow Orbs with Safe Boundary Constraints */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[90vw] max-w-[650px] h-[380px] bg-gradient-to-b from-pink-600/15 via-purple-600/10 to-transparent rounded-full blur-[100px]" />
          <div className="absolute top-1/4 -left-16 w-72 h-72 bg-cyan-600/10 rounded-full blur-[90px]" />
          <div className="absolute bottom-10 -right-16 w-72 h-72 bg-rose-600/10 rounded-full blur-[100px]" />
          
          {/* Subtle Cyber Radar Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />
          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#050509]/70 via-transparent to-[#050509]" />
        </div>

        <div className="relative mx-auto max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Hero Column: Mammoth Bold Typography & Action CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left z-10 max-w-full">
            
            {/* Top Positioning Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-950/40 px-3.5 py-1.5 text-xs font-mono font-bold tracking-wider text-pink-300 shadow-[0_0_20px_rgba(255,0,127,0.15)] mb-5 sm:mb-6 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
              </span>
              <span>DARE — PEER CHALLENGE PROTOCOL</span>
              <span className="text-pink-500/60 hidden sm:inline">|</span>
              <span className="text-pink-200/80 hidden sm:inline">dare.me.uk</span>
            </div>

            {/* Mammoth Editorial Headline */}
            <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.94] text-white uppercase drop-shadow-2xl">
              YOUR FRIENDS <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007F] via-[#FF5533] to-[#E000B8] drop-shadow-[0_0_35px_rgba(255,0,127,0.4)]">
                WON'T SEE
              </span> <br />
              THIS COMING.
            </h1>

            {/* Supporting Copy */}
            <p className="mt-5 sm:mt-6 text-sm sm:text-base md:text-lg text-slate-300 font-medium max-w-xl leading-relaxed">
              Challenge your friends. Complete real-world missions. <br className="hidden sm:inline" />
              Prove it. Earn Cred. Stop scrolling. Start doing.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-7 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  onOpenCreateModal();
                }}
                className="group relative flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#FF007F] via-[#FF3366] to-[#FF5533] px-7 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-black tracking-wide text-white uppercase transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(255,0,127,0.45)] cursor-pointer overflow-hidden border border-pink-400/40"
              >
                <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-amber-200 animate-pulse shrink-0" />
                <span>🔥 START A DARE</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-white/80 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              <button
                type="button"
                onClick={scrollToFeed}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/90 backdrop-blur-md px-6 sm:px-7 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-slate-200 transition-all hover:border-pink-500/50 hover:bg-slate-800 hover:text-white active:scale-95 cursor-pointer shadow-lg"
              >
                <Compass className="h-4 w-4 sm:h-5 sm:w-5 text-pink-400 shrink-0" />
                <span>EXPLORE CHALLENGES</span>
              </button>
            </div>

            {/* PWA & Platform Subtext */}
            <div className="mt-5 flex items-center gap-2.5 text-xs font-mono text-slate-400">
              <div className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>No app store required · Install as a PWA directly from browser</span>
            </div>

          </div>

          {/* Right Hero Column: CINEMATIC VISUAL + LIVE-LOOKING DARE OF THE DAY CARD */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center z-10 w-full max-w-full">
            
            {/* Cinematic Background Card Frame with Ambient Glow */}
            <div className="relative w-full max-w-md rounded-3xl border border-pink-500/40 bg-gradient-to-b from-[#11111A]/95 via-[#0E0E17]/95 to-[#08080E]/98 p-5 sm:p-7 shadow-[0_0_40px_rgba(255,0,127,0.2)] backdrop-blur-2xl transition-all duration-500 hover:border-pink-500/70 group overflow-hidden">
              
              {/* Subtle Atmospheric Sunset/Twilight Top Glow Overlay */}
              <div className="pointer-events-none absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-pink-600/15 via-purple-600/5 to-transparent" />

              {/* Card Header Top Badges */}
              <div className="relative z-10 flex items-center justify-between pb-3.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400 shadow-[0_0_15px_rgba(255,0,127,0.3)]">
                    <Flame className="h-4 w-4" />
                  </span>
                  <span className="font-tech text-xs font-black tracking-wider uppercase text-pink-400">
                    DARE OF THE DAY
                  </span>
                </div>
                <span className="rounded-full border border-amber-500/40 bg-amber-950/50 px-2.5 py-1 text-[11px] font-mono font-bold text-amber-300">
                  +{dailyDareCred} CRED
                </span>
              </div>

              {/* Challenge Title */}
              <div className="relative z-10 my-5">
                <p className="text-[11px] font-mono uppercase tracking-widest text-pink-300/80 mb-1.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-pink-400 animate-ping" />
                  DAILY MISSION
                </p>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase leading-snug">
                  {dailyDareTitle}
                </h3>
              </div>

              {/* Mission Metadata Tags */}
              <div className="relative z-10 grid grid-cols-2 gap-2.5 mb-5">
                <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 border border-slate-800 p-2.5 text-xs text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{dailyDareCategory}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 border border-slate-800 p-2.5 text-xs text-slate-300">
                  <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>24 Hours Left</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleAcceptDailyHero}
                className={`relative z-10 w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm sm:text-base font-black uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-lg active:scale-95 ${
                  isDailyAccepted
                    ? 'bg-emerald-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                    : 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white hover:brightness-110 shadow-[0_0_25px_rgba(255,0,127,0.35)]'
                }`}
              >
                {isDailyAccepted ? (
                  <>
                    <CheckCheck className="h-4 w-4" />
                    <span>DARE ACCEPTED 🔥</span>
                  </>
                ) : (
                  <>
                    <Flame className="h-4 w-4 text-amber-200" />
                    <span>[ ACCEPT DARE ]</span>
                  </>
                )}
              </button>

              {/* Live Card Activity Subline */}
              <div className="relative z-10 mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5 text-pink-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-pink-400 animate-ping" />
                  38 Challengers Active
                </span>
                <span className="text-slate-400">AI Vision Verified</span>
              </div>

            </div>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 2. SECTION 2: STOP SCROLLING. START DOING. (5-Step Interactive Process) */}
      {/* ========================================================================= */}
      <section id="how-it-works-section" className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#0B0B12] border-b border-slate-800/80 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-950/40 px-3.5 py-1 text-xs font-mono font-bold text-pink-300 mb-3">
              <Zap className="h-3.5 w-3.5 text-pink-400" />
              <span>THE 5-STEP PROTOCOL</span>
            </div>
            <h2 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white">
              STOP SCROLLING. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400">
                START DOING.
              </span>
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-slate-300 font-medium">
              DARE turns "you won't do it" into an actual challenge.
            </p>
          </div>

          {/* 5-Step Connected Flow Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative">
            {STEPS.map((step, idx) => (
              <div
                key={step.num}
                onClick={() => {
                  playSound('pop');
                  setActiveStep(idx);
                }}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 cursor-pointer min-w-0 ${
                  activeStep === idx 
                    ? `bg-gradient-to-b ${step.color} shadow-[0_0_30px_rgba(255,0,127,0.15)] scale-[1.02]`
                    : 'bg-[#11111A]/90 border-slate-800 hover:border-slate-700 hover:bg-[#171721]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${step.badgeColor}`}>
                      {step.num} {step.tag}
                    </span>
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 shrink-0">
                      {step.icon}
                    </div>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-white mb-2">
                    {step.title}
                  </h4>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 mb-3 font-mono text-xs text-pink-200/90 leading-relaxed italic break-words">
                    {step.quote}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Step {idx + 1} of 5</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>

          {/* Quick CTA to Test the Pipeline */}
          <div className="mt-10 sm:mt-12 text-center">
            <button
              onClick={() => {
                playSound('pop');
                onOpenCreateModal();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-3 text-xs sm:text-sm font-bold text-white hover:brightness-110 shadow-lg shadow-pink-600/30 transition-all cursor-pointer uppercase tracking-wider"
            >
              <Flame className="h-4 w-4" />
              <span>Launch a Challenge Now</span>
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION 3: PRODUCT SHOWCASE (3 Floating Phone Mockups)                */}
      {/* ========================================================================= */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#050509] border-b border-pink-500/10 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3.5 py-1 text-xs font-mono font-bold text-purple-300 mb-3">
              <Smartphone className="h-3.5 w-3.5 text-purple-400" />
              <span>IMMERSIVE APP EXPERIENCE</span>
            </div>
            <h2 className="text-3xl xs:text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
              BUILT FOR REAL-WORLD <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400">
                COMPETITION & ACTION
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400">
              Three core game arenas engineered to pull you into the physical world.
            </p>

            {/* Mobile/Tablet Tab Selector */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-[#11111A] border border-slate-800 w-fit mx-auto">
              <button
                onClick={() => {
                  playSound('click');
                  setActivePhoneTab('ops');
                }}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  activePhoneTab === 'ops'
                    ? 'bg-pink-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                01 DAILY OPS
              </button>
              <button
                onClick={() => {
                  playSound('click');
                  setActivePhoneTab('gps');
                }}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  activePhoneTab === 'gps'
                    ? 'bg-cyan-500 text-slate-950 shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                02 GPS BOUNTIES
              </button>
              <button
                onClick={() => {
                  playSound('click');
                  setActivePhoneTab('1v1');
                }}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  activePhoneTab === '1v1'
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                03 1V1 ARENA
              </button>
            </div>
          </div>

          {/* 3 High-Fidelity Phone Frames Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            
            {/* PHONE 1: DAILY OPS */}
            <div className={`relative flex flex-col rounded-[2.2rem] sm:rounded-[2.5rem] border p-3.5 sm:p-4 bg-gradient-to-b from-[#171721] to-[#0B0B12] shadow-2xl transition-all duration-500 ${
              activePhoneTab === 'ops' ? 'border-pink-500/70 ring-2 ring-pink-500/30 scale-[1.01]' : 'border-slate-800 opacity-90'
            }`}>
              {/* Speaker Notch */}
              <div className="w-20 sm:w-24 h-3.5 sm:h-4 bg-black rounded-full mx-auto mb-3.5 border border-slate-800" />
              
              <div className="flex-1 rounded-2xl bg-[#080B14] p-3.5 sm:p-4 border border-slate-800/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                    <span className="font-bold text-pink-400 flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5" /> DAILY OPS
                    </span>
                    <span className="text-slate-500 font-mono">9:41 AM</span>
                  </div>

                  <div className="mt-3.5 p-3 rounded-xl bg-pink-950/30 border border-pink-500/30 mb-2.5">
                    <span className="text-[10px] font-mono text-pink-300 font-bold uppercase">TRENDING DARE</span>
                    <h5 className="font-bold text-white text-xs sm:text-sm mt-1">20 Push-Ups in 60s at Sunset</h5>
                    <p className="text-[11px] text-slate-300 mt-1">Proof: Video clip · Reward: +75 Cred</p>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-white truncate">Cold Plunge Challenge</div>
                        <div className="text-[10px] text-slate-400">12 Active Contenders</div>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400 shrink-0">+50</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-white truncate">Find a Vintage Neon Sign</div>
                        <div className="text-[10px] text-slate-400">Location Mission</div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">+100</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playSound('click');
                    scrollToFeed();
                  }}
                  className="mt-4 w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  View Daily Ops Grid
                </button>
              </div>

              <div className="text-center mt-3 text-xs font-mono text-pink-300">
                PHONE 1: DAILY OPS
              </div>
            </div>

            {/* PHONE 2: GPS BOUNTIES */}
            <div className={`relative flex flex-col rounded-[2.2rem] sm:rounded-[2.5rem] border p-3.5 sm:p-4 bg-gradient-to-b from-[#171721] to-[#0B0B12] shadow-2xl transition-all duration-500 ${
              activePhoneTab === 'gps' ? 'border-cyan-500/70 ring-2 ring-cyan-500/30 scale-[1.01]' : 'border-slate-800 opacity-90'
            }`}>
              {/* Speaker Notch */}
              <div className="w-20 sm:w-24 h-3.5 sm:h-4 bg-black rounded-full mx-auto mb-3.5 border border-slate-800" />
              
              <div className="flex-1 rounded-2xl bg-[#080B14] p-3.5 sm:p-4 border border-slate-800/80 flex flex-col justify-between relative overflow-hidden">
                {/* Simulated Radar Map Grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                    <span className="font-bold text-cyan-400 flex items-center gap-1">
                      <Compass className="h-3.5 w-3.5" /> GPS RADAR
                    </span>
                    <span className="text-emerald-400 font-mono text-[10px]">● LIVE SIGNAL</span>
                  </div>

                  {/* Simulated Radar Beacon */}
                  <div className="relative my-3.5 h-28 sm:h-32 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-center overflow-hidden">
                    <div className="absolute w-20 sm:w-24 h-20 sm:h-24 rounded-full border border-cyan-400/30 animate-ping" />
                    <div className="absolute w-14 sm:w-16 h-14 sm:h-16 rounded-full border border-cyan-400/50" />
                    <div className="p-2 rounded-full bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                      <MapPin className="h-4 sm:h-5 w-4 sm:w-5" />
                    </div>
                    <span className="absolute bottom-1.5 text-[10px] font-mono text-cyan-300">
                      High Peak Summit · 1.2km Away
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span className="truncate pr-2">Apex Viewpoint Beacon</span>
                      <span className="text-cyan-400 font-mono shrink-0">+120 Cred</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Reach coordinate & submit geotagged photo.</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playSound('laser');
                    onOpenDropZones();
                  }}
                  className="relative z-10 mt-4 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md"
                >
                  Open AR Radar
                </button>
              </div>

              <div className="text-center mt-3 text-xs font-mono text-cyan-300">
                PHONE 2: GPS BOUNTIES
              </div>
            </div>

            {/* PHONE 3: 1V1 ARENA */}
            <div className={`relative flex flex-col rounded-[2.2rem] sm:rounded-[2.5rem] border p-3.5 sm:p-4 bg-gradient-to-b from-[#171721] to-[#0B0B12] shadow-2xl transition-all duration-500 ${
              activePhoneTab === '1v1' ? 'border-purple-500/70 ring-2 ring-purple-500/30 scale-[1.01]' : 'border-slate-800 opacity-90'
            }`}>
              {/* Speaker Notch */}
              <div className="w-20 sm:w-24 h-3.5 sm:h-4 bg-black rounded-full mx-auto mb-3.5 border border-slate-800" />
              
              <div className="flex-1 rounded-2xl bg-[#080B14] p-3.5 sm:p-4 border border-slate-800/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                    <span className="font-bold text-purple-400 flex items-center gap-1">
                      <Swords className="h-3.5 w-3.5" /> 1V1 ARENA
                    </span>
                    <span className="text-rose-400 font-mono text-[10px]">LIVE DUEL</span>
                  </div>

                  {/* Versus Card */}
                  <div className="my-3.5 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-slate-900/60 border border-purple-500/30 text-center">
                    <div className="flex items-center justify-around">
                      <div>
                        <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-pink-500/30 border border-pink-400 mx-auto flex items-center justify-center font-bold text-pink-300 text-xs">
                          YOU
                        </div>
                        <div className="text-xs font-bold text-white mt-1">@champion</div>
                      </div>

                      <div className="text-base sm:text-lg font-black text-amber-400 font-tech">VS</div>

                      <div>
                        <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-purple-500/30 border border-purple-400 mx-auto flex items-center justify-center font-bold text-purple-300 text-xs">
                          JOSH
                        </div>
                        <div className="text-xs font-bold text-white mt-1">@josh_dare</div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                      Stakes: <span className="text-amber-300 font-bold">100 CRED POT</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <span className="text-[10px] font-mono text-purple-300">TIME REMAINING</span>
                    <div className="text-lg sm:text-xl font-mono font-bold text-white">04:18:22</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playSound('laser');
                    onOpenLiveDuels();
                  }}
                  className="mt-4 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Enter 1v1 Arena
                </button>
              </div>

              <div className="text-center mt-3 text-xs font-mono text-purple-300">
                PHONE 3: 1V1 ARENA
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION 4: REAL WORLD / GPS (Your City is Full of Dares)             */}
      {/* ========================================================================= */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#0B0B12] border-b border-slate-800 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-5 sm:space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono font-bold text-cyan-300">
                <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                <span>GEOLOCATION PROTOCOL</span>
              </div>

              <h2 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-none">
                YOUR CITY <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                  IS FULL OF DARES.
                </span>
              </h2>

              <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed">
                Discover challenges around you. Take them on. Leave your mark. Real-world adventure starts right outside your front door.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="p-3.5 rounded-2xl bg-[#11111A] border border-slate-800">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-1">
                    <MapPin className="h-4 w-4 shrink-0" /> 📍 GPS Missions
                  </div>
                  <p className="text-xs text-slate-400">Geofenced beacons unlocked only when standing at the physical target.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#11111A] border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                    <Zap className="h-4 w-4 shrink-0" /> 🏃 Real-World Challenges
                  </div>
                  <p className="text-xs text-slate-400">Physical fitness tests, city exploration, rooftop missions, and scavenger hunts.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#11111A] border border-slate-800">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-1">
                    <Users className="h-4 w-4 shrink-0" /> 👥 Community Dares
                  </div>
                  <p className="text-xs text-slate-400">Open bounties created by local creators and squads waiting for contenders.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#11111A] border border-slate-800">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                    <Trophy className="h-4 w-4 shrink-0" /> 🏆 Rewards
                  </div>
                  <p className="text-xs text-slate-400">Earn multipliers, rare loot badges, and verified Cred proof tokens.</p>
                </div>
              </div>

              <button
                onClick={() => {
                  playSound('laser');
                  onOpenDropZones();
                }}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-6 sm:px-7 py-3.5 sm:py-4 text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(6,182,212,0.3)] cursor-pointer"
              >
                <Compass className="h-4 sm:h-5 w-4 sm:w-5 shrink-0" />
                <span>EXPLORE NEARBY DROP ZONES</span>
              </button>
            </div>

            {/* Visual Radar Mockup */}
            <div className="lg:col-span-6 w-full max-w-full">
              <div className="relative rounded-3xl border border-cyan-500/30 bg-[#080B14] p-4 sm:p-6 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-20" />
                
                <div className="relative z-10 space-y-3.5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                    <div className="flex items-center gap-2 font-mono text-cyan-300">
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                      SECTOR RADAR ACTIVE
                    </div>
                    <span className="font-mono text-slate-400 text-[10px] sm:text-xs">51.5074° N, 0.1278° W</span>
                  </div>

                  {/* Radar Circles and Markers */}
                  <div className="relative h-60 sm:h-72 w-full rounded-2xl bg-[#0B0F19] border border-cyan-500/20 flex items-center justify-center overflow-hidden">
                    <div className="absolute w-56 sm:w-64 h-56 sm:h-64 rounded-full border border-cyan-500/20" />
                    <div className="absolute w-36 sm:w-44 h-36 sm:h-44 rounded-full border border-cyan-500/30" />
                    <div className="absolute w-20 sm:w-24 h-20 sm:h-24 rounded-full border border-cyan-500/50" />
                    
                    {/* Pulsing center radar sweep line */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-500/10 to-transparent animate-spin duration-3000" />

                    {/* Beacon 1 */}
                    <div className="absolute top-6 left-4 sm:top-8 sm:left-8 p-1.5 sm:p-2 rounded-xl bg-pink-500/20 border border-pink-400 text-pink-300 text-[9px] sm:text-[10px] font-mono flex items-center gap-1 shadow-[0_0_15px_rgba(255,0,127,0.5)] max-w-[calc(100%-2rem)]">
                      <MapPin className="h-3 w-3 text-pink-400 shrink-0" /> <span className="truncate">Sunset Ridge (+100)</span>
                    </div>

                    {/* Beacon 2 */}
                    <div className="absolute bottom-6 right-4 sm:bottom-8 sm:right-8 p-1.5 sm:p-2 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-[9px] sm:text-[10px] font-mono flex items-center gap-1 shadow-[0_0_15px_rgba(6,182,212,0.5)] max-w-[calc(100%-2rem)]">
                      <MapPin className="h-3 w-3 text-cyan-400 shrink-0" /> <span className="truncate">Neon Scavenger (+75)</span>
                    </div>

                    {/* Beacon 3 (Center) */}
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-cyan-500 text-slate-950 shadow-[0_0_30px_rgba(6,182,212,0.8)] z-10 flex flex-col items-center">
                      <Compass className="h-5 sm:h-6 w-5 sm:w-6 animate-pulse" />
                      <span className="text-[9px] font-black uppercase mt-0.5">YOU</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>5 Active Dares in Your Grid</span>
                    <span className="text-cyan-400">AR Beacons Active</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION 5: FRIENDS / SOCIAL ARENA                                     */}
      {/* ========================================================================= */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#050509] border-b border-pink-500/10 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          
          <div className="relative rounded-3xl border border-pink-500/30 bg-gradient-to-r from-[#171721] via-[#11111A] to-[#171721] p-6 sm:p-10 lg:p-12 overflow-hidden shadow-2xl">
            
            {/* Background Light Accent */}
            <div className="pointer-events-none absolute top-0 right-0 w-72 h-72 bg-pink-600/10 rounded-full blur-[90px]" />

            <div className="relative z-10 max-w-2xl space-y-5 sm:space-y-6">
              
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-950/40 px-3.5 py-1 text-xs font-mono font-bold text-pink-300">
                <Users className="h-3.5 w-3.5 text-pink-400" />
                <span>SOCIAL ARENA</span>
              </div>

              <h2 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-none">
                DARE <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-400 to-amber-300">
                  YOUR FRIENDS.
                </span>
              </h2>

              <p className="text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed font-medium">
                Because "you won't do it" should be the beginning of the story.
              </p>

              {/* Interactive Squad Tags */}
              <div className="flex flex-wrap gap-2 pt-1">
                {['@josh', '@sarah', '@elena', '@marcus', '@alex'].map((tag) => (
                  <span key={tag} className="px-3 py-1.5 rounded-xl bg-black/60 border border-slate-700 text-xs font-mono text-pink-300">
                    {tag} <span className="text-slate-400 font-normal">in crosshairs</span>
                  </span>
                ))}
              </div>

              <div className="pt-3 flex flex-wrap gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    playSound('pop');
                    onOpenCreateModal();
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-[0_0_25px_rgba(255,0,127,0.4)] hover:brightness-110 active:scale-95 cursor-pointer"
                >
                  <Flame className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>CREATE A DARE FOR A FRIEND</span>
                </button>

                <button
                  onClick={() => {
                    playSound('click');
                    onOpenTournaments();
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-slate-200 hover:text-white hover:border-pink-500/50 transition-all cursor-pointer"
                >
                  <Swords className="h-4 w-4 sm:h-5 sm:w-5 text-pink-400" />
                  <span>SQUAD WARS</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECTION 6: AI JUDGE (Prove It)                                        */}
      {/* ========================================================================= */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#0B0B12] border-b border-slate-800 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left AI Description */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3.5 py-1 text-xs font-mono font-bold text-purple-300">
                <Bot className="h-3.5 w-3.5 text-purple-400" />
                <span>MULTIMODAL NEURAL ARBITER</span>
              </div>

              <h2 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-none">
                PROVE IT. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                  LET AI JUDGE.
                </span>
              </h2>

              <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed">
                Your friend says they completed the DARE. You're not convinced. <br />
                DARE uses real multimodal vision intelligence to analyze photo and video submissions, check physical criteria, and award immutable Cred.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#11111A] border border-slate-800">
                  <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400 shrink-0">
                    <Camera className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-white">Photo & Video Ingestion</h5>
                    <p className="text-xs text-slate-400">High-resolution visual inspection with timestamp and metadata auditing.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#11111A] border border-slate-800">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-white">Objective Neural Verdict</h5>
                    <p className="text-xs text-slate-400">Unbiased, instant determination with fun commentary and score breakdown.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Interactive AI Judging Simulator */}
            <div className="lg:col-span-6 w-full max-w-full">
              <div className="rounded-3xl border border-purple-500/40 bg-[#11111A] p-4 sm:p-6 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
                
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 text-xs font-mono">
                  <span className="text-purple-300 flex items-center gap-1.5 font-bold">
                    <Bot className="h-4 w-4 text-purple-400" /> AI VERIFICATION PIPELINE
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setAiJudgeStage('upload')}
                      className={`px-2 py-1 rounded text-[10px] ${aiJudgeStage === 'upload' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}
                    >
                      01
                    </button>
                    <button
                      onClick={() => setAiJudgeStage('analyzing')}
                      className={`px-2 py-1 rounded text-[10px] ${aiJudgeStage === 'analyzing' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}
                    >
                      02
                    </button>
                    <button
                      onClick={() => setAiJudgeStage('verified')}
                      className={`px-2 py-1 rounded text-[10px] ${aiJudgeStage === 'verified' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}
                    >
                      03
                    </button>
                  </div>
                </div>

                {/* Interactive Simulator Screen */}
                <div className="my-5 p-4 sm:p-5 rounded-2xl bg-[#080B14] border border-slate-800 text-center">
                  
                  {aiJudgeStage === 'upload' && (
                    <div className="space-y-3 py-3 sm:py-4">
                      <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-full bg-pink-500/20 border border-pink-400 mx-auto flex items-center justify-center text-pink-400">
                        <Camera className="h-5 sm:h-6 w-5 sm:w-6" />
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-white">PROOF SUBMITTED</h4>
                      <p className="text-xs text-slate-400">20 Push-Ups Video (60 FPS, GPS Verified)</p>
                      <button
                        onClick={() => {
                          playSound('laser');
                          setAiJudgeStage('analyzing');
                        }}
                        className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Analyze Proof →
                      </button>
                    </div>
                  )}

                  {aiJudgeStage === 'analyzing' && (
                    <div className="space-y-3 py-3 sm:py-4">
                      <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-full bg-cyan-500/20 border border-cyan-400 mx-auto flex items-center justify-center text-cyan-400 animate-spin">
                        <RefreshCw className="h-5 sm:h-6 w-5 sm:w-6" />
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-cyan-300 font-mono">🤖 AI VISION ANALYZING...</h4>
                      <p className="text-xs text-slate-400">Detecting form, push-up cadence, and timestamp fidelity...</p>
                      <button
                        onClick={() => {
                          playSound('levelUp');
                          setAiJudgeStage('verified');
                        }}
                        className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                      >
                        View AI Verdict →
                      </button>
                    </div>
                  )}

                  {aiJudgeStage === 'verified' && (
                    <div className="space-y-3 py-3 sm:py-4">
                      <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-full bg-emerald-500/20 border border-emerald-400 mx-auto flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                        <CheckCircle2 className="h-5 sm:h-6 w-5 sm:w-6" />
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-emerald-400">CHALLENGE VERIFIED!</h4>
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs font-mono text-emerald-200 break-words">
                        "Form verified. 20 full repetitions completed in 48 seconds. Legitimate outdoor sunset setting."
                      </div>
                      <div className="text-xs sm:text-sm font-black text-amber-300 font-mono">
                        +50 CRED TRANSFERRED TO WALLET
                      </div>
                    </div>
                  )}

                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Powered by Gemini Multimodal Vision</span>
                  <span className="text-purple-400">Zero manual disputes</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. SECTION 7: CRED / REWARDS (Earn Your Cred)                            */}
      {/* ========================================================================= */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#050509] border-b border-pink-500/10 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/40 px-3.5 py-1 text-xs font-mono font-bold text-amber-300 mb-3">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span>THE REPUTATION ECONOMY</span>
            </div>
            <h2 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white">
              EARN YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500">
                CRED.
              </span>
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-slate-300">
              Cred is your social currency. It proves you don't just talk — you do.
            </p>
          </div>

          {/* Stats & Economy Matrix */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            
            <div className="rounded-2xl border border-slate-800 bg-[#11111A] p-4 sm:p-6 text-center shadow-lg">
              <div className="flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 mx-auto mb-2.5 sm:mb-3">
                <Flame className="h-5 sm:h-6 w-5 sm:w-6" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-mono">
                {currentUser?.streak ? `${currentUser.streak} DAYS` : '7 DAYS'}
              </div>
              <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-amber-400 mt-1">
                STREAK ACTIVE
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#11111A] p-4 sm:p-6 text-center shadow-lg">
              <div className="flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-2xl bg-pink-500/20 text-pink-400 mx-auto mb-2.5 sm:mb-3">
                <Coins className="h-5 sm:h-6 w-5 sm:w-6" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-mono">
                {currentUser?.cred ? currentUser.cred.toLocaleString() : '4,250'}
              </div>
              <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-pink-400 mt-1">
                CRED EARNED
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#11111A] p-4 sm:p-6 text-center shadow-lg">
              <div className="flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto mb-2.5 sm:mb-3">
                <CheckCircle2 className="h-5 sm:h-6 w-5 sm:w-6" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-mono">
                {currentUser?.completedDaresCount !== undefined ? currentUser.completedDaresCount : '12'}
              </div>
              <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-emerald-400 mt-1">
                DARES COMPLETED
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#11111A] p-4 sm:p-6 text-center shadow-lg">
              <div className="flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 mx-auto mb-2.5 sm:mb-3">
                <Users className="h-5 sm:h-6 w-5 sm:w-6" />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-mono">
                {currentUser?.createdDaresCount !== undefined ? currentUser.createdDaresCount : '8'}
              </div>
              <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-cyan-400 mt-1">
                FRIENDS CHALLENGED
              </div>
            </div>

          </div>

          <div className="mt-8 text-center flex justify-center gap-3 sm:gap-4 flex-wrap">
            <button
              onClick={() => {
                playSound('pop');
                onOpenArmory();
              }}
              className="px-5 sm:px-6 py-3 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-300 font-bold text-xs uppercase tracking-wider hover:bg-amber-950/60 transition-all cursor-pointer"
            >
              🛡 Open Cyber Armory
            </button>
            <button
              onClick={() => {
                playSound('levelUp');
                onOpenProUpgrade();
              }}
              className="px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 transition-all cursor-pointer"
            >
              👑 Explore DARE PRO Tiers
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. SECTION 8: DARE CHAIN (Viral Social Growth)                           */}
      {/* ========================================================================= */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#0B0B12] border-b border-slate-800 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-950/40 px-3.5 py-1 text-xs font-mono font-bold text-pink-300 mb-3">
              <RefreshCw className="h-3.5 w-3.5 text-pink-400" />
              <span>THE VIRAL CHALLENGE LOOP</span>
            </div>
            <h2 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white">
              ONE DARE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-400 to-amber-300">
                CAN START A CHAIN.
              </span>
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-slate-300 font-medium">
              Challenge someone. They complete it. They challenge someone else. <br className="hidden sm:inline" />
              <strong className="text-white">HOW FAR WILL YOUR DARE GO?</strong>
            </p>
          </div>

          {/* Visual Interactive Chain Diagram */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 rounded-3xl bg-[#11111A] border border-slate-800">
            
            {/* Node 1: YOU */}
            <div className="flex-1 w-full p-4 rounded-2xl bg-[#080B14] border border-pink-500/40 text-center">
              <span className="text-[10px] font-mono text-pink-400 font-bold uppercase">ORIGINATOR</span>
              <h4 className="text-base sm:text-lg font-black text-white mt-1">YOU</h4>
              <p className="text-xs text-slate-400 mt-0.5">Launches Dare</p>
            </div>

            <div className="text-pink-400 font-black text-lg rotate-90 lg:rotate-0 shrink-0">
              <ArrowRight className="h-5 w-5" />
            </div>

            {/* Node 2: JOSH */}
            <div className="flex-1 w-full p-4 rounded-2xl bg-[#080B14] border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">COMPLETED</span>
              <h4 className="text-base sm:text-lg font-black text-white mt-1">@josh</h4>
              <p className="text-xs text-slate-400 mt-0.5">Dares Sarah</p>
            </div>

            <div className="text-amber-400 font-black text-lg rotate-90 lg:rotate-0 shrink-0">
              <ArrowRight className="h-5 w-5" />
            </div>

            {/* Node 3: SARAH */}
            <div className="flex-1 w-full p-4 rounded-2xl bg-[#080B14] border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">COMPLETED</span>
              <h4 className="text-base sm:text-lg font-black text-white mt-1">@sarah</h4>
              <p className="text-xs text-slate-400 mt-0.5">Dares Mike</p>
            </div>

            <div className="text-cyan-400 font-black text-lg rotate-90 lg:rotate-0 shrink-0">
              <ArrowRight className="h-5 w-5" />
            </div>

            {/* Node 4: MIKE */}
            <div className="flex-1 w-full p-4 rounded-2xl bg-[#080B14] border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">COMPLETED</span>
              <h4 className="text-base sm:text-lg font-black text-white mt-1">@mike</h4>
              <p className="text-xs text-slate-400 mt-0.5">Dares You Back</p>
            </div>

            <div className="text-purple-400 font-black text-lg rotate-90 lg:rotate-0 shrink-0">
              <ArrowRight className="h-5 w-5" />
            </div>

            {/* Node 5: CHAIN MULTIPLIER */}
            <div className="flex-1 w-full p-4 rounded-2xl bg-gradient-to-b from-pink-950/40 to-purple-950/40 border border-pink-500/50 text-center">
              <span className="text-[10px] font-mono text-pink-300 font-bold uppercase">CHAIN MULTIPLIER</span>
              <h4 className="text-base sm:text-lg font-black text-white mt-1">5X STREAK</h4>
              <p className="text-xs text-amber-300 mt-0.5">+25% Bonus Cred</p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. SECTION 9: COMMUNITY / REAL PEOPLE REAL DARES                         */}
      {/* ========================================================================= */}
      <section id="community-section" className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#050509] border-b border-pink-500/10 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-950/40 px-3.5 py-1 text-xs font-mono font-bold text-pink-300 mb-3">
                <Users className="h-3.5 w-3.5 text-pink-400" />
                <span>COMMUNITY ARENA</span>
              </div>
              <h2 className="text-3xl xs:text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
                REAL PEOPLE. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400">
                  REAL DARES.
                </span>
              </h2>
            </div>

            <button
              onClick={scrollToFeed}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-pink-400 hover:text-pink-300 transition-colors cursor-pointer"
            >
              <span>View All Live Grid Dares</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* High-Fidelity Community Activity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            
            {/* Card 1 */}
            <div className="rounded-2xl border border-slate-800 bg-[#11111A] p-4 sm:p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-pink-500/30 border border-pink-400 flex items-center justify-center font-bold text-xs text-pink-300">
                      A
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">@alex_dares</div>
                      <div className="text-[10px] text-slate-400">30m ago</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300">
                    ✓ VERIFIED
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#080B14] border border-slate-800/80 mb-3">
                  <span className="text-[10px] font-mono text-pink-400 uppercase font-bold">OUTDOOR MISSION</span>
                  <h5 className="text-xs sm:text-sm font-bold text-white mt-1">"Run to the highest viewpoint before sunset."</h5>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold">+100 CRED</span>
                <div className="flex items-center gap-3 text-slate-400">
                  <button 
                    onClick={() => toggleLike('c1')}
                    className={`flex items-center gap-1 hover:text-pink-400 transition-colors cursor-pointer ${likedPosts['c1'] ? 'text-pink-500' : ''}`}
                  >
                    <Heart className="h-3.5 w-3.5 fill-current" /> 42
                  </button>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> 8
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-slate-800 bg-[#11111A] p-4 sm:p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/30 border border-cyan-400 flex items-center justify-center font-bold text-xs text-cyan-300">
                      M
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">@maya_motion</div>
                      <div className="text-[10px] text-slate-400">1h ago</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300">
                    ✓ VERIFIED
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#080B14] border border-slate-800/80 mb-3">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">FITNESS BOUNTY</span>
                  <h5 className="text-xs sm:text-sm font-bold text-white mt-1">"50 Clean Push-Ups in Under 90 Seconds"</h5>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold">+75 CRED</span>
                <div className="flex items-center gap-3 text-slate-400">
                  <button 
                    onClick={() => toggleLike('c2')}
                    className={`flex items-center gap-1 hover:text-pink-400 transition-colors cursor-pointer ${likedPosts['c2'] ? 'text-pink-500' : ''}`}
                  >
                    <Heart className="h-3.5 w-3.5 fill-current" /> 58
                  </button>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> 14
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-slate-800 bg-[#11111A] p-4 sm:p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/30 border border-purple-400 flex items-center justify-center font-bold text-xs text-purple-300">
                      K
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">@kai_explorer</div>
                      <div className="text-[10px] text-slate-400">2h ago</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300">
                    ✓ VERIFIED
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#080B14] border border-slate-800/80 mb-3">
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">CREATIVE DARE</span>
                  <h5 className="text-xs sm:text-sm font-bold text-white mt-1">"Find and photograph 3 neon signs in town."</h5>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold">+60 CRED</span>
                <div className="flex items-center gap-3 text-slate-400">
                  <button 
                    onClick={() => toggleLike('c3')}
                    className={`flex items-center gap-1 hover:text-pink-400 transition-colors cursor-pointer ${likedPosts['c3'] ? 'text-pink-500' : ''}`}
                  >
                    <Heart className="h-3.5 w-3.5 fill-current" /> 31
                  </button>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> 5
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FINAL CTA: I DARE YOU.                                                */}
      {/* ========================================================================= */}
      <section className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#050509] text-center overflow-hidden">
        
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[550px] h-[300px] bg-gradient-to-r from-pink-600/20 via-purple-600/15 to-transparent rounded-full blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-4xl z-10 space-y-6 sm:space-y-8">
          
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-950/40 px-4 py-1.5 text-xs font-mono font-bold text-pink-300">
            <Flame className="h-4 w-4 text-pink-400" />
            <span>dare.me.uk</span>
          </div>

          <h2 className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter text-white drop-shadow-2xl">
            I DARE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007F] via-[#FF5533] to-[#E000B8] drop-shadow-[0_0_40px_rgba(255,0,127,0.5)]">
              YOU.
            </span>
          </h2>

          <p className="text-base sm:text-xl md:text-2xl text-slate-300 font-medium max-w-xl mx-auto">
            Your first challenge is waiting.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={() => {
                playSound('pop');
                onOpenCreateModal();
              }}
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#FF007F] via-[#FF3366] to-[#FF5533] px-8 sm:px-10 py-4 sm:py-5 text-sm sm:text-lg font-black tracking-wide text-white uppercase shadow-[0_0_35px_rgba(255,0,127,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-pink-400/40"
            >
              <Flame className="h-5 sm:h-6 w-5 sm:w-6 text-amber-200" />
              <span>🔥 START YOUR FIRST DARE</span>
            </button>

            <button
              type="button"
              onClick={scrollToFeed}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-7 sm:px-8 py-4 sm:py-5 text-sm sm:text-lg font-bold text-slate-200 hover:text-white hover:border-pink-500/50 active:scale-95 transition-all cursor-pointer"
            >
              <Compass className="h-5 sm:h-6 w-5 sm:w-6 text-pink-400" />
              <span>EXPLORE CHALLENGES</span>
            </button>
          </div>

          <div className="pt-6 space-y-2 text-xs font-mono text-slate-400">
            <p>Available on desktop & mobile · Install DARE directly from your browser</p>
            <div className="text-xs sm:text-sm font-black tracking-widest text-slate-200 uppercase pt-2">
              GOOD HABITS. BETTER FRIENDS.
            </div>
          </div>

        </div>

      </section>

    </div>
  );
};
