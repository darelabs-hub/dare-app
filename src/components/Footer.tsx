import React from 'react';
import { User, Users, Coins, ShoppingBag, Crown, PlusCircle, HelpCircle, Swords } from 'lucide-react';
import { UserProfile } from '../types';
import { DareDayLogo } from './DareDayLogo';

interface FooterProps {
  currentUser: UserProfile;
  onOpenProfile: (u: UserProfile, tab?: string) => void;
  onOpenCredLog: () => void;
  onOpenEventsMerch: () => void;
  onOpenProUpgrade: () => void;
  onOpenCreateModal: () => void;
  onOpenLegalModal: (tab: string) => void;
  onOpenTournaments?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentUser,
  onOpenProfile,
  onOpenCredLog,
  onOpenEventsMerch,
  onOpenProUpgrade,
  onOpenCreateModal,
  onOpenLegalModal,
  onOpenTournaments,
}) => {
  return (
    <footer className="mt-12 border-t border-slate-800 bg-slate-950/50 py-8 px-6 text-slate-400">
      <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand & Description - Mirrored Header Logo & Text */}
        <div className="space-y-4 md:col-span-1">
          <div 
            className="flex items-center cursor-pointer select-none shrink-0" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="DARE - Back to top"
          >
            <DareDayLogo size={40} showText={true} />
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            Decentralized peer & public challenges. Broadcast dares, submit video or photo proof, and earn verified Cred.
          </p>
        </div>

        {/* Platform & Community */}
        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Platform & Community</h3>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onOpenProfile(currentUser)} className="flex items-center gap-2 hover:text-indigo-400 transition-colors">
                <User className="h-3.5 w-3.5" /> My Profile
              </button>
            </li>
            <li>
              <button onClick={() => onOpenProfile(currentUser, 'squad')} className="flex items-center gap-2 hover:text-indigo-400 transition-colors">
                <Users className="h-3.5 w-3.5" /> My Squad
              </button>
            </li>
            {onOpenTournaments && (
              <li>
                <button onClick={onOpenTournaments} className="flex items-center gap-2 hover:text-pink-400 text-pink-300/90 transition-colors">
                  <Swords className="h-3.5 w-3.5 text-pink-400" /> Squad Wars Arena
                </button>
              </li>
            )}
            <li>
              <button onClick={onOpenCredLog} className="flex items-center gap-2 hover:text-indigo-400 transition-colors">
                <Coins className="h-3.5 w-3.5" /> Cred Log
              </button>
            </li>
          </ul>
        </div>

        {/* Dare Activities */}
        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Activities</h3>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={onOpenCreateModal} className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                <PlusCircle className="h-3.5 w-3.5" /> Create Dare
              </button>
            </li>
            <li>
              <button onClick={onOpenEventsMerch} className="flex items-center gap-2 hover:text-pink-400 transition-colors">
                <ShoppingBag className="h-3.5 w-3.5" /> Merch & Events
              </button>
            </li>
          </ul>
        </div>

        {/* Pro, Legal & Support */}
        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Legal &amp; Support</h3>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={onOpenProUpgrade} className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                <Crown className="h-3.5 w-3.5" /> {currentUser.isPro ? 'Manage PRO' : 'Upgrade to PRO'}
              </button>
            </li>
            <li>
              <button onClick={() => onOpenLegalModal('faq')} className="flex items-center gap-2 hover:text-indigo-400 transition-colors">
                <HelpCircle className="h-3.5 w-3.5" /> FAQ &amp; Codex
              </button>
            </li>
            <li>
              <a 
                href="/privacy" 
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', '/privacy');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="flex items-center gap-2 hover:text-pink-400 transition-colors text-slate-400"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-pink-500"></span>
                Privacy Policy
              </a>
            </li>
            <li>
              <a 
                href="/terms" 
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', '/terms');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="flex items-center gap-2 hover:text-pink-400 transition-colors text-slate-400"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-pink-500"></span>
                Terms of Service
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-5xl mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
        <div>
          &copy; 2026 DARE DAY LABS. ALL RIGHTS RESERVED. ALL DARES ARE UNDERTAKEN VOLUNTARILY AND AT PARTICIPANT RISK.
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <a 
            href="/privacy" 
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, '', '/privacy');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="hover:text-pink-400 transition-colors underline-offset-4 hover:underline"
          >
            Privacy Policy
          </a>
          <span>&bull;</span>
          <a 
            href="/terms" 
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, '', '/terms');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="hover:text-pink-400 transition-colors underline-offset-4 hover:underline"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
};
