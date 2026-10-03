import React, { useState, useEffect, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { 
  X, 
  Sparkles, 
  Coins, 
  Loader2, 
  Check, 
  Download, 
  ShieldCheck, 
  ArrowLeft,
  LockKeyhole
} from 'lucide-react';
import { UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';
import { auth, getSafeIdToken } from '../lib/firebase';

export interface CredPack {
  id: string;
  name: string;
  tagline: string;
  priceUSD: string;
  pricePence: number;
  credAmount: number;
  bonusCred: number;
  totalCred: number;
  popular?: boolean;
  bestValue?: boolean;
  badge?: string;
  icon: string;
  imageUrl: string;
}

export const CRED_PACKS: CredPack[] = [
  {
    id: 'dare_cred_pack_150',
    name: 'Starter Pack',
    tagline: 'Instant micro top-up for custom dares',
    priceUSD: '£0.99',
    pricePence: 99,
    credAmount: 150,
    bonusCred: 0,
    totalCred: 150,
    icon: '⚡',
    imageUrl: '/assets/products/cred_starter_pack.png',
  },
  {
    id: 'dare_cred_pack_550',
    name: 'Booster Pack',
    tagline: '+10% Extra Bonus Cred Included',
    priceUSD: '£2.99',
    pricePence: 299,
    credAmount: 500,
    bonusCred: 50,
    totalCred: 550,
    badge: '+10% BONUS',
    icon: '🔥',
    imageUrl: '/assets/products/cred_booster_pack.png',
  },
  {
    id: 'dare_cred_pack_1250',
    name: 'Popular Creator Pack',
    tagline: 'Most chosen by creators & active members',
    priceUSD: '£4.99',
    pricePence: 499,
    credAmount: 1000,
    bonusCred: 250,
    totalCred: 1250,
    popular: true,
    badge: 'MOST POPULAR (+25%)',
    icon: '💎',
    imageUrl: '/assets/products/cred_creator_pack.png',
  },
  {
    id: 'dare_cred_pack_3350',
    name: 'Influencer Pack',
    tagline: '+35% Extra Value for regular challenge creators',
    priceUSD: '£9.99',
    pricePence: 999,
    credAmount: 2500,
    bonusCred: 850,
    totalCred: 3350,
    bestValue: true,
    badge: 'BEST VALUE (+35%)',
    icon: '🚀',
    imageUrl: '/assets/products/cred_influencer_pack.png',
  },
];

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpgradeSuccess: (updatedUser: UserProfile) => void;
  onSignIn?: () => Promise<any> | void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpgradeSuccess,
  onSignIn,
}) => {
  const [selectedPackId, setSelectedPackId] = useState<string>('dare_cred_pack_1250');
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [purchasedPack, setPurchasedPack] = useState<CredPack | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePubKey, setStripePubKey] = useState<string | null>(
    'pk_live_51UIK8o0wKAq7nsDNLXavy6cMWFGVnDG95M6PoIbYGpsJtsT1Jehrjo9u7AUWn0YQPpbJECuzsnhrRTvMOlW8Jzpo00MUAjbAMf'
  );

  // Initialize and memoize Stripe Promise
  const stripePromise = useMemo(() => {
    if (!stripePubKey) return null;
    return loadStripe(stripePubKey);
  }, [stripePubKey]);

  const isFirebaseAuthenticated = Boolean(
    auth.currentUser && !auth.currentUser.isAnonymous && currentUser.id !== 'guest' && !currentUser.id.startsWith('guest_')
  );

  // Prefetch Stripe configuration on mount
  useEffect(() => {
    if (isOpen) {
      fetch('/api/stripe/status')
        .then(res => res.json())
        .then(data => {
          if (data.publishableKey) {
            setStripePubKey(data.publishableKey);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Reset view state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
      setError(null);
      setSuccess(false);
      setPurchasedPack(null);
      setLoadingPackId(null);
      setPurchasing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activePack = CRED_PACKS.find(p => p.id === selectedPackId) || CRED_PACKS[2];

  // Immediately open internal Stripe checkout on click
  const handleOpenCheckout = async (pack: CredPack) => {
    setSelectedPackId(pack.id);
    setLoadingPackId(pack.id);
    setError(null);
    setPurchasing(true);
    playSound('click');

    try {
      const token = await getSafeIdToken(auth.currentUser);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          embedded: true,
          itemId: pack.id,
          userId: currentUser.id,
          userEmail: auth.currentUser?.email || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          if (data.publishableKey) {
            setStripePubKey(data.publishableKey);
          }
          playSound('purchase');
          return;
        }
      }

      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to initialize secure Stripe checkout session.');
    } catch (err: any) {
      console.error('Stripe checkout session error:', err);
      setError(err.message || 'Unable to start Stripe checkout session. Please try again.');
    } finally {
      setPurchasing(false);
      setLoadingPackId(null);
    }
  };

  const handleDownloadReceipt = () => {
    if (!purchasedPack) return;
    const content = `=========================================
DARE CRED PACK PURCHASE RECEIPT
=========================================
Date: ${new Date().toLocaleString()}
Account: ${currentUser.name} (${currentUser.handle})
Cred Pack: ${purchasedPack.name}
Base Cred: ${purchasedPack.credAmount.toLocaleString()} CR
Bonus Cred: +${purchasedPack.bonusCred.toLocaleString()} CR
Total Cred Credited: ${purchasedPack.totalCred.toLocaleString()} CR
Amount Paid: ${purchasedPack.priceUSD}
Payment Status: VERIFIED
Reference ID: TX-${Date.now().toString(36).toUpperCase()}
=========================================
Thank you for backing real-world challenges!
DARE Community`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DARE_Receipt_${purchasedPack.id}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isCheckoutActive = Boolean(!success && clientSecret);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playSound('pop');
          onClose();
        }
      }}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-3xl border border-slate-800 bg-[#090D15] text-slate-100 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-5 sm:px-6 py-3.5 bg-[#070A10] shrink-0 z-10">
          <div className="flex items-center gap-3">
            {isCheckoutActive ? (
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setClientSecret(null);
                  setError(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Cred Packs</span>
              </button>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                <Coins className="h-5 w-5 text-amber-400" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white font-tech">
                  {isCheckoutActive ? 'Stripe Checkout' : 'Cred Coin Packs'}
                </h2>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.2 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/30 uppercase">
                  In-App
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isCheckoutActive 
                  ? 'Official encrypted checkout with all payment methods (Apple Pay, Google Pay, Cards, Link)'
                  : 'Click any pack to open Stripe Checkout instantly without leaving the app.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Balance Pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <div className="text-right">
                <div className="text-[9px] text-slate-500 font-semibold uppercase font-mono">Balance</div>
                <div className="text-xs font-bold text-amber-300 font-mono">{currentUser.cred.toLocaleString()} CR</div>
              </div>
            </div>

            <button
              onClick={() => {
                playSound('pop');
                onClose();
              }}
              className="p-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 overscroll-contain">
          
          {/* Guest Account Notice */}
          {!isFirebaseAuthenticated && !isCheckoutActive && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-3 sm:p-3.5 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shrink-0" />
                <p className="text-slate-300 text-[11px]">
                  Sign in with Google to permanently link your Cred purchases to your account.
                </p>
              </div>
              {onSignIn && (
                <button
                  type="button"
                  onClick={async () => {
                    playSound('click');
                    if (onSignIn) await onSignIn();
                  }}
                  className="shrink-0 px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          )}

          {/* Success Banner */}
          {success && purchasedPack && (
            <div className="rounded-3xl border border-emerald-500/40 bg-emerald-950/30 p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="mx-auto h-20 w-20 rounded-2xl overflow-hidden mb-3 border border-emerald-500/40 shadow-lg bg-slate-950">
                <img
                  src={purchasedPack.imageUrl}
                  alt={purchasedPack.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30 mb-2">
                <Check className="h-3.5 w-3.5" />
                <span>Payment Successful & Verified</span>
              </div>

              <h3 className="text-xl font-black text-white font-tech">
                +{purchasedPack.totalCred.toLocaleString()} Cred Added!
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                Thank you! Your balance is now <strong className="text-amber-300">{currentUser.cred.toLocaleString()} CR</strong>.
              </p>

              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-[10px] uppercase font-mono text-rose-300 hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* VIEW A: OFFICIAL STRIPE EMBEDDED CHECKOUT (Rendered Internally Without Redirection) */}
          {!success && clientSecret && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Product Header Card for Checkout */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="h-14 w-14 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0 shadow-sm">
                    <img 
                      src={activePack.imageUrl} 
                      alt={activePack.name} 
                      className="h-full w-full object-cover" 
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white font-tech">{activePack.name}</span>
                      {activePack.badge && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-mono font-bold border border-cyan-800/40">
                          {activePack.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-amber-300 font-semibold flex items-center gap-1 mt-0.5 font-mono">
                      <Coins className="h-3.5 w-3.5 text-amber-400" />
                      <span>{activePack.totalCred.toLocaleString()} Cred Coins</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{activePack.tagline}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-white font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    {activePack.priceUSD}
                  </span>
                </div>
              </div>

              {/* Official Stripe Embedded Checkout Frame */}
              <div className="min-h-[480px] rounded-2xl border border-slate-800 bg-[#0C1019] p-2 sm:p-3 overflow-hidden shadow-inner">
                {stripePromise ? (
                  <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={{ clientSecret }}
                  >
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                ) : (
                  <div className="flex flex-col h-72 items-center justify-center text-slate-400 gap-3">
                    <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
                    <p className="text-xs font-mono">Opening secure Stripe payment session...</p>
                  </div>
                )}
              </div>

              {/* Security & Multi-Payment Guarantee */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono text-center">
                <LockKeyhole className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Encrypted in-app Stripe checkout · Apple Pay, Google Pay, Link, and all major cards supported.</span>
              </div>
            </div>
          )}

          {/* VIEW B: CRED COIN PACKS GRID (Clicking any pack opens internal Stripe Checkout) */}
          {!success && !clientSecret && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Select a Pack to Checkout
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Instant Stripe Checkout
                </span>
              </div>

              {/* 4 Clean Minimalist Pack Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CRED_PACKS.map((pack) => {
                  const isLoadingThisPack = purchasing && loadingPackId === pack.id;

                  return (
                    <button
                      key={pack.id}
                      type="button"
                      disabled={purchasing}
                      onClick={() => handleOpenCheckout(pack)}
                      className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 cursor-pointer text-left group ${
                        pack.popular
                          ? 'border-cyan-400/80 bg-slate-900/80 hover:bg-slate-900 hover:border-cyan-300 ring-1 ring-cyan-400/30'
                          : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/60'
                      } ${isLoadingThisPack ? 'opacity-70 pointer-events-none' : ''}`}
                    >
                      {/* Top Badge */}
                      {pack.badge && (
                        <span className={`absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider shadow-sm border ${
                          pack.popular 
                            ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                            : 'bg-slate-800 text-amber-300 border-amber-500/40'
                        }`}>
                          {pack.badge}
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-3">
                            {/* Metallic Coin Thumbnail */}
                            <div className="relative h-13 w-13 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                              <img
                                src={pack.imageUrl}
                                alt={pack.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-white font-tech group-hover:text-cyan-300 transition-colors">
                                {pack.name}
                              </h4>
                              <div className="text-xs font-black text-amber-400 flex items-center gap-1 mt-0.5 font-mono">
                                <Coins className="h-3.5 w-3.5 text-amber-400" />
                                <span>{pack.totalCred.toLocaleString()} Cred</span>
                                {pack.bonusCred > 0 && (
                                  <span className="text-[10px] text-emerald-400 font-normal">
                                    (+{pack.bonusCred})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-sm font-black text-white font-mono">{pack.priceUSD}</span>
                            <div className="text-[10px] text-slate-500">One-off</div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                          {pack.tagline}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">
                          {pack.totalCred.toLocaleString()} Coins
                        </span>
                        <span className="text-xs font-bold text-cyan-400 group-hover:text-white flex items-center gap-1 transition-colors">
                          {isLoadingThisPack ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Opening Stripe...</span>
                            </>
                          ) : (
                            <>
                              <span>Checkout {pack.priceUSD}</span>
                              <span>→</span>
                            </>
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* What can you do with Cred? */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-4 space-y-2 text-xs">
                <h5 className="font-semibold text-white flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-300">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  What can you do with Cred?
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5">
                    <div className="font-bold text-white mb-0.5">🎯 Fund Custom Dares</div>
                    <p className="text-slate-400 text-[10px] leading-relaxed">Create community challenges with real Cred bounties.</p>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5">
                    <div className="font-bold text-white mb-0.5">🔥 Back Challenge Pots</div>
                    <p className="text-slate-400 text-[10px] leading-relaxed">Contribute to open pots and back daring participants.</p>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5">
                    <div className="font-bold text-white mb-0.5">🛍️ Rewards Store</div>
                    <p className="text-slate-400 text-[10px] leading-relaxed">Unlock profile badges, highlights, and perks.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer (When not in checkout) */}
        {!success && !isCheckoutActive && (
          <div className="border-t border-slate-800/90 px-5 sm:px-6 py-3 bg-[#070A10] flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span className="font-mono text-[11px]">
              Tap any pack to pay securely via Stripe
            </span>
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <LockKeyhole className="h-3.5 w-3.5 text-emerald-400" />
              <span>Apple Pay · Google Pay · Cards</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export const CredPacksModal = ProUpgradeModal;
