import React, { useState, useEffect } from 'react';
import { 
  X, 
  Zap, 
  Sparkles, 
  Shield, 
  Crown, 
  Check, 
  ShoppingBag, 
  Flame, 
  Package, 
  Radio, 
  Eye, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Coins,
  RefreshCw
} from 'lucide-react';
import { ArmoryItem, InventoryItem, ActiveBooster, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';
import { trackEvent } from '../utils/analytics';

interface CyberArmoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserUpdate: (updatedUser: UserProfile) => void;
  onOpenStipendOrPro?: () => void;
}

export const CyberArmoryModal: React.FC<CyberArmoryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  onOpenStipendOrPro,
}) => {
  const [activeTab, setActiveTab] = useState<'boosters' | 'cosmetics' | 'titles' | 'inventory'>('boosters');
  const [items, setItems] = useState<ArmoryItem[]>([]);
  const [jackpotPool, setJackpotPool] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchArmoryCatalog();
    }
  }, [isOpen]);

  const fetchArmoryCatalog = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/armory/items');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        if (typeof data.jackpotPool === 'number') setJackpotPool(data.jackpotPool);
      }
    } catch (err) {
      console.error('Failed to load armory items', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handlePurchase = async (item: ArmoryItem) => {
    if (currentUser.cred < item.priceCred) {
      setActionFeedback(`Insufficient Cred balance (${currentUser.cred} CR). Need ${item.priceCred} CR.`);
      playSound('error');
      setTimeout(() => setActionFeedback(null), 4000);
      return;
    }

    try {
      setPurchasingId(item.id);
      const res = await fetch('/api/armory/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          itemId: item.id,
          quantity: 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionFeedback(data.error || 'Requisition failed');
        playSound('error');
      } else {
        onUserUpdate(data.user);
        playSound('purchase');
        setActionFeedback(`Requisitioned ${item.name}! Added to neural inventory.`);
        trackEvent({
          event: 'armory_purchase',
          category: 'economy',
          label: item.name,
          value: item.priceCred,
          userId: currentUser.id,
          userHandle: currentUser.handle,
          metadata: {
            itemId: item.id,
            category: item.category,
            cost: item.priceCred,
          },
        });
      }
    } catch (err) {
      setActionFeedback('Network uplink failed');
    } finally {
      setPurchasingId(null);
      setTimeout(() => setActionFeedback(null), 4500);
    }
  };

  const handleEquip = async (itemId: string, type: 'frame' | 'title') => {
    try {
      const res = await fetch('/api/armory/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          itemId,
          type,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onUserUpdate(data.user);
        playSound('equip');
      }
    } catch (err) {
      console.error('Failed to equip cosmetic', err);
    }
  };

  const handleUseBooster = async (itemId: string) => {
    try {
      const res = await fetch('/api/armory/use-booster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          itemId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onUserUpdate(data.user);
        playSound('levelUp');
        setActionFeedback(`Activated ${data.activatedBooster?.name || 'Booster'}!`);
        setTimeout(() => setActionFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Failed to activate booster', err);
    }
  };

  const boosters = items.filter(i => i.category === 'booster' || i.category === 'perk');
  const cosmetics = items.filter(i => i.category === 'cosmetic');
  const titles = items.filter(i => i.category === 'title');
  const userInventory = currentUser.inventory || [];
  const activeBoosters = currentUser.activeBoosters || [];

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/50';
      case 'epic':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'rare':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-cyan-500/30 bg-slate-950/95 text-slate-100 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 p-5 sm:p-6 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  ARMORY & SHOP
                </h2>
                <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-400/30 uppercase tracking-wider">
                  Tactical Store
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Spend Cred on overclock boosters, holographic avatar frames, and prestigious titles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Wallet Balance Pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-900/90 border border-cyan-500/30 px-3.5 py-1.5 shadow-inner">
              <Coins className="h-4 w-4 text-cyan-400 animate-pulse" />
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Neural Wallet</div>
                <div className="text-sm font-black text-cyan-300">{currentUser.cred.toLocaleString()} <span className="text-[10px] text-cyan-500 font-bold">CR</span></div>
              </div>
            </div>

            <button
              onClick={() => {
                playSound('pop');
                onClose();
              }}
              className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Global Jackpot Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-amber-950/40 via-slate-900 to-cyan-950/40 border-b border-white/5 px-6 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-400 animate-bounce" />
            <span className="text-slate-300">Community Staking Jackpot Pool:</span>
            <span className="font-black text-amber-300 tracking-wide text-sm">{jackpotPool.toLocaleString()} CR</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>10% of Armory trades feed the global jackpot</span>
            {onOpenStipendOrPro && (
              <button
                onClick={() => {
                  onClose();
                  onOpenStipendOrPro();
                }}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
              >
                Claim Daily Stipend
              </button>
            )}
          </div>
        </div>

        {/* Action Feedback Toast */}
        {actionFeedback && (
          <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 px-4 py-2.5 text-xs font-semibold text-cyan-200 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex items-center gap-1 border-b border-white/10 px-6 pt-3 overflow-x-auto no-scrollbar bg-slate-900/50">
          {[
            { id: 'boosters', label: 'Overclock Boosters', icon: Zap, count: boosters.length },
            { id: 'cosmetics', label: 'Holo-Frames', icon: Sparkles, count: cosmetics.length },
            { id: 'titles', label: 'Cyber Titles', icon: Crown, count: titles.length },
            { id: 'inventory', label: 'My Inventory', icon: Package, count: userInventory.length, badge: activeBoosters.length ? `${activeBoosters.length} Active` : undefined },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playSound('pop');
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.2 text-[10px] text-cyan-300 border border-cyan-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-slate-400 text-sm">
              <RefreshCw className="h-6 w-6 animate-spin text-cyan-400 mr-2" />
              Calibrating Armory Uplink...
            </div>
          ) : (
            <>
              {/* --- BOOSTERS & PERKS TAB --- */}
              {activeTab === 'boosters' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {boosters.map(item => {
                    const isPurchasing = purchasingId === item.id;
                    const canAfford = currentUser.cred >= item.priceCred;
                    const ownedCount = userInventory.find(i => i.itemId === item.id)?.quantity || 0;

                    return (
                      <div
                        key={item.id}
                        className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/80 p-5 hover:border-cyan-500/40 hover:bg-slate-900 transition-all duration-200 shadow-md"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-2xl shadow-inner">
                                {item.icon}
                              </div>
                              <div>
                                <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                                  {item.name}
                                </h3>
                                <span className={`inline-block mt-0.5 rounded-md px-2 py-0.5 text-[10px] font-bold border ${getRarityBadge(item.rarity)} uppercase`}>
                                  {item.rarity} {item.category}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-base font-black text-cyan-300">
                                {item.priceCred} <span className="text-xs text-cyan-500">CR</span>
                              </div>
                              {ownedCount > 0 && (
                                <span className="text-[10px] text-slate-400 font-medium">Owned: {ownedCount}</span>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Zap className="h-3 w-3 text-cyan-400" /> Instant inventory delivery
                          </span>
                          <button
                            disabled={isPurchasing || !canAfford}
                            onClick={() => handlePurchase(item)}
                            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                              canAfford
                                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/30'
                                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                            }`}
                          >
                            {isPurchasing ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShoppingBag className="h-3.5 w-3.5" />
                            )}
                            {canAfford ? 'Requisition' : 'Need More CR'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* --- COSMETICS (HOLO-FRAMES) TAB --- */}
              {activeTab === 'cosmetics' && (
                <div>
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className={`h-14 w-14 rounded-full object-cover ${
                            currentUser.equippedFrame === 'frame_neon_cyan' ? 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse' :
                            currentUser.equippedFrame === 'frame_matrix_glitch' ? 'ring-2 ring-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.7)]' :
                            currentUser.equippedFrame === 'frame_syndicate_gold' ? 'ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.8)]' :
                            currentUser.equippedFrame === 'frame_quantum_void' ? 'ring-2 ring-fuchsia-500 shadow-[0_0_25px_rgba(217,70,239,0.9)] animate-pulse' :
                            'ring-2 ring-slate-700'
                          }`}
                        />
                        <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-900 p-1 border border-cyan-400 text-[10px]">
                          ✨
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Live Avatar Preview</div>
                        <h4 className="font-bold text-white text-sm">{currentUser.name} ({currentUser.handle})</h4>
                        <p className="text-xs text-slate-400">
                          Equipped Frame: <strong className="text-cyan-300">{currentUser.equippedFrame ? currentUser.equippedFrame.replace('frame_', '').replace('_', ' ').toUpperCase() : 'None (Standard)'}</strong>
                        </p>
                      </div>
                    </div>
                    {currentUser.equippedFrame && (
                      <button
                        onClick={() => handleEquip(cosmetics.find(c => c.effectKey === currentUser.equippedFrame)?.id || '', 'frame')}
                        className="rounded-xl border border-white/10 bg-slate-900 px-3.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        Unequip Frame
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cosmetics.map(item => {
                      const isOwned = userInventory.some(i => i.itemId === item.id);
                      const isEquipped = currentUser.equippedFrame === item.effectKey;
                      const canAfford = currentUser.cred >= item.priceCred;

                      return (
                        <div
                          key={item.id}
                          className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                            isEquipped 
                              ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                              : 'border-white/10 bg-slate-900/80 hover:border-cyan-500/30'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="text-3xl">{item.icon}</div>
                                <div>
                                  <h3 className="font-bold text-white text-sm">{item.name}</h3>
                                  <span className={`inline-block mt-0.5 rounded-md px-2 py-0.5 text-[10px] font-bold border ${getRarityBadge(item.rarity)} uppercase`}>
                                    {item.rarity} Frame
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-black text-cyan-300">
                                  {item.priceCred} <span className="text-[10px] text-cyan-500">CR</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">{item.description}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">
                              {isOwned ? (isEquipped ? '✨ Currently Equipped' : 'In Inventory') : 'Permanent Holo-Unlock'}
                            </span>
                            {isOwned ? (
                              <button
                                onClick={() => handleEquip(item.id, 'frame')}
                                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                                  isEquipped
                                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                                }`}
                              >
                                {isEquipped ? 'Unequip' : 'Equip Frame'}
                              </button>
                            ) : (
                              <button
                                disabled={!canAfford || purchasingId === item.id}
                                onClick={() => handlePurchase(item)}
                                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                                  canAfford
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                    : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                                }`}
                              >
                                {canAfford ? 'Requisition Frame' : 'Insufficient Cred'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- CYBER TITLES TAB --- */}
              {activeTab === 'titles' && (
                <div>
                  <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4 mb-6 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Active Title Flair</div>
                      <div className="text-base font-black text-white mt-0.5">
                        {currentUser.handle} {currentUser.equippedTitle && <span className="text-xs text-cyan-300 font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 ml-2">{currentUser.equippedTitle}</span>}
                      </div>
                    </div>
                    {currentUser.equippedTitle && (
                      <button
                        onClick={() => handleEquip(titles.find(t => (t.badgeCode || t.name) === currentUser.equippedTitle)?.id || '', 'title')}
                        className="rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                      >
                        Clear Title
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {titles.map(item => {
                      const isOwned = userInventory.some(i => i.itemId === item.id);
                      const isEquipped = currentUser.equippedTitle === (item.badgeCode || item.name);
                      const canAfford = currentUser.cred >= item.priceCred;

                      return (
                        <div
                          key={item.id}
                          className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                            isEquipped 
                              ? 'border-indigo-400 bg-indigo-950/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                              : 'border-white/10 bg-slate-900/80 hover:border-indigo-500/30'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">{item.icon}</div>
                                <div>
                                  <h3 className="font-bold text-white text-sm">{item.name}</h3>
                                  <span className={`inline-block mt-0.5 rounded-md px-2 py-0.5 text-[10px] font-bold border ${getRarityBadge(item.rarity)} uppercase`}>
                                    {item.rarity} Title
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-black text-indigo-300">
                                  {item.priceCred} <span className="text-[10px] text-indigo-500">CR</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">{item.description}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">
                              {isOwned ? (isEquipped ? '🔱 Active Title' : 'Owned Title') : 'Profile Prestige Flair'}
                            </span>
                            {isOwned ? (
                              <button
                                onClick={() => handleEquip(item.id, 'title')}
                                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                                  isEquipped
                                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                }`}
                              >
                                {isEquipped ? 'Unequip' : 'Equip Title'}
                              </button>
                            ) : (
                              <button
                                disabled={!canAfford || purchasingId === item.id}
                                onClick={() => handlePurchase(item)}
                                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                                  canAfford
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                    : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                                }`}
                              >
                                {canAfford ? 'Requisition Title' : 'Insufficient Cred'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- MY INVENTORY & ACTIVE BOOSTERS TAB --- */}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  {/* Active Boosters Sub-section */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Active Telemetry Boosters ({activeBoosters.length})
                    </h3>
                    {activeBoosters.length === 0 ? (
                      <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-4 text-xs text-slate-400 text-center">
                        No active boosters currently humming. Activate a 2x Overclock Chip or Cryo-Shield below!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeBoosters.map(booster => (
                          <div
                            key={booster.id}
                            className="rounded-2xl border border-cyan-500/40 bg-cyan-950/30 p-4 flex items-center justify-between shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{booster.icon}</span>
                              <div>
                                <h4 className="font-bold text-white text-xs">{booster.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-cyan-300">
                                  {booster.usesRemaining && (
                                    <span className="font-semibold">{booster.usesRemaining} uses left</span>
                                  )}
                                  <span>• Active</span>
                                </div>
                              </div>
                            </div>
                            <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-400/30">
                              LIVE
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Inventory Grid */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" /> Owned Gear & Consumables ({userInventory.length})
                    </h3>
                    {userInventory.length === 0 ? (
                      <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-8 text-center text-slate-400 text-xs">
                        Your neural inventory is currently empty. Requisition boosters or cosmetics in the catalog tabs above!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {userInventory.map(item => {
                          const isBooster = item.category === 'booster' || item.category === 'perk';
                          return (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-white/10 bg-slate-900 p-4 flex flex-col justify-between"
                            >
                              <div className="flex items-start justify-between">
                                <span className="text-2xl">{item.icon}</span>
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white">
                                  x{item.quantity}
                                </span>
                              </div>
                              <div className="my-2">
                                <h4 className="font-bold text-white text-xs">{item.name}</h4>
                                <span className={`inline-block mt-0.5 rounded px-1.5 py-0.2 text-[9px] font-semibold border ${getRarityBadge(item.rarity)} uppercase`}>
                                  {item.category}
                                </span>
                              </div>
                              <div className="mt-2 pt-2 border-t border-white/5 flex justify-end">
                                {isBooster ? (
                                  <button
                                    onClick={() => handleUseBooster(item.itemId)}
                                    className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 py-1.5 text-[11px] font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer"
                                  >
                                    Activate Booster
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleEquip(item.itemId, item.category === 'cosmetic' ? 'frame' : 'title')}
                                    className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-1.5 text-[11px] font-bold text-slate-200 transition-all cursor-pointer"
                                  >
                                    {item.isEquipped ? 'Unequip' : 'Equip'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/10 p-4 bg-slate-950 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span>Encrypted Cred Exchange Protocol 2077</span>
          </div>
          <button
            onClick={() => {
              playSound('pop');
              onClose();
            }}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 font-bold text-white transition-colors"
          >
            Close Terminal
          </button>
        </div>
      </div>
    </div>
  );
};
