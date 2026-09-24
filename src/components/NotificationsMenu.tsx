import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  UserCheck, 
  ShieldCheck, 
  AlertTriangle, 
  MessageSquare, 
  Crosshair, 
  Camera, 
  Radio,
  ExternalLink,
  X,
  Sparkles,
  Clock,
  Swords,
  Coins,
  BellRing
} from 'lucide-react';
import { NotificationItem, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';
import { 
  getPushPermissionStatus, 
  requestPushNotificationPermission, 
  dispatchSystemNotification 
} from '../utils/pushNotifications';

interface NotificationsMenuProps {
  currentUser: UserProfile;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
  onNavigateToDare: (dareId: string) => void;
  onSimulateNotification?: () => void;
  onSimulateExpiryNotification?: () => void;
}

export const NotificationsMenu: React.FC<NotificationsMenuProps> = ({
  currentUser,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onClearAll,
  onNavigateToDare,
  onSimulateNotification,
  onSimulateExpiryNotification,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'social' | 'consensus'>('all');
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const displayedNotifications = filterTab === 'social'
    ? notifications.filter(n => n.type === 'dare_accepted' || n.type === 'comment_received' || n.type === 'dare_targeted')
    : filterTab === 'consensus'
    ? notifications.filter(n => n.type === 'proof_voted' || n.type === 'proof_submitted')
    : notifications;

  const getNotificationBadge = (item: NotificationItem) => {
    switch (item.type) {
      case 'dare_accepted':
        return (
          <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_6px_rgba(16,185,129,0.5)] border border-[#0a0d14]">
            <UserCheck className="h-2.5 w-2.5" />
          </div>
        );
      case 'proof_voted':
        return item.voteType === 'busted' ? (
          <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-white shadow-[0_0_6px_rgba(244,63,94,0.5)] border border-[#0a0d14]">
            <AlertTriangle className="h-2.5 w-2.5" />
          </div>
        ) : (
          <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-cyan-500 text-white shadow-[0_0_6px_rgba(6,182,212,0.5)] border border-[#0a0d14]">
            <ShieldCheck className="h-2.5 w-2.5" />
          </div>
        );
      case 'comment_received':
        return (
          <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-pink-500 text-white shadow-[0_0_6px_rgba(236,72,153,0.5)] border border-[#0a0d14]">
            <MessageSquare className="h-2.5 w-2.5" />
          </div>
        );
      case 'dare_targeted':
        return (
          <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500 text-white shadow-[0_0_6px_rgba(245,158,11,0.5)] border border-[#0a0d14]">
            <Crosshair className="h-2.5 w-2.5" />
          </div>
        );
      case 'proof_submitted':
        return (
          <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-purple-500 text-white shadow-[0_0_6px_rgba(168,85,247,0.5)] border border-[#0a0d14]">
            <Camera className="h-2.5 w-2.5" />
          </div>
        );
      case 'rematch_requested':
        return (
          <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-white shadow-[0_0_6px_rgba(244,63,94,0.5)] border border-[#0a0d14]">
            <Swords className="h-2.5 w-2.5" />
          </div>
        );
      case 'tournament_wager':
        return (
          <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500 text-white shadow-[0_0_6px_rgba(245,158,11,0.5)] border border-[#0a0d14]">
            <Coins className="h-2.5 w-2.5" />
          </div>
        );
      default:
        return (
          <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-indigo-500 text-white border border-[#0a0d14]">
            <Radio className="h-2.5 w-2.5" />
          </div>
        );
    }
  };

  const handleReact = (notifId: string, emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('laser');
    setReactions(prev => {
      const itemReactions = prev[notifId] || {};
      return {
        ...prev,
        [notifId]: {
          ...itemReactions,
          [emoji]: (itemReactions[emoji] || 0) + 1
        }
      };
    });
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="notifications-bell-btn"
        type="button"
        onClick={() => {
          playSound('click');
          setIsOpen(!isOpen);
        }}
        aria-label="Toggle live activity feed"
        aria-expanded={isOpen}
        title={unreadCount > 0 ? `${unreadCount} unread social stream updates` : 'Live Activity Feed'}
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
          isOpen
            ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
            : unreadCount > 0
            ? 'border-pink-500/50 bg-slate-900/90 text-pink-300 hover:border-pink-400 hover:text-white shadow-[0_0_12px_rgba(236,72,153,0.25)]'
            : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-300'
        }`}
      >
        <Bell className={`h-4 w-4 ${unreadCount > 0 ? 'animate-bounce text-pink-400' : ''}`} />

        {/* Unread Indicator Badge */}
        {unreadCount > 0 && (
          <>
            {/* Animated Ping Dot */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500 shadow-[0_0_8px_#ec4899]" />
            </span>

            {/* Unread Count Pill */}
            <span 
              id="notifications-unread-count-pill"
              className="absolute -top-1.5 -right-1.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-gradient-to-r from-pink-600 to-rose-500 px-1 text-[10px] font-mono font-bold text-white shadow-[0_0_10px_rgba(236,72,153,0.6)]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {/* Activity Feed Dropdown Panel */}
      {isOpen && (
        <>
          {/* Mobile backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            id="notifications-dropdown-menu"
            className="fixed left-1/2 -translate-x-1/2 top-18 sm:top-full sm:right-0 sm:left-auto sm:translate-x-0 sm:absolute mt-2 w-[calc(100vw-1.5rem)] sm:w-96 max-w-md sm:max-w-none rounded-2xl border border-cyan-500/30 bg-[#0a0d14] p-0 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Synchronized Header */}
            <div className="flex items-center justify-between border-b border-slate-800/90 px-3.5 sm:px-4 py-3 bg-[#0d121c] shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-2 w-2 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899] animate-pulse shrink-0" />
                <h3 className="font-tech text-xs font-bold tracking-wider uppercase text-slate-100 flex items-center gap-1.5 truncate">
                  <span>Social Stream</span>
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full border border-pink-500/40 bg-pink-950/60 px-2 py-0.5 text-[9px] font-mono font-bold text-pink-300 shrink-0">
                    {unreadCount} NEW
                  </span>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    id="notifications-mark-all-read-btn"
                    onClick={() => {
                      playSound('click');
                      onMarkAllRead();
                    }}
                    title="Mark all as read"
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-mono font-bold text-cyan-400 hover:bg-cyan-950/50 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Dismiss</span>
                  </button>
                )}

                {notifications.length > 0 && (
                  <button
                    type="button"
                    id="notifications-clear-all-btn"
                    onClick={() => {
                      playSound('click');
                      onClearAll();
                    }}
                    title="Clear feed history"
                    className="flex items-center gap-1 rounded-lg p-1 text-slate-500 hover:bg-rose-950/40 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Mobile explicit close X button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close social stream"
                  className="sm:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Interactive Live Stream Tabs */}
          <div className="flex border-b border-slate-800/80 bg-[#080b11] px-3.5 sm:px-4 pt-2 text-xs shrink-0">
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setFilterTab('all');
              }}
              className={`pb-2 px-2.5 font-mono font-bold transition-all border-b-2 cursor-pointer ${
                filterTab === 'all'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setFilterTab('social');
              }}
              className={`pb-2 px-2.5 font-mono font-bold transition-all border-b-2 cursor-pointer ${
                filterTab === 'social'
                  ? 'border-pink-400 text-pink-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Social
            </button>
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setFilterTab('consensus');
              }}
              className={`pb-2 px-2.5 font-mono font-bold transition-all border-b-2 cursor-pointer ${
                filterTab === 'consensus'
                  ? 'border-purple-400 text-purple-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Consensus
            </button>
          </div>

          {/* Activity Scrollable List */}
          <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-900">
            {displayedNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-500 mb-2.5">
                  <Radio className="h-5 w-5 opacity-40 animate-pulse" />
                </div>
                <p className="font-mono text-xs font-semibold text-slate-300">
                  Stream Quiet
                </p>
                <p className="mt-1 text-[11px] text-slate-500 max-w-[220px]">
                  No active telemetry signals in this category.
                </p>
              </div>
            ) : (
              displayedNotifications.map((item) => {
                const itemReacts = reactions[item.id] || {};
                return (
                  <div
                    key={item.id}
                    id={`notification-item-${item.id}`}
                    onClick={() => {
                      if (!item.read) onMarkRead(item.id);
                      if (item.dareId) onNavigateToDare(item.dareId);
                      setIsOpen(false);
                      playSound('laser');
                    }}
                    className={`group relative flex items-start gap-3 p-3 sm:p-3.5 transition-all cursor-pointer border-l-2 ${
                      !item.read
                        ? 'bg-cyan-950/15 hover:bg-cyan-950/25 border-cyan-400 shadow-[inset_1px_0_12px_rgba(6,182,212,0.05)]'
                        : 'hover:bg-slate-900/30 border-transparent text-slate-300'
                    }`}
                  >
                    {/* Immersive Stacked Avatar with Mini Icon Overlay */}
                    <div className="relative shrink-0 mt-0.5">
                      <img
                        src={item.actorAvatar}
                        alt={item.actorHandle}
                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border border-slate-700/80 shadow-md ring-1 ring-slate-800"
                      />
                      <div className="absolute -bottom-1 -right-1">
                        {getNotificationBadge(item)}
                      </div>
                    </div>

                    {/* Social Snippet Text Block */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-xs font-bold text-white truncate hover:underline">
                          {item.actorHandle}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 shrink-0 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatTimestamp(item.createdAt)}
                        </span>
                      </div>

                      {/* Socially Polished Snippet Display */}
                      <p className="mt-1 text-xs leading-normal text-slate-300 break-words">
                        {item.type === 'dare_accepted' && (
                          <span>
                            accepted your challenge <strong className="text-emerald-400 font-semibold break-words">"{item.dareTitle}"</strong> and initiated countdown!
                          </span>
                        )}
                        {item.type === 'comment_received' && (
                          <span>
                            commented: <em className="text-pink-400 font-mono block mt-1 border-l-2 border-pink-500/20 bg-pink-950/10 px-2 py-1 rounded text-[11px] not-italic break-words">"{item.message.split('commented:')[1]?.trim() || item.message}"</em>
                          </span>
                        )}
                        {item.type === 'proof_voted' && (
                          <span>
                            voted <strong className={item.voteType === 'busted' ? 'text-rose-400' : 'text-cyan-400'}>{item.voteType?.toUpperCase()}</strong> on proof for <strong className="text-slate-200 break-words">"{item.dareTitle}"</strong>.
                          </span>
                        )}
                        {item.type === 'dare_targeted' && (
                          <span>
                            targeted you directly with <strong className="text-amber-400 break-words">"{item.dareTitle}"</strong>!
                          </span>
                        )}
                        {item.type === 'proof_submitted' && (
                          <span>
                            submitted live proof for <strong className="text-purple-400 break-words">"{item.dareTitle}"</strong>.
                          </span>
                        )}
                        {!['dare_accepted', 'comment_received', 'proof_voted', 'dare_targeted', 'proof_submitted'].includes(item.type) && (
                          <span className="break-words">{item.message}</span>
                        )}
                      </p>

                      {/* Interactive Emoji Reaction Bar */}
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
                        {['🔥', '🙌', '😮', '💀'].map((emoji) => {
                          const count = itemReacts[emoji] || 0;
                          return (
                            <button
                              key={emoji}
                              onClick={(e) => handleReact(item.id, emoji, e)}
                              className={`flex items-center gap-1 rounded bg-slate-900/80 border hover:bg-slate-800 px-1.5 py-0.5 text-[10px] transition-all font-mono cursor-pointer ${
                                count > 0 
                                  ? 'border-cyan-500/40 text-cyan-300 bg-cyan-950/20' 
                                  : 'border-slate-800 text-slate-400'
                              }`}
                            >
                              <span>{emoji}</span>
                              {count > 0 && <span>{count}</span>}
                            </button>
                          );
                        })}
                      </div>

                      {/* Quick Navigate Link */}
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-cyan-400/80 group-hover:text-cyan-300">
                        <span>Go to Dare</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </div>
                    </div>

                    {/* Quick Single Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound('click');
                        onDeleteNotification(item.id);
                      }}
                      title="Dismiss activity"
                      className="opacity-60 sm:opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity shrink-0 ml-1 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Live Synchronized Footer with Simulator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-800/80 bg-[#07090e] px-3.5 sm:px-4 py-2.5 text-[11px] gap-2 shrink-0">
            <span className="font-mono text-slate-500 text-[10px] flex items-center gap-1">
              <span className="h-1 w-1 bg-cyan-400 rounded-full animate-ping" />
              <span>Stream Live</span>
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                id="test-web-push-notif-menu-btn"
                onClick={async () => {
                  playSound('laser');
                  const perm = getPushPermissionStatus();
                  if (perm !== 'granted') {
                    await requestPushNotificationPermission().catch(() => {});
                  }
                  await dispatchSystemNotification({
                    title: '⚡ DARE Transmission Alert',
                    body: 'Incoming challenge transmission from Grid Sector 7 (+100 Cred)!',
                    tag: 'TRANSMISSION // ACTIVE',
                    userId: currentUser?.id,
                  });
                }}
                className="flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-2 py-1 text-[10px] font-mono font-bold text-indigo-300 hover:border-indigo-400 hover:bg-indigo-900/50 transition-all cursor-pointer"
                title="Send system notification and telemetry pulse"
              >
                <BellRing className="h-3 w-3 text-indigo-400" />
                <span>Push Alert</span>
              </button>

              {onSimulateExpiryNotification && (
                <button
                  type="button"
                  id="simulate-expiry-notification-btn"
                  onClick={() => {
                    onSimulateExpiryNotification();
                  }}
                  className="flex items-center gap-1 rounded-lg border border-pink-500/30 bg-pink-950/40 px-2 py-1 text-[10px] font-mono font-bold text-pink-300 hover:border-pink-400 hover:bg-pink-900/50 transition-all cursor-pointer"
                >
                  <Clock className="h-3 w-3 text-pink-400" />
                  <span>Simulate Expiry</span>
                </button>
              )}

              {onSimulateNotification && (
                <button
                  type="button"
                  id="simulate-notification-btn"
                  onClick={() => {
                    onSimulateNotification();
                  }}
                  className="flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2 py-1 text-[10px] font-mono font-bold text-cyan-300 hover:border-cyan-400 hover:bg-cyan-900/50 transition-all cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 text-cyan-400" />
                  <span>Simulate Event</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </>
      )}
    </div>
  );
};
