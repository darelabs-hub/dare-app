import React, { useState, useEffect } from 'react';
import { 
  X, 
  Zap, 
  Sparkles, 
  ShoppingBag, 
  Package, 
  CheckCircle2, 
  Coins, 
  RefreshCw,
  Crown,
  Check,
  Award,
  Layers,
  ArrowRight,
  Plus
} from 'lucide-react';
import { ArmoryItem, InventoryItem, ActiveBooster, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';
import { trackEvent } from '../utils/analytics';
import { fetchWithRetry } from '../utils/api';
import { DEFAULT_ARMORY_CATALOG } from '../data/armoryCatalog';

interface ArmoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserUpdate: (updatedUser: UserProfile) => void;
  onOpenStipendOrPro?: () => void;
}

/**
 * Strips leading redundant emoji from item names since the icon is already rendered separately
 */
const cleanItemName = (name: string) => {
  return name.replace(/^[\p{Emoji}\s]+/u, '').trim() || name;
};

export const ArmoryModal: React.FC<ArmoryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  onOpenStipendOrPro,
}) => {
  const [activeTab, setActiveTab] = useState<'boosters' | 'cosmetics' | 'titles' | 'inventory'>('boosters');
  const [items, setItems] = useState<ArmoryItem[]>(DEFAULT_ARMORY_CATALOG);

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
      const res = await fetchWithRetry('/api/armory/items', { retries: 2, backoffMs: 200 });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data.items) && data.items.length > 0) {
            setItems(data.items);
          }
        }
      }
    } catch (_err) {
      // Gracefully maintain DEFAULT_ARMORY_CATALOG so store items remain instantly usable
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handlePurchase = async (item: ArmoryItem) => {
    if (currentUser.cred < item.priceCred) {
      setActionFeedback(`Insufficient Cred balance (${currentUser.cred.toLocaleString()} Cred). Need ${item.priceCred.toLocaleString()} Cred.`);
      playSound('error');
      setTimeout(() => setActionFeedback(null), 4000);
      return;
    }

    try {
      setPurchasingId(item.id);
      const res = await fetchWithRetry('/api/armory/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          itemId: item.id,
          quantity: 1,
        }),
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          setActionFeedback(data.error || 'Unlock failed');
          playSound('error');
        } else {
          onUserUpdate(data.user);
          playSound('purchase');
          setActionFeedback(`Unlocked ${cleanItemName(item.name)}! Added to your inventory.`);
          trackEvent({
            event: 'store_purchase',
            category: 'economy',
            label: item.name,
            value: item.priceCred,
            metadata: {
              action: 'buy_item',
              itemId: item.id,
            },
          });
        }
      } else {
        setActionFeedback('Item unlock temporarily unavailable');
      }
    } catch (_err: any) {
      setActionFeedback('Failed to complete unlock. Please check connection.');
    } finally {
      setPurchasingId(null);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleEquip = async (itemId: string, type: 'frame' | 'title') => {
    try {
      const res = await fetchWithRetry('/api/armory/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          itemId,
          type,
        }),
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok) {
          onUserUpdate(data.user);
          playSound('pop');
          const isUnequip = (type === 'frame' && !data.user.equippedFrame) || (type === 'title' && !data.user.equippedTitle);
          setActionFeedback(isUnequip ? `Reset ${type === 'frame' ? 'profile ring' : 'badge'} to standard` : `Equipped ${type === 'frame' ? 'profile ring' : 'badge'}!`);
        } else {
          setActionFeedback(data.error || 'Failed to update selection');
        }
      }
    } catch (_err) {
      setActionFeedback('Network error while updating equipment');
    } finally {
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleUseBooster = async (boosterId: string) => {
    try {
      const res = await fetchWithRetry('/api/armory/use-booster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          boosterId,
        }),
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok) {
          onUserUpdate(data.user);
          playSound('laser');
          setActionFeedback('Booster activated! Bonus applied to next challenges.');
        } else {
          setActionFeedback(data.error || 'Failed to activate booster');
        }
      }
    } catch (_err) {
      setActionFeedback('Failed to activate booster');
    } finally {
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const boosters = items.filter(i => i.category === 'booster' || i.category === 'perk');
  const cosmetics = items.filter(i => i.category === 'cosmetic');
  const titles = items.filter(i => i.category === 'title');

  const userInventory = (currentUser.inventory || []) as InventoryItem[];
  const activeBoosters = (currentUser.activeBoosters || []) as ActiveBooster[];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-white/[0.08] bg-[#0A0D14] text-slate-100 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6 sm:py-5 bg-[#0C1018] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-white shrink-0">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Store & Perks
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  · Rewards
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Redeem earned Cred for boosters, avatar rings, and creator badges.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Balance Card */}
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-1.5">
              <Coins className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="text-xs font-mono font-bold text-amber-300 tabular-nums">
                {currentUser.cred.toLocaleString()} <span className="text-[10px] text-amber-400/80 font-normal">Cred</span>
              </span>
              {onOpenStipendOrPro && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenStipendOrPro();
                    playSound('click');
                  }}
                  className="ml-1 text-[11px] font-semibold text-white hover:text-slate-200 px-2 py-0.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] transition-colors cursor-pointer"
                  title="Get Cred"
                >
                  + Top Up
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                playSound('pop');
                onClose();
              }}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action Feedback Toast */}
        {actionFeedback && (
          <div className="mx-5 sm:mx-6 mt-3 flex items-center gap-2 rounded-xl bg-white/[0.05] border border-white/[0.1] px-3.5 py-2 text-xs font-medium text-white animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Segmented Navigation Tabs Bar */}
        <div className="px-5 sm:px-6 pt-3 pb-3 border-b border-white/[0.08]">
          <div className="p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] inline-flex w-full sm:w-auto items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'boosters', label: 'Perks & Boosters', icon: Zap, count: boosters.length },
              { id: 'cosmetics', label: 'Profile Rings', icon: Sparkles, count: cosmetics.length },
              { id: 'titles', label: 'Creator Badges', icon: Crown, count: titles.length },
              { id: 'inventory', label: 'My Unlocks', icon: Package, count: userInventory.length, badge: activeBoosters.length ? `${activeBoosters.length} Active` : undefined },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    playSound('pop');
                    setActiveTab(tab.id as any);
                  }}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge ? (
                    <span className={`text-[10px] font-mono font-semibold ${isActive ? 'text-slate-900' : 'text-emerald-400'}`}>
                      · {tab.badge}
                    </span>
                  ) : (
                    <span className={`text-[10px] font-mono ${isActive ? 'text-slate-700' : 'text-slate-500'}`}>
                      · {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 max-h-[60vh] overscroll-contain">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-slate-400 text-xs">
              <RefreshCw className="h-4 w-4 animate-spin text-slate-300 mr-2" />
              Loading catalog...
            </div>
          ) : (
            <>
              {/* --- BOOSTERS & PERKS TAB --- */}
              {activeTab === 'boosters' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {boosters.map(item => {
                    const isPurchasing = purchasingId === item.id;
                    const canAfford = currentUser.cred >= item.priceCred;
                    const ownedCount = userInventory.find(i => i.itemId === item.id)?.quantity || 0;

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.14] p-4 transition-all group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-xl shrink-0 group-hover:scale-105 transition-transform">
                                {item.icon}
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-white text-sm truncate">
                                  {cleanItemName(item.name)}
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {item.category === 'booster' ? 'Active Booster' : 'Creator Perk'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono font-bold text-xs text-amber-300 tabular-nums">
                                {item.priceCred.toLocaleString()} <span className="text-[10px] text-amber-400/80 font-normal">Cred</span>
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-400 truncate">
                            {ownedCount > 0 ? `${ownedCount} in inventory` : 'Instant Unlock'}
                          </span>

                          <button
                            type="button"
                            disabled={isPurchasing}
                            onClick={() => {
                              if (!canAfford && onOpenStipendOrPro) {
                                onOpenStipendOrPro();
                                playSound('click');
                                return;
                              }
                              handlePurchase(item);
                            }}
                            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                              canAfford
                                ? 'bg-white hover:bg-slate-100 text-slate-950 font-bold shadow-sm'
                                : 'bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
                            }`}
                          >
                            {isPurchasing ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShoppingBag className="h-3.5 w-3.5" />
                            )}
                            {canAfford ? 'Unlock' : 'Need More Cred'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* --- PROFILE RINGS TAB --- */}
              {activeTab === 'cosmetics' && (
                <div className="space-y-4">
                  {/* Avatar Preview Card */}
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className={`h-11 w-11 rounded-full object-cover transition-all ${
                            currentUser.equippedFrame === 'frame_syndicate_gold' ? 'ring-2 ring-amber-400' :
                            currentUser.equippedFrame === 'frame_neon_cyan' ? 'ring-2 ring-cyan-400' :
                            currentUser.equippedFrame === 'frame_matrix_glitch' ? 'ring-2 ring-emerald-400' :
                            currentUser.equippedFrame === 'frame_quantum_void' ? 'ring-2 ring-pink-500' :
                            'ring-1 ring-white/20'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 font-medium">Avatar Ring Preview</span>
                        <h4 className="font-semibold text-white text-sm">{currentUser.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Active: <span className="text-white font-medium">{currentUser.equippedFrame ? currentUser.equippedFrame.replace('frame_', '').replace(/_/g, ' ') : 'None (Standard)'}</span>
                        </p>
                      </div>
                    </div>
                    {currentUser.equippedFrame && (
                      <button
                        type="button"
                        onClick={() => handleEquip(cosmetics.find(c => c.effectKey === currentUser.equippedFrame)?.id || '', 'frame')}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {cosmetics.map(item => {
                      const isOwned = userInventory.some(i => i.itemId === item.id);
                      const isEquipped = currentUser.equippedFrame === item.effectKey;
                      const canAfford = currentUser.cred >= item.priceCred;

                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl border p-4 transition-all flex flex-col justify-between group ${
                            isEquipped 
                              ? 'border-white/40 bg-white/[0.04]'
                              : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.14]'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-xl shrink-0 group-hover:scale-105 transition-transform">
                                  {item.icon}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-white text-sm">{cleanItemName(item.name)}</h3>
                                  <p className="text-[11px] text-slate-400 mt-0.5">Profile Ring</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono font-bold text-xs text-amber-300 tabular-nums">
                                  {item.priceCred.toLocaleString()} <span className="text-[10px] text-amber-400/80 font-normal">Cred</span>
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">{item.description}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-400">
                              {isOwned ? (isEquipped ? 'Active Ring' : 'Unlocked') : 'Permanent'}
                            </span>
                            {isOwned ? (
                              <button
                                type="button"
                                onClick={() => handleEquip(item.id, 'frame')}
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                  isEquipped
                                    ? 'bg-white/[0.08] hover:bg-white/[0.12] text-slate-200'
                                    : 'bg-white text-slate-950 font-bold hover:bg-slate-100 shadow-sm'
                                }`}
                              >
                                {isEquipped ? 'Unequip' : 'Equip Ring'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={purchasingId === item.id}
                                onClick={() => {
                                  if (!canAfford && onOpenStipendOrPro) {
                                    onOpenStipendOrPro();
                                    playSound('click');
                                    return;
                                  }
                                  handlePurchase(item);
                                }}
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                  canAfford
                                    ? 'bg-white hover:bg-slate-100 text-slate-950 font-bold shadow-sm'
                                    : 'bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
                                }`}
                              >
                                {canAfford ? 'Unlock' : 'Need More Cred'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- CREATOR BADGES TAB --- */}
              {activeTab === 'titles' && (
                <div className="space-y-4">
                  {/* Active Badge Showcase */}
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium">Active Creator Badge</span>
                      <div className="text-xs sm:text-sm font-semibold text-white mt-1 flex items-center gap-2">
                        <span>{currentUser.name}</span>
                        {currentUser.equippedTitle ? (
                          <span className="text-xs text-slate-200 font-medium px-2 py-0.5 rounded-lg bg-white/[0.08] border border-white/[0.12]">
                            {currentUser.equippedTitle}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">None (Default)</span>
                        )}
                      </div>
                    </div>
                    {currentUser.equippedTitle && (
                      <button
                        type="button"
                        onClick={() => handleEquip(titles.find(t => (t.badgeCode || t.name) === currentUser.equippedTitle)?.id || '', 'title')}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 text-xs text-slate-300 hover:text-white cursor-pointer transition-colors"
                      >
                        Clear Badge
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {titles.map(item => {
                      const isOwned = userInventory.some(i => i.itemId === item.id);
                      const isEquipped = currentUser.equippedTitle === (item.badgeCode || item.name);
                      const canAfford = currentUser.cred >= item.priceCred;

                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl border p-4 transition-all flex flex-col justify-between group ${
                            isEquipped 
                              ? 'border-white/40 bg-white/[0.04]'
                              : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.14]'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-xl shrink-0 group-hover:scale-105 transition-transform">
                                  {item.icon}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-white text-sm">{cleanItemName(item.name)}</h3>
                                  <p className="text-[11px] text-slate-400 mt-0.5">Creator Badge</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono font-bold text-xs text-amber-300 tabular-nums">
                                  {item.priceCred.toLocaleString()} <span className="text-[10px] text-amber-400/80 font-normal">Cred</span>
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">{item.description}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-400">
                              {isOwned ? (isEquipped ? 'Active Badge' : 'Unlocked') : 'Permanent'}
                            </span>
                            {isOwned ? (
                              <button
                                type="button"
                                onClick={() => handleEquip(item.id, 'title')}
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                  isEquipped
                                    ? 'bg-white/[0.08] hover:bg-white/[0.12] text-slate-200'
                                    : 'bg-white text-slate-950 font-bold hover:bg-slate-100 shadow-sm'
                                }`}
                              >
                                {isEquipped ? 'Unequip' : 'Equip Badge'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={purchasingId === item.id}
                                onClick={() => {
                                  if (!canAfford && onOpenStipendOrPro) {
                                    onOpenStipendOrPro();
                                    playSound('click');
                                    return;
                                  }
                                  handlePurchase(item);
                                }}
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                  canAfford
                                    ? 'bg-white hover:bg-slate-100 text-slate-950 font-bold shadow-sm'
                                    : 'bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
                                }`}
                              >
                                {canAfford ? 'Unlock' : 'Need More Cred'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- MY UNLOCKS TAB --- */}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  {/* Active Boosters */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      <span>Active Boosters ({activeBoosters.length})</span>
                    </h3>
                    {activeBoosters.length === 0 ? (
                      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs text-slate-400 text-center">
                        No active boosters currently running. Activate a 2x Cred booster or Streak Shield from your inventory.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeBoosters.map(booster => (
                          <div
                            key={booster.id}
                            className="rounded-xl border border-white/[0.12] bg-white/[0.03] p-3.5 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{booster.icon}</span>
                              <div>
                                <h4 className="font-semibold text-white text-xs">{cleanItemName(booster.name)}</h4>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                  {booster.usesRemaining && (
                                    <span>{booster.usesRemaining} uses left</span>
                                  )}
                                  <span>• Active</span>
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-emerald-400">
                              Active
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Owned Items Grid */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-slate-400" />
                      <span>Unlocked Perks & Badges ({userInventory.length})</span>
                    </h3>
                    {userInventory.length === 0 ? (
                      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-8 text-center text-slate-400 text-xs">
                        You haven't unlocked any store items yet. Browse the catalog tabs to redeem your Cred.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {userInventory.map(item => {
                          const isBooster = item.category === 'booster' || item.category === 'perk';
                          return (
                            <div
                              key={item.id}
                              className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 flex flex-col justify-between"
                            >
                              <div className="flex items-start justify-between">
                                <span className="text-2xl">{item.icon}</span>
                                <span className="text-xs font-mono font-semibold text-slate-400">
                                  x{item.quantity}
                                </span>
                              </div>
                              <div className="my-2">
                                <h4 className="font-semibold text-white text-xs truncate">{cleanItemName(item.name)}</h4>
                                <span className="text-[11px] text-slate-400 capitalize">
                                  {item.category}
                                </span>
                              </div>
                              <div className="mt-2 pt-2 border-t border-white/[0.06] flex justify-end">
                                {isBooster ? (
                                  <button
                                    type="button"
                                    onClick={() => handleUseBooster(item.itemId)}
                                    className="w-full rounded-lg bg-white text-slate-950 font-bold hover:bg-slate-100 py-1.5 text-xs transition-all cursor-pointer shadow-sm"
                                  >
                                    Activate Booster
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleEquip(item.itemId, item.category === 'cosmetic' ? 'frame' : 'title')}
                                    className="w-full rounded-lg bg-white/[0.06] hover:bg-white/[0.1] py-1.5 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
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
        <div className="flex items-center justify-between border-t border-white/[0.08] px-5 py-3.5 bg-[#0C1018] text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            <span>Complete challenges and daily dares to earn Cred</span>
          </div>
          <button
            type="button"
            onClick={() => {
              playSound('pop');
              onClose();
            }}
            className="rounded-lg bg-white/[0.08] hover:bg-white/[0.14] px-4 py-1.5 font-semibold text-white transition-colors cursor-pointer text-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
