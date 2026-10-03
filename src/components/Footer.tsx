import React from 'react';
import { User, Users, Coins, PlusCircle, HelpCircle, Swords, Shield, Heart, FileText } from 'lucide-react';
import { UserProfile } from '../types';
import { DareDayLogo } from './DareDayLogo';
import { playSound } from '../utils/soundEffects';

interface FooterProps {
  currentUser: UserProfile;
  onOpenProfile: (u: UserProfile, tab?: string) => void;
  onOpenCredLog: () => void;
  onOpenProUpgrade: () => void;
  onOpenCreateModal: () => void;
  onOpenLegalModal: (tab: string) => void;
  onOpenTournaments?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentUser,
  onOpenProfile,
  onOpenCredLog,
  onOpenProUpgrade,
  onOpenCreateModal,
  onOpenLegalModal,
  onOpenTournaments,
}) => {
  return (
    <footer className="hidden md:block w-full mt-14 border-t border-white/[0.08] bg-[#0A0B10]/95 backdrop-blur-2xl pt-10 pb-28 sm:pb-12 px-4 sm:px-6 lg:px-8 text-slate-400">
      <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
        
        {/* Brand Column with Crown + DARE Logo */}
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <div 
            className="inline-flex items-center gap-3 cursor-pointer select-none shrink-0 group" 
            onClick={() => {
              playSound('click');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            title="DARE - Back to top"
          >
            <DareDayLogo size={52} variant="emblem" />
          </div>
          <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
            Peer-to-peer real world challenges. Broadcast dares, submit video or photo proof, level up ranks, and bank verified Cred.
          </p>
          <div className="flex items-center gap-2 text-xs font-mono text-pink-400 font-semibold">
            <span className="h-2 w-2 rounded-full bg-[#FF00E6] animate-pulse" />
            <span>dare.me.uk</span>
          </div>
        </div>

        {/* Platform & Community */}
        <div className="space-y-3.5">
          <h4 className="font-black text-white text-xs uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            Platform & Community
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <button 
                onClick={() => {
                  playSound('click');
                  onOpenProfile(currentUser);
                }} 
                className="flex items-center gap-2 hover:text-[#FF00E6] transition-colors cursor-pointer text-slate-300"
              >
                <User className="h-3.5 w-3.5 text-pink-400" /> My Profile
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  playSound('click');
                  onOpenProfile(currentUser, 'squad');
                }} 
                className="flex items-center gap-2 hover:text-[#FF00E6] transition-colors cursor-pointer text-slate-300"
              >
                <Users className="h-3.5 w-3.5 text-purple-400" /> My Squad
              </button>
            </li>
            {onOpenTournaments && (
              <li>
                <button 
                  onClick={() => {
                    playSound('click');
                    onOpenTournaments();
                  }} 
                  className="flex items-center gap-2 hover:text-pink-300 text-pink-400 font-semibold transition-colors cursor-pointer"
                >
                  <Swords className="h-3.5 w-3.5 text-pink-400" /> Squad Wars Arena
                </button>
              </li>
            )}
            <li>
              <button 
                onClick={() => {
                  playSound('click');
                  onOpenCredLog();
                }} 
                className="flex items-center gap-2 hover:text-amber-300 transition-colors cursor-pointer text-slate-300"
              >
                <Coins className="h-3.5 w-3.5 text-amber-400" /> Cred Economy Log
              </button>
            </li>
          </ul>
        </div>

        {/* Dare Activities */}
        <div className="space-y-3.5">
          <h4 className="font-black text-white text-xs uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            Actions & Play
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <button 
                onClick={() => {
                  playSound('pop');
                  onOpenCreateModal();
                }} 
                className="flex items-center gap-2 hover:text-emerald-300 text-emerald-400 font-semibold transition-colors cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5 text-emerald-400" /> Broadcast New Dare
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  playSound('purchase');
                  onOpenProUpgrade();
                }} 
                className="flex items-center gap-2 hover:text-amber-300 text-amber-300 transition-colors cursor-pointer"
              >
                <Coins className="h-3.5 w-3.5 text-amber-400" /> Get Cred Coins
              </button>
            </li>
          </ul>
        </div>

        {/* Support & Legal */}
        <div className="space-y-3.5">
          <h4 className="font-black text-white text-xs uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            FAQ & Support
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <button 
                onClick={() => {
                  playSound('click');
                  onOpenLegalModal('faq');
                }} 
                className="flex items-center gap-2 hover:text-pink-400 transition-colors cursor-pointer text-slate-300"
              >
                <HelpCircle className="h-3.5 w-3.5 text-pink-400" /> FAQ
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  playSound('click');
                  onOpenLegalModal('privacy');
                }} 
                className="flex items-center gap-2 hover:text-pink-400 transition-colors cursor-pointer text-slate-300"
              >
                <Shield className="h-3.5 w-3.5 text-purple-400" /> Privacy Policy
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  playSound('click');
                  onOpenLegalModal('terms');
                }} 
                className="flex items-center gap-2 hover:text-pink-400 transition-colors cursor-pointer text-slate-300"
              >
                <FileText className="h-3.5 w-3.5 text-amber-400" /> Terms of Service
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-6xl mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span>&copy; 2026 DARE LABS. ALL RIGHTS RESERVED.</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <button 
            onClick={() => {
              playSound('click');
              onOpenLegalModal('faq');
            }}
            className="hover:text-pink-400 transition-colors underline-offset-4 hover:underline cursor-pointer"
          >
            FAQ
          </button>
          <span>&bull;</span>
          <button 
            onClick={() => {
              playSound('click');
              onOpenLegalModal('privacy');
            }}
            className="hover:text-pink-400 transition-colors underline-offset-4 hover:underline cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>&bull;</span>
          <button 
            onClick={() => {
              playSound('click');
              onOpenLegalModal('terms');
            }}
            className="hover:text-pink-400 transition-colors underline-offset-4 hover:underline cursor-pointer"
          >
            Terms of Service
          </button>
        </div>
      </div>
    </footer>
  );
};
