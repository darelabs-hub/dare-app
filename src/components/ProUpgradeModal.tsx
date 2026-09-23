import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  Coins, 
  CreditCard, 
  Award, 
  Crown, 
  Lock, 
  Unlock, 
  Loader2, 
  AlertTriangle,
  Flame,
  Check,
  Download,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { UserProfile, ProTier } from '../types';
import { playSound } from '../utils/soundEffects';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpgradeSuccess: (updatedUser: UserProfile) => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpgradeSuccess,
}) => {
  const [selectedTier, setSelectedTier] = useState<ProTier>('elite');
  const [paymentMode, setPaymentMode] = useState<'cred' | 'card'>('card');
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Simulated Card State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [downloadReceipt, setDownloadReceipt] = useState(false);

  if (!isOpen) return null;

  const tiers = [
    {
      id: 'runner' as ProTier,
      name: 'Pro Lite',
      tagline: 'PRO STATUS LITE — BUDGET FRIENDLY',
      priceCred: 2500,
      priceUSD: '$0.99/mo',
      color: 'border-slate-800 text-slate-200 bg-slate-900/40',
      badge: '⚡ Pro Lite',
      icon: <Zap className="h-5 w-5 text-indigo-400" />,
      features: [
        'Exclusive Gold "PRO" Badge',
        'Daily Stipend Multiplier (200 CR)',
        'Basic Custom Dare Creation'
      ]
    },
    {
      id: 'elite' as ProTier,
      name: 'Pro Elite',
      tagline: 'MOST POPULAR — BEST VALUE',
      priceCred: 5000,
      priceUSD: '$1.99/mo',
      color: 'border-indigo-500 bg-indigo-500/5 text-indigo-400 ring-2 ring-indigo-500/20',
      badge: '💎 Pro Elite',
      icon: <Sparkles className="h-5 w-5 text-indigo-400" />,
      features: [
        'Exclusive Gold "PRO" Badge',
        'AI Challenge Oracle (Smart Custom Prompts)',
        'Premium Card Highlights & Accents',
        'Daily Stipend Multiplier (300 CR)',
        'Streak Protection (12-hour grace period)'
      ],
      popular: true
    },
    {
      id: 'overlord' as ProTier,
      name: 'Pro Ultra',
      tagline: 'ULTIMATE UNRESTRICTED — FULL UNLOCK',
      priceCred: 12000,
      priceUSD: '$3.99/mo',
      color: 'border-amber-500 text-amber-400 bg-amber-500/5 ring-2 ring-amber-500/20',
      badge: '👑 Pro Ultra',
      icon: <Crown className="h-5 w-5 text-amber-400" />,
      features: [
        'Exclusive Gold "PRO" Badge + Crown Icon',
        'AI Challenge Oracle (Custom Prompts & Unlimited Uses)',
        'Priority Badge & Custom Card Accent Styles',
        'Daily Stipend Multiplier (450 CR)',
        'Immediate 250 CR Sign-up Bonus',
        'Priority community voting weight (x3 power)'
      ]
    }
  ];

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUpgrading(true);
    playSound('oracle');

    const selectedTierDetails = tiers.find(t => t.id === selectedTier);
    if (!selectedTierDetails) return;

    if (paymentMode === 'cred' && currentUser.cred < selectedTierDetails.priceCred) {
      setError(`Insufficient cred! You need ${selectedTierDetails.priceCred} CR, but you currently have ${currentUser.cred} CR.`);
      setUpgrading(false);
      playSound('error');
      return;
    }

    if (paymentMode === 'card') {
      if (!cardNumber || !expiry || !cvv || !cardName) {
        setError('Billing verification failed. All credit card fields are required.');
        setUpgrading(false);
        playSound('error');
        return;
      }
      if (cardNumber.replace(/\s+/g, '').length < 16) {
        setError('Credit card verification failure: Must be a complete 16-digit card number.');
        setUpgrading(false);
        playSound('error');
        return;
      }

      // Execute Stripe PaymentIntent
      const usdNumeric = Number(selectedTierDetails.priceUSD.replace(/[^0-9.]/g, '')) || 1.99;
      try {
        const piRes = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: usdNumeric,
            currency: 'usd',
            description: `DARE PRO Subscription - ${selectedTierDetails.name}`,
            userId: currentUser.id
          }),
        });
        const piData = await piRes.json();
        if (!piRes.ok) throw new Error(piData.error || 'Stripe payment intent creation failed');
      } catch (stripeErr: any) {
        setError(stripeErr.message || 'Stripe payment error');
        setUpgrading(false);
        playSound('error');
        return;
      }
    }

    try {
      // Hit the official backend upgrade-pro API endpoint
      const response = await fetch(`/api/users/${currentUser.id}/upgrade-pro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tier: selectedTier,
          paymentMode,
          mockCard: paymentMode === 'card' ? { name: cardName } : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Network upgrade failed');
      }

      const updatedUser = await response.json();
      
      // Upgrade is a massive visual success!
      setSuccess(true);
      playSound('complete');
      onUpgradeSuccess(updatedUser);
    } catch (err: any) {
      setError(err.message || 'Error occurred when transmitting pro package registration.');
      playSound('error');
    } finally {
      setUpgrading(false);
    }
  };

  const handleCardNumberChange = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(v);
    }
  };

  const currentTierData = tiers.find(t => t.id === selectedTier);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="pro-upgrade-modal-container"
        className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Simple ambient glows */}
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10">
              <Crown className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                PREMIUM <span className="text-indigo-400">PRO MEMBERSHIP</span>
              </h2>
              <p className="text-xs text-slate-400">
                Unlock advanced AI challenge tools, premium accents, and ultimate balance yield boosts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        {!success ? (
          <div className="relative mt-5 grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Hand: Tier Choices (7 Cols) */}
            <div className="md:col-span-7 flex flex-col gap-3">
              <div className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider mb-1">
                Select Your Premium Pro Tier:
              </div>
              <div className="grid grid-cols-1 gap-3">
                {tiers.map((t) => {
                  const isSelected = selectedTier === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTier(t.id);
                        playSound('click');
                      }}
                      className={`relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                        isSelected 
                          ? t.id === 'overlord'
                            ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20'
                            : t.id === 'runner'
                              ? 'border-slate-700 bg-slate-800/40 ring-2 ring-slate-700/20'
                              : 'border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/20'
                          : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50'
                      }`}
                    >
                      {t.popular && (
                        <span className="absolute -top-2.5 right-4 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider border border-indigo-400">
                          Recommended
                        </span>
                      )}
                      
                      <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border ${
                        isSelected 
                          ? t.id === 'overlord' ? 'border-amber-500/30 bg-amber-500/10' : t.id === 'runner' ? 'border-slate-700/30 bg-slate-800/10' : 'border-indigo-500/30 bg-indigo-500/10'
                          : 'border-slate-800 bg-slate-950'
                      }`}>
                        {t.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white tracking-tight">
                            {t.name}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-200">
                            {paymentMode === 'cred' ? `${t.priceCred} CR` : t.priceUSD}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono font-semibold text-slate-400 mt-0.5 uppercase tracking-wide">
                          {t.tagline}
                        </p>
                        
                        {/* Highlights (Short bullet overview) */}
                        <div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-300 font-mono">
                          {t.features.slice(0, 3).map((f, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                              <span className="truncate">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Advanced Features Locked Checklist */}
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/20 p-3.5">
                <h4 className="text-[11px] font-mono text-indigo-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Unlock className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Included Features Detail ({currentTierData?.name})</span>
                </h4>
                <div className="space-y-1.5">
                  {currentTierData?.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="mt-0.5 rounded-full bg-emerald-950/80 p-0.5 text-emerald-400 border border-emerald-500/20">
                        <Check className="h-2.5 w-2.5 text-emerald-400" />
                      </span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Hand: Checkout / Payment Interface (5 Cols) */}
            <div className="md:col-span-5 flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4 relative">
              <form onSubmit={handleUpgrade} className="space-y-4">
                <div className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                  Payment Method:
                </div>

                {/* Tab switcher for payment mode */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-lg border border-slate-800 bg-slate-900/60">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('card');
                      playSound('click');
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold font-mono transition-all relative ${
                      paymentMode === 'card'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Card Checkout</span>
                    <span className="absolute -top-2 -right-1 bg-emerald-500 text-[8px] font-bold text-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter shadow">
                      Recommended
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('cred');
                      playSound('click');
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold font-mono transition-all ${
                      paymentMode === 'cred'
                        ? 'bg-[#1e293b] border border-indigo-500/30 text-indigo-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Coins className="h-3.5 w-3.5" />
                    <span>In-Game Creds</span>
                  </button>
                </div>

                {/* Cred checkout display */}
                {paymentMode === 'cred' && (
                  <div className="space-y-3 py-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/5 mx-auto">
                      <Coins className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Available Cred Balance</p>
                      <p className="font-mono text-lg font-bold text-amber-300">
                        {currentUser.cred} <span className="text-xs text-amber-500">CR</span>
                      </p>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 border border-slate-800 bg-slate-900/40 p-2.5 rounded-lg space-y-1 text-left">
                      <p className="flex justify-between">
                        <span>Grind Requirement:</span>
                        <span className="text-white font-bold">{currentTierData?.priceCred.toLocaleString()} CR</span>
                      </p>
                      <p className="flex justify-between border-t border-slate-800/80 pt-1 font-bold">
                        <span>Balance Deficit / Status:</span>
                        <span className={currentUser.cred - (currentTierData?.priceCred || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {currentUser.cred - (currentTierData?.priceCred || 0) >= 0
                            ? `Eligible (${currentUser.cred - (currentTierData?.priceCred || 0)} CR remaining)`
                            : `Need ${(currentTierData?.priceCred || 0) - currentUser.cred} more CR`}
                        </span>
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono italic">
                      Tip: Instant Card activation costs only {currentTierData?.priceUSD} and bypasses the {currentTierData?.priceCred.toLocaleString()} CR grind.
                    </p>
                  </div>
                )}

                {/* Credit Card checkout Form */}
                {paymentMode === 'card' && (
                  <div className="space-y-2.5 text-xs animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ALEX MORGAN"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs text-white focus:border-indigo-500/50 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">
                        Credit Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="•••• •••• •••• ••••"
                        maxLength={19}
                        required
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs font-mono text-white focus:border-indigo-500/50 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">
                          Expiration Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          required
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs font-mono text-white focus:border-indigo-500/50 focus:outline-none text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">
                          Secure CVV
                        </label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength={4}
                          required
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs font-mono text-white focus:border-indigo-500/50 focus:outline-none text-center"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 pt-1">
                      <input
                        type="checkbox"
                        id="receipt-checkbox"
                        checked={downloadReceipt}
                        onChange={(e) => setDownloadReceipt(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-900 text-indigo-500 focus:ring-0"
                      />
                      <label htmlFor="receipt-checkbox" className="text-[10px] text-slate-400 font-mono cursor-pointer select-none">
                        Save local receipt document
                      </label>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="rounded-lg border border-rose-500/20 bg-rose-950/30 p-2.5 text-[11px] text-rose-300 flex items-start gap-1.5 font-mono">
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Checkout CTA */}
                <button
                  type="submit"
                  disabled={upgrading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white shadow-md transition-all bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
                >
                  {upgrading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying Payment...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>
                        Authorize {paymentMode === 'card' ? currentTierData?.priceUSD : `${currentTierData?.priceCred} CR`}
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Direct Sales Reassurance Banner */}
              <div className="mt-3.5 p-2.5 rounded-lg border border-indigo-500/20 bg-indigo-950/20 text-[10px] text-indigo-300 font-mono leading-normal">
                <div className="flex items-center gap-1 font-bold uppercase tracking-wider text-indigo-200 mb-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Instant Pro Activation • 7-Day Risk Free</span>
                </div>
                <p>
                  Card upgrades start at just {currentTierData?.priceUSD} and include a **7-Day Free Trial** with instant perks. In-game Cred redemptions require {currentTierData?.priceCred.toLocaleString()} CR from gameplay grinding.
                </p>
              </div>

              {/* Secure transaction stamp */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[9px] text-slate-500 font-mono text-center select-none uppercase">
                <Lock className="h-3 w-3 text-slate-600" />
                <span>Secure Checkout • SSL Encrypted</span>
              </div>
            </div>

          </div>
        ) : (
          /* Success Screen */
          <div className="mt-6 flex flex-col items-center justify-center py-10 text-center animate-fade-in relative z-10">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 mb-4">
              <Unlock className="h-10 w-10 text-emerald-400" />
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border border-black animate-ping" />
            </div>

            <h3 className="text-2xl font-bold text-white tracking-tight">
              PREMIUM PRO <span className="text-emerald-400">MEMBERSHIP ACTIVE</span>
            </h3>
            
            <p className="mt-2 text-sm text-slate-300 max-w-lg font-mono">
              Congratulations! Your account has been upgraded to <strong className="text-white uppercase font-bold">{currentTierData?.name}</strong>. Your premium benefits are now active.
            </p>

            <div className="mt-6 p-4 rounded-xl border border-slate-800 bg-slate-900/40 max-w-md w-full space-y-3 font-mono text-xs text-left">
              <div className="text-indigo-400 font-bold uppercase border-b border-slate-800 pb-1.5 text-[10px] tracking-wider flex items-center justify-between">
                <span>Subscription Details</span>
                <span className="text-emerald-400">STATUS: ACTIVE</span>
              </div>
              <div className="space-y-1 text-slate-300">
                <p className="flex justify-between">
                  <span>Identity Handle:</span>
                  <span className="text-white">{currentUser.handle}</span>
                </p>
                <p className="flex justify-between">
                  <span>Active Pro Tier:</span>
                  <span className="text-indigo-400 uppercase font-semibold">{currentTierData?.name}</span>
                </p>
                <p className="flex justify-between">
                  <span>Authorized Cost:</span>
                  <span className="text-white">
                    {paymentMode === 'card' ? currentTierData?.priceUSD : `${currentTierData?.priceCred} CR`}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Expiry Date:</span>
                  <span className="text-slate-400">
                    {new Date(Date.now() + 30 * 86400000).toLocaleDateString()} (Auto-Renew)
                  </span>
                </p>
              </div>
            </div>

            {/* Receipt Compile Action */}
            {paymentMode === 'card' && downloadReceipt && (
              <button
                type="button"
                onClick={() => {
                  playSound('laser');
                  const text = `====================================
CHALLENGE PRO RECEIPT
====================================
Transaction ID: tx_pro_${Date.now()}
Identity: ${currentUser.handle}
Tier Status: ${currentTierData?.name}
Amount: ${currentTierData?.priceUSD}
Date: ${new Date().toISOString()}
Payment Status: VERIFIED
====================================`;
                  const blob = new Blob([text], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Pro_Receipt_${currentUser.handle.substring(1)}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs text-slate-300 hover:border-indigo-500/40 hover:text-indigo-300 transition-colors font-mono"
              >
                <Download className="h-3.5 w-3.5 text-indigo-400" />
                <span>Save receipt.txt</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="mt-6 flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-all"
            >
              <span>Return to Main Feed</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
