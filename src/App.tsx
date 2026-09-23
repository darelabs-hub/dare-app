/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { DareCard } from './components/DareCard';
import { CreateDareModal } from './components/CreateDareModal';
import { ProofModal } from './components/ProofModal';
import { ProofGalleryModal } from './components/ProofGalleryModal';
import { ProofViewerModal } from './components/ProofViewerModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { OracleSurpriseModal } from './components/OracleSurpriseModal';
import { CommentsDrawer } from './components/CommentsDrawer';
import { LegalAndFaqModal, LegalTab } from './components/LegalAndFaqModal';
import { ShareToast, ToastData } from './components/ShareToast';
import { ExpiryNotificationToast, ExpiryToastData } from './components/ExpiryNotificationToast';
import { CredLogModal } from './components/CredLogModal';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { UserProfileModal } from './components/UserProfileModal';
import { EventsMerchModal } from './components/EventsMerchModal';
import { CyberArmoryModal } from './components/CyberArmoryModal';
import { SeasonPassModal } from './components/SeasonPassModal';
import { DareStakingModal } from './components/DareStakingModal';
import { DailyMissionWidget } from './components/DailyMissionWidget';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SquadTournamentsModal } from './components/SquadTournamentsModal';
import { LiveDuelsArenaModal } from './components/LiveDuelsArenaModal';
import { DropZonesModal } from './components/DropZonesModal';
import { ShareCardModal } from './components/ShareCardModal';
import { PushNotificationBanner } from './components/PushNotificationBanner';
import { HelpBubbleSystem } from './components/HelpBubbleSystem';
import { Footer } from './components/Footer';
import { DareCoachModal } from './components/DareCoachModal';
import { SocialActivityFeed } from './components/SocialActivityFeed';
import { ConfettiEffect, triggerConfetti } from './components/ConfettiEffect';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useAuth } from './hooks/useAuth';
import { db } from './lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { DareItem, UserProfile, NotificationItem, CredTransaction } from './types';
import { isSoundEnabled, toggleSound, playSound } from './utils/soundEffects';
import { AlertCircle, Flame, Plus, ShieldCheck, Sparkles, Terminal, HelpCircle, FileText, Lock, Mail, Link2 } from 'lucide-react';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname.toLowerCase());

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname.toLowerCase());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.toLowerCase());
  };
  const { user, signIn, logout } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'u_dareday',
    handle: '@daredaylabs',
    name: 'DARE Ops',
    avatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80',
    cred: 4250,
    rank: 'Overclock Master',
    completedDaresCount: 14,
    createdDaresCount: 19,
    streak: 6,
    badges: ['👑 Core Founder', '💎 Circuit Breaker (5-Day)', '⚡ Spark Netrunner', '🔥 10x Streak'],
  });

  const [dares, setDares] = useState<DareItem[]>([]);
  const [stats, setStats] = useState<{
    totalDares: number;
    totalCredPool: number;
    verifiedDares: number;
  }>({
    totalDares: 0,
    totalCredPool: 0,
    verifiedDares: 0,
  });

  const [loading, setLoading] = useState(true);
  const [soundActive, setSoundActive] = useState(true);

  // Filters & Search
  const [activeTab, setActiveTab] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [targetFilter, setTargetFilter] = useState<'all' | 'public' | 'direct'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Notifications state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isCredLogOpen, setIsCredLogOpen] = useState(false);
  const [isProofGalleryOpen, setIsProofGalleryOpen] = useState(false);
  const [isOracleSurpriseOpen, setIsOracleSurpriseOpen] = useState(false);
  const [isProUpgradeOpen, setIsProUpgradeOpen] = useState(false);
  const [isEventsMerchOpen, setIsEventsMerchOpen] = useState(false);
  const [isArmoryOpen, setIsArmoryOpen] = useState(false);
  const [isSeasonPassOpen, setIsSeasonPassOpen] = useState(false);
  const [stakingDare, setStakingDare] = useState<DareItem | null>(null);
  const [isTournamentsOpen, setIsTournamentsOpen] = useState(false);
  const [isLiveDuelsOpen, setIsLiveDuelsOpen] = useState(false);
  const [isDropZonesOpen, setIsDropZonesOpen] = useState(false);
  const [shareCardDare, setShareCardDare] = useState<DareItem | null>(null);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab | null>(null);
  const [proofSubmissionDare, setProofSubmissionDare] = useState<DareItem | null>(null);
  const [proofViewingDare, setProofViewingDare] = useState<DareItem | null>(null);
  const [coachingDare, setCoachingDare] = useState<DareItem | null>(null);
  const [commentsViewingDare, setCommentsViewingDare] = useState<DareItem | null>(null);
  const [shareToast, setShareToast] = useState<ToastData | null>(null);
  const [expiryReminderToast, setExpiryReminderToast] = useState<ExpiryToastData | null>(null);
  const [notifiedExpiries, setNotifiedExpiries] = useState<Record<string, boolean>>({});
  const [highlightedDareId, setHighlightedDareId] = useState<string | null>(null);
  const [profileViewingUser, setProfileViewingUser] = useState<UserProfile | null>(null);
  const [profileModalTab, setProfileModalTab] = useState<'heatmap' | 'location-map' | 'completed' | 'created' | 'settings' | 'squad' | 'rivalry'>('heatmap');
  const [directTargetUserHandle, setDirectTargetUserHandle] = useState<string | undefined>(undefined);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [transactions, setTransactions] = useState<CredTransaction[]>([]);
  const [dailyMission, setDailyMission] = useState<DareItem | null>(null);

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadNotificationsCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  const fetchDailyMission = async () => {
    try {
      const res = await fetch(`/api/users/${currentUser.id}/daily-mission`);
      if (res.ok) {
        const data = await res.json();
        setDailyMission(data);
      }
    } catch (e) {
      console.error('Error fetching daily mission:', e);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (e) {
      console.error('Error fetching transactions:', e);
    }
  };

  // Fetch Users & Leaderboard
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        // Sync currentUser object if in list
        const found = data.find((u: UserProfile) => u.id === currentUser.id);
        if (found) setCurrentUser(found);
        
        // Sync profileViewingUser if currently viewing someone
        if (profileViewingUser) {
          const updatedViewing = data.find((u: UserProfile) => u.id === profileViewingUser.id);
          if (updatedViewing) setProfileViewingUser(updatedViewing);
        }
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  // Fetch Dares
  const fetchDares = async () => {
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.append('tab', activeTab);
      if (activeCategory !== 'all') params.append('category', activeCategory);
      if (targetFilter !== 'all') params.append('target', targetFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('userId', currentUser.id);

      const res = await fetch(`/api/dares?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDares(data);
      }
    } catch (e) {
      console.error('Error fetching dares:', e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  useEffect(() => {
    if (user) {
      const handle = user.email ? `@${user.email.split('@')[0]}` : `@${user.uid.slice(0, 8)}`;
      const profileToSync: Partial<UserProfile> = {
        id: user.uid,
        name: user.displayName || 'DARE Operative',
        handle: handle,
        avatar: user.photoURL || currentUser.avatar,
      };

      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileToSync),
      })
        .then(res => res.json())
        .then((syncedUser: UserProfile) => {
          if (syncedUser && syncedUser.id) {
            setCurrentUser(syncedUser);
          }
          fetchUsers();
          fetchDailyMission();
        })
        .catch(err => console.error('Error syncing auth user:', err));

      // Client-side Firestore sync with authenticated user credentials
      try {
        setDoc(doc(db, 'users', user.uid), profileToSync, { merge: true }).catch(() => {});
      } catch (e) {
        // Ignore fallback
      }
    }
  }, [user]);

  useEffect(() => {
    // Sync current user with server on launch
    fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentUser),
    }).then(() => {
      fetchUsers();
      fetchDailyMission();
    }).catch(err => console.error('Error syncing user:', err));

    fetchStats();
    fetchDailyMission();
    fetchTransactions();

    // Check if direct link to dare was passed via ?dare=<id> or referral ?ref=...
    const urlParams = new URLSearchParams(window.location.search);
    const linkedDareId = urlParams.get('dare');
    if (linkedDareId) {
      setHighlightedDareId(linkedDareId);
    }

    const refCode = urlParams.get('ref');
    if (refCode) {
      localStorage.setItem('dareday_applied_ref', refCode);
      // Auto credit referral bonus toast or state if needed
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchDailyMission();
  }, [currentUser.id]);

  useEffect(() => {
    fetchDares();
  }, [activeTab, activeCategory, targetFilter, searchQuery, currentUser.id]);

  // Smooth scroll to targeted dare once dares are loaded
  useEffect(() => {
    if (!highlightedDareId || loading || dares.length === 0) return;
    const timer = setTimeout(() => {
      const targetElement = document.getElementById(`dare-card-${highlightedDareId}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [highlightedDareId, loading, dares]);

  // Check for dares close to expiration (1 hour before expiry reminder)
  useEffect(() => {
    const runExpiryCheck = () => {
      if (!currentUser || dares.length === 0) return;

      const now = Date.now();
      
      // Filter for dares currently accepted by the user
      const userAcceptedDares = dares.filter(
        (d) => d.status === 'accepted' && d.acceptedBy?.id === currentUser.id && d.expiresAt
      );

      for (const dare of userAcceptedDares) {
        if (!dare.expiresAt) continue;

        const expiresTime = new Date(dare.expiresAt).getTime();
        const msLeft = expiresTime - now;

        // Trigger reminder if less than 1 hour (3600000ms) left, but still in progress (> 0)
        if (msLeft > 0 && msLeft <= 3600000) {
          if (!notifiedExpiries[dare.id]) {
            const minutesLeft = Math.ceil(msLeft / 60000);
            
            setExpiryReminderToast({
              id: `${dare.id}_${now}`,
              dareId: dare.id,
              dareTitle: dare.title,
              timeLeftMinutes: minutesLeft,
              expiresAtString: dare.expiresAt,
            });

            // Mark as notified so we don't spam the user
            setNotifiedExpiries((prev) => ({ ...prev, [dare.id]: true }));
            
            // Play notification sound
            playSound('notification');
            break; // Show one at a time
          }
        }
      }
    };

    runExpiryCheck();
    const interval = setInterval(runExpiryCheck, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [dares, currentUser.id, notifiedExpiries]);

  const handleToggleSound = () => {
    const updated = toggleSound();
    setSoundActive(updated);
  };

  // Direct Dare Share Handler
  const handleDareShare = (dare: DareItem, url: string) => {
    playSound('oracle');
    setShareToast({
      id: String(Date.now()),
      dareId: dare.id,
      dareTitle: dare.title,
      url,
    });
  };

  // Accept a Dare
  const handleAcceptDare = async (dare: DareItem) => {
    playSound('accept');
    try {
      const res = await fetch(`/api/dares/${dare.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDares((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        fetchStats();
        fetchNotifications();
      }
    } catch (e) {
      console.error('Failed to accept dare:', e);
    }
  };

  // Toggle Like
  const handleToggleLike = async (dareId: string) => {
    try {
      const res = await fetch(`/api/dares/${dareId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setDares((prev) =>
          prev.map((d) =>
            d.id === dareId
              ? { ...d, likes: data.likes, likedUserIds: data.likedUserIds }
              : d
          )
        );
      }
    } catch (e) {
      console.error('Failed to toggle like:', e);
    }
  };

  // Community Vote on Proof (Legit vs Busted)
  const handleVoteProof = async (dareId: string, vote: 'legit' | 'busted') => {
    try {
      const res = await fetch(`/api/dares/${dareId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, vote }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDares((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        setProofViewingDare(updated);
        fetchUsers();
        fetchStats();
        fetchNotifications();
        if (vote === 'legit') {
          triggerConfetti();
        }
      }
    } catch (e) {
      console.error('Failed to vote:', e);
    }
  };

  // Direct Rematch Request Handler
  const handleRequestRematch = async (targetHandle: string, previousDareTitle: string) => {
    try {
      const res = await fetch('/api/rivalry/rematch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: currentUser.id,
          targetUserHandle: targetHandle,
          previousDareTitle,
        }),
      });
      if (res.ok) {
        setShareToast({
          id: `toast_rematch_${Date.now()}`,
          dareId: 'rematch',
          dareTitle: `🔥 Rematch challenge transmitted to ${targetHandle}!`,
          url: window.location.origin,
        });
        fetchNotifications();
      }
    } catch (e) {
      console.error('Failed to send rematch:', e);
    }
  };

  // Add Comment (Text or Voice Note)
  const handleAddComment = async (
    dareId: string, 
    text: string, 
    isVoiceNote?: boolean, 
    voiceDuration?: number
  ) => {
    try {
      const res = await fetch(`/api/dares/${dareId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser.id, 
          text, 
          isVoiceNote: Boolean(isVoiceNote),
          voiceDuration 
        }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setDares((prev) =>
          prev.map((d) =>
            d.id === dareId ? { ...d, comments: [...d.comments, newComment] } : d
          )
        );
        if (commentsViewingDare && commentsViewingDare.id === dareId) {
          setCommentsViewingDare({
            ...commentsViewingDare,
            comments: [...commentsViewingDare.comments, newComment],
          });
        }
        fetchNotifications();
      }
    } catch (e) {
      console.error('Failed to post comment:', e);
    }
  };

  // Notification Action Handlers
  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark notification read:', e);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadNotificationsCount(0);
    } catch (e) {
      console.error('Failed to mark all notifications read:', e);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.read) {
          setUnreadNotificationsCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (e) {
      console.error('Failed to delete notification:', e);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await fetch(`/api/notifications?userId=${currentUser.id}`, { method: 'DELETE' });
      setNotifications([]);
      setUnreadNotificationsCount(0);
    } catch (e) {
      console.error('Failed to clear notifications:', e);
    }
  };

  const handleNavigateToDare = (dareId: string) => {
    playSound('click');
    setSearchQuery('');
    setActiveCategory('all');
    setActiveTab('feed');
    setHighlightedDareId(dareId);
    setTimeout(() => {
      const el = document.getElementById(`dare-card-${dareId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 250);
  };

  // Live incoming alert simulation for immediate testing
  const handleSimulateNotification = () => {
    const otherUsers = users.filter((u) => u.id !== currentUser.id);
    const randomActor = otherUsers[Math.floor(Math.random() * otherUsers.length)] || {
      handle: '@Vortex_99',
      name: 'Vortex Pulse',
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
    };

    const sampleDares = dares.length > 0 ? dares : [
      { id: 'dare_001', title: 'Code an entire Retro Synthwave Terminal in 15 Minutes Blindfolded' },
      { id: 'dare_002', title: '10-Minute Dark Synth Beat Loop' },
    ];
    const randomDare = sampleDares[Math.floor(Math.random() * sampleDares.length)];

    const simTypes = [
      {
        type: 'dare_accepted' as const,
        title: 'Dare Accepted!',
        message: `${randomActor.handle} accepted your challenge "${randomDare.title}"`,
      },
      {
        type: 'proof_voted' as const,
        title: 'Evidence Voted LEGIT!',
        message: `${randomActor.handle} verified your proof for "${randomDare.title}" as LEGIT`,
        voteType: 'legit' as const,
      },
      {
        type: 'comment_received' as const,
        title: 'New Comment / Heckle',
        message: `${randomActor.handle} commented: "Total cyber wizardry! Next level execution."`,
      },
    ];
    const picked = simTypes[Math.floor(Math.random() * simTypes.length)];

    const newSimNotif: NotificationItem = {
      id: `sim_${Date.now()}`,
      userId: currentUser.id,
      type: picked.type,
      title: picked.title,
      message: picked.message,
      dareId: randomDare.id,
      dareTitle: randomDare.title,
      actorHandle: randomActor.handle,
      actorName: randomActor.name,
      actorAvatar: randomActor.avatar,
      voteType: picked.voteType,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [newSimNotif, ...prev]);
    setUnreadNotificationsCount((c) => c + 1);
    playSound('notification');
  };

  const handleSimulateExpiryNotification = () => {
    // Find an active accepted dare, or create a mock accepted dare that expires in 45 minutes
    const activeAccepted = dares.find(d => d.status === 'accepted' && d.acceptedBy?.id === currentUser.id);
    const targetTitle = activeAccepted ? activeAccepted.title : 'Hyper-Overclocked Core Hackathon';
    const targetId = activeAccepted ? activeAccepted.id : `mock_${Date.now()}`;
    const mockExpiryToast: ExpiryToastData = {
      id: `${targetId}_${Date.now()}`,
      dareId: targetId,
      dareTitle: targetTitle,
      timeLeftMinutes: 45,
      expiresAtString: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    };

    setExpiryReminderToast(mockExpiryToast);
    playSound('notification');
  };

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (currentPath === '/privacy' || currentPath === '/privacy-policy') {
    return (
      <PrivacyPolicyPage
        onBack={() => {
          navigateTo('/');
        }}
      />
    );
  }

  if (currentPath === '/terms' || currentPath === '/terms-of-service') {
    return (
      <TermsOfServicePage
        onBack={() => {
          navigateTo('/');
        }}
      />
    );
  }

  const appContent = (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Navbar */}
      <Navbar
        currentUser={user ? currentUser : undefined}
        allUsers={users}
        onSelectUser={(u) => setCurrentUser(u)}
        onSignIn={signIn}
        onSignOut={logout}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenTournaments={() => setIsTournamentsOpen(true)}
        onOpenLiveDuels={() => setIsLiveDuelsOpen(true)}
        onOpenDropZones={() => setIsDropZonesOpen(true)}
        onOpenLegalModal={(tab) => setLegalModalTab(tab || 'faq')}
        onOpenCredLog={() => setIsCredLogOpen(true)}
        onOpenProUpgrade={() => setIsProUpgradeOpen(true)}
        onOpenEventsMerch={() => setIsEventsMerchOpen(true)}
        onOpenArmory={() => setIsArmoryOpen(true)}
        onOpenSeasonPass={() => setIsSeasonPassOpen(true)}
        onOpenProfile={(u, tab) => {
          setProfileModalTab(tab || 'heatmap');
          setProfileViewingUser(u);
        }}
        soundActive={soundActive}
        onToggleSound={handleToggleSound}
        notifications={notifications}
        unreadNotificationsCount={unreadNotificationsCount}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onDeleteNotification={handleDeleteNotification}
        onClearAllNotifications={handleClearAllNotifications}
        onNavigateToDare={handleNavigateToDare}
        onSimulateNotification={handleSimulateNotification}
        onSimulateExpiryNotification={handleSimulateExpiryNotification}
        stats={stats}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Hero Banner with Filters & Quick Oracle Button */}
      <HeroBanner
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        targetFilter={targetFilter}
        onSelectTarget={setTargetFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onTriggerOracle={() => setIsOracleSurpriseOpen(true)}
        onOpenLiveDuels={() => setIsLiveDuelsOpen(true)}
        onOpenDropZones={() => setIsDropZonesOpen(true)}
        dailyMission={dailyMission}
        onStartMission={async (dare) => {
          setSearchQuery('');
          setActiveCategory('all');
          setActiveTab('feed');
          if (dare.status === 'open') {
            await handleAcceptDare(dare);
          }
          setHighlightedDareId(dare.id);
          setTimeout(() => {
            const el = document.getElementById(`dare-card-${dare.id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 250);
        }}
      />

      {/* Main Content Feed Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
        {/* In-App PWA Install Banner */}
        <PWAInstallButton variant="banner" />

        {/* Daily Operations Matrix & Trifecta Safe Hub */}
        <DailyMissionWidget
          currentUser={currentUser}
          onUserUpdate={(updated) => {
            setCurrentUser(updated);
            setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
            fetchStats();
          }}
          mission={dailyMission}
          onStartMission={async (dare) => {
            setSearchQuery('');
            setActiveCategory('all');
            setActiveTab('feed');
            if (dare.status === 'open') {
              await handleAcceptDare(dare);
            }
            setHighlightedDareId(dare.id);
            setTimeout(() => {
              const el = document.getElementById(`dare-card-${dare.id}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 250);
          }}
          onNavigateAction={(action) => {
            if (action === 'feed_vote') {
              setActiveTab('submitted');
            } else if (action === 'create_dare') {
              setIsCreateModalOpen(true);
            } else {
              setActiveTab('all');
            }
          }}
        />

        {/* Direct Targeted Dare Notice for Current User if any exist */}
        {dares.some(d => d.targetType === 'direct' && d.targetUserHandle === currentUser.handle && d.status === 'open') && (
          <div className="mb-6 rounded-2xl border border-pink-500/60 bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-slate-900/60 p-4 shadow-xl glow-magenta animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400">
                  <Flame className="h-6 w-6 text-pink-400" />
                </div>
                <div>
                  <h3 className="font-tech text-base font-bold text-white tracking-wide">
                    DIRECT CHALLENGES PENDING FOR {currentUser.handle}!
                  </h3>
                  <p className="text-xs text-pink-200">
                    A peer has targeted you specifically with a high-voltage dare. Accept the challenge to claim the Cred bounty.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setTargetFilter('direct');
                  playSound('click');
                }}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-pink-400 bg-pink-500/30 px-3.5 py-1.5 text-xs font-mono font-bold text-pink-200 hover:bg-pink-500/40 transition-colors"
              >
                Filter My Dares →
              </button>
            </div>
          </div>
        )}

        {/* Dares Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400 bg-cyan-950/40 glow-cyan">
              <Sparkles className="h-7 w-7 text-cyan-400 animate-spin" />
            </div>
            <div className="font-mono text-sm text-cyan-300 animate-pulse tracking-wider">
              SCANNING GRID FOR ACTIVE BOUNTIES...
            </div>
          </div>
        ) : dares.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-slate-800 bg-[#0b0f19]/60 p-8">
            <Terminal className="h-12 w-12 text-slate-600 mb-3" />
            <h3 className="font-tech text-xl font-bold text-slate-300">
              NO ACTIVE DARES DETECTED IN THIS SECTOR
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-md">
              No dares match the selected filters or search terms. Be the catalyst and deploy a new challenge to the network!
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  setActiveTab('all');
                  setActiveCategory('all');
                  setTargetFilter('all');
                  setSearchQuery('');
                }}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Reset All Filters
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 glow-cyan"
              >
                <Plus className="h-4 w-4" />
                <span>Deploy Dare</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {highlightedDareId && (
              <div 
                id="direct-dare-link-banner"
                className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/50 bg-cyan-950/40 p-4 text-xs font-mono text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.2)] backdrop-blur-md"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400 bg-cyan-900/60 text-cyan-300 glow-cyan">
                    <Link2 className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-cyan-200">
                      <span>Direct Dare Link Activated</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                    </div>
                    <span className="text-[11px] text-slate-300">
                      Highlighting direct grid target dare <span className="text-white font-bold">#{highlightedDareId}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`dare-card-${highlightedDareId}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="rounded-lg border border-cyan-500/40 bg-cyan-900/40 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-800/60 transition-colors"
                  >
                    Scroll To Dare
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHighlightedDareId(null);
                      const url = new URL(window.location.href);
                      url.searchParams.delete('dare');
                      window.history.replaceState({}, '', url.toString());
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    Clear Target
                  </button>
                </div>
              </div>
            )}

            <SocialActivityFeed transactions={transactions} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dares.map((dare) => (
                <DareCard
                  key={dare.id}
                  dare={dare}
                  currentUser={currentUser}
                  onAccept={handleAcceptDare}
                  onSubmitProof={(d) => setProofSubmissionDare(d)}
                  onViewProof={(d) => setProofViewingDare(d)}
                  onOpenCoach={(d) => setCoachingDare(d)}
                  onOpenStake={(d) => setStakingDare(d)}
                  onOpenShareCard={(d) => setShareCardDare(d)}
                  onToggleLike={handleToggleLike}
                  onToggleComments={(d) => setCommentsViewingDare(d)}
                  onShare={handleDareShare}
                  onOpenProfile={(userId) => {
                    const foundUser = users.find((u) => u.id === userId);
                    if (foundUser) {
                      setProfileViewingUser(foundUser);
                    }
                  }}
                  isHighlighted={dare.id === highlightedDareId}
                />
              ))}
            </div>
          </div>
        )}

      </main>




      {/* Modals & Drawers */}
      <CreateDareModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setDirectTargetUserHandle(undefined);
        }}
        currentUser={currentUser}
        allUsers={users}
        initialTargetUserHandle={directTargetUserHandle}
        onOpenSafetyModal={() => setLegalModalTab('safety')}
        onDareCreated={(newDare) => {
          setDares((prev) => [newDare, ...prev]);
          fetchStats();
          fetchUsers();
        }}
      />

      <ProofModal
        dare={proofSubmissionDare}
        currentUser={currentUser}
        isOpen={!!proofSubmissionDare}
        onClose={() => setProofSubmissionDare(null)}
        onProofSubmitted={(updated) => {
          setDares((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          setProofViewingDare(updated);
          fetchStats();
          fetchUsers();
          if (updated.status === 'verified') {
            triggerConfetti();
          }
        }}
      />

      <ProofViewerModal
        dare={proofViewingDare}
        currentUser={currentUser}
        isOpen={!!proofViewingDare}
        onClose={() => setProofViewingDare(null)}
        onVote={handleVoteProof}
        onShare={handleDareShare}
        onRequestRematch={handleRequestRematch}
        onOpenShareCard={(d) => setShareCardDare(d)}
      />

      {/* Holographic Cyber Share Card Modal */}
      <ShareCardModal
        isOpen={!!shareCardDare}
        onClose={() => setShareCardDare(null)}
        dare={shareCardDare}
        currentUser={currentUser}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        users={users}
        currentUserId={currentUser.id}
        onOpenProfile={(u) => setProfileViewingUser(u)}
      />

      <CredLogModal
        isOpen={isCredLogOpen}
        onClose={() => setIsCredLogOpen(false)}
        currentUser={currentUser}
      />

      <OracleSurpriseModal
        isOpen={isOracleSurpriseOpen}
        onClose={() => setIsOracleSurpriseOpen(false)}
        currentUser={currentUser}
        onDeployGeneratedDare={(newDare) => {
          setDares((prev) => [newDare, ...prev]);
          fetchStats();
          fetchUsers();
        }}
        onOpenProUpgrade={() => setIsProUpgradeOpen(true)}
      />

      <CommentsDrawer
        dare={commentsViewingDare}
        currentUser={currentUser}
        isOpen={!!commentsViewingDare}
        onClose={() => setCommentsViewingDare(null)}
        onAddComment={handleAddComment}
      />

      {/* Comprehensive FAQ, Terms of Service & Safety Codex Modal */}
      <LegalAndFaqModal
        isOpen={!!legalModalTab}
        onClose={() => setLegalModalTab(null)}
        defaultTab={legalModalTab || 'faq'}
      />

      <EventsMerchModal
        isOpen={isEventsMerchOpen}
        onClose={() => setIsEventsMerchOpen(false)}
      />

      {/* AI Dare Coach Modal */}
      <DareCoachModal
        isOpen={!!coachingDare}
        dare={coachingDare}
        currentUser={currentUser}
        onClose={() => setCoachingDare(null)}
        onAccept={handleAcceptDare}
        onSubmitProof={(d) => setProofSubmissionDare(d)}
      />

      {/* Pro Upgrade Premium Tier Selection & Subscription Engine */}
      <ProUpgradeModal
        isOpen={isProUpgradeOpen}
        onClose={() => setIsProUpgradeOpen(false)}
        currentUser={currentUser}
        onUpgradeSuccess={(updatedUser) => {
          setCurrentUser(updatedUser);
          setUsers((prev) => prev.map((u) => u.id === updatedUser.id ? updatedUser : u));
          fetchStats();
          triggerConfetti();
        }}
      />

      {/* Visual Direct Share Link Copied Toast Notification */}
      <ShareToast
        toast={shareToast}
        onDismiss={() => setShareToast(null)}
      />

      {/* Cyber Expiry Reminder Push Toast */}
      <ExpiryNotificationToast
        toast={expiryReminderToast}
        onDismiss={() => setExpiryReminderToast(null)}
        onSubmitProof={() => {
          const dare = dares.find((d) => d.id === expiryReminderToast?.dareId);
          if (dare) {
            setProofSubmissionDare(dare);
          } else {
            // Handle simulated mock challenge upload gracefully
            setProofSubmissionDare({
              id: expiryReminderToast?.dareId || 'mock',
              title: expiryReminderToast?.dareTitle || 'Mock Challenge',
              description: 'This is a simulated challenge approaching its expiration deadline. Prove your supremacy!',
              proofRequirement: 'Provide video or photo telemetry logs.',
              category: 'physical',
              difficulty: 'Level 2 - Moderate',
              rewardCred: 60,
              creator: {
                id: 'u_dareday',
                handle: '@daredaylabs',
                name: 'DARE Ops',
                avatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150',
              },
              targetType: 'public',
              status: 'accepted',
              createdAt: new Date().toISOString(),
              likes: 12,
              likedUserIds: [],
              comments: [],
            });
          }
          setExpiryReminderToast(null);
        }}
      />

      <UserProfileModal
        isOpen={!!profileViewingUser}
        onClose={() => setProfileViewingUser(null)}
        user={profileViewingUser}
        dares={dares}
        currentUser={currentUser}
        allUsers={users}
        initialTab={profileModalTab}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
          setProfileViewingUser(updated);
        }}
        onOpenUpgradeModal={() => setIsProUpgradeOpen(true)}
        onOpenProofGallery={() => setIsProofGalleryOpen(true)}
        onSquadAction={() => {
          fetchUsers();
          fetchDares();
          fetchNotifications();
        }}
        onOpenProfile={(u) => {
          setProfileModalTab('heatmap');
          setProfileViewingUser(u);
        }}
        onDirectChallenge={(targetHandle) => {
          setProfileViewingUser(null);
          setDirectTargetUserHandle(targetHandle);
          setIsCreateModalOpen(true);
        }}
        onOpenProofModal={(dare) => {
          setProfileViewingUser(null);
          setProofViewingDare(dare);
        }}
        onRequestRematch={handleRequestRematch}
        onOpenDropZones={() => {
          setProfileViewingUser(null);
          setIsDropZonesOpen(true);
        }}
      />

      <SquadTournamentsModal
        isOpen={isTournamentsOpen}
        onClose={() => setIsTournamentsOpen(false)}
        currentUser={currentUser}
        onUserCredUpdated={(newCred) => {
          setCurrentUser(prev => ({ ...prev, cred: newCred }));
          fetchUsers();
          fetchTransactions();
        }}
        onOpenCreateDare={(prefillTitle) => {
          setIsTournamentsOpen(false);
          setIsCreateModalOpen(true);
        }}
        onOpenLiveDuels={() => {
          setIsTournamentsOpen(false);
          setIsLiveDuelsOpen(true);
        }}
      />

      {/* Live Head-to-Head Duels Arena Modal */}
      <LiveDuelsArenaModal
        isOpen={isLiveDuelsOpen}
        onClose={() => setIsLiveDuelsOpen(false)}
        currentUser={currentUser}
        onUserCredUpdated={(newCred) => {
          setCurrentUser(prev => ({ ...prev, cred: newCred }));
          fetchUsers();
          fetchTransactions();
        }}
      />

      {/* Cyber Armory & Black Market Exchange Modal */}
      <CyberArmoryModal
        isOpen={isArmoryOpen}
        onClose={() => setIsArmoryOpen(false)}
        currentUser={currentUser}
        onUserUpdate={(updated) => {
          setCurrentUser(updated);
          setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
          fetchStats();
        }}
        onOpenStipendOrPro={() => {
          setIsArmoryOpen(false);
          setIsProUpgradeOpen(true);
        }}
      />

      {/* Season 1: Neon Insurgency Battle Pass Modal */}
      <SeasonPassModal
        isOpen={isSeasonPassOpen}
        onClose={() => setIsSeasonPassOpen(false)}
        currentUser={currentUser}
        onUserUpdate={(updated) => {
          setCurrentUser(updated);
          setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
          fetchStats();
        }}
        onOpenArmory={() => {
          setIsSeasonPassOpen(false);
          setIsArmoryOpen(true);
        }}
      />

      {/* High-Roller Dare Staking Modal */}
      <DareStakingModal
        isOpen={!!stakingDare}
        dare={stakingDare}
        currentUser={currentUser}
        onClose={() => setStakingDare(null)}
        onUserUpdate={(updated) => {
          setCurrentUser(updated);
          setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
          fetchStats();
        }}
      />

      <ProofGalleryModal
        isOpen={isProofGalleryOpen}
        onClose={() => setIsProofGalleryOpen(false)}
        currentUser={currentUser}
        onSelectProofDare={(dare) => setProofViewingDare(dare)}
      />

      <HelpBubbleSystem
        currentUser={currentUser}
        onOpenCreateModal={() => {
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setIsEventsMerchOpen(false);
          setProfileViewingUser(null);
          setIsCreateModalOpen(true);
        }}
        onTriggerOracle={() => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsProUpgradeOpen(false);
          setIsEventsMerchOpen(false);
          setProfileViewingUser(null);
          setIsOracleSurpriseOpen(true);
        }}
        onOpenLeaderboard={() => {
          setIsCreateModalOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setIsEventsMerchOpen(false);
          setProfileViewingUser(null);
          setIsLeaderboardOpen(true);
        }}
        onOpenCredLog={() => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setIsEventsMerchOpen(false);
          setProfileViewingUser(null);
          setIsCredLogOpen(true);
        }}
        onOpenProofGallery={() => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setIsEventsMerchOpen(false);
          setProfileViewingUser(null);
          setIsProofGalleryOpen(true);
        }}
        onOpenEventsMerch={() => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setIsTournamentsOpen(false);
          setProfileViewingUser(null);
          setIsEventsMerchOpen(true);
        }}
        onOpenTournaments={() => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setIsEventsMerchOpen(false);
          setProfileViewingUser(null);
          setIsTournamentsOpen(true);
        }}
        onOpenProfile={(u, tab) => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setIsEventsMerchOpen(false);
          setProfileModalTab(tab || 'heatmap');
          setProfileViewingUser(u);
        }}
        onSelectTargetFilter={(target) => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setIsEventsMerchOpen(false);
          setProfileViewingUser(null);
          setTargetFilter(target);
        }}
        onSelectCategory={(cat) => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setIsEventsMerchOpen(false);
          setProfileViewingUser(null);
          setActiveCategory(cat);
        }}
        onResetFilters={() => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setIsEventsMerchOpen(false);
          setProfileViewingUser(null);
          setActiveTab('all');
          setActiveCategory('all');
          setTargetFilter('all');
          setSearchQuery('');
        }}
        onCloseAllModals={() => {
          setIsCreateModalOpen(false);
          setIsLeaderboardOpen(false);
          setIsCredLogOpen(false);
          setIsProofGalleryOpen(false);
          setIsOracleSurpriseOpen(false);
          setIsProUpgradeOpen(false);
          setIsEventsMerchOpen(false);
          setIsTournamentsOpen(false);
          setProfileViewingUser(null);
        }}
      />

      {/* Geofenced Drop Zones & AR Beacons Modal */}
      <DropZonesModal
        isOpen={isDropZonesOpen}
        onClose={() => setIsDropZonesOpen(false)}
        currentUser={currentUser}
        onUserUpdate={(updated) => {
          setCurrentUser(updated);
          setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
          fetchStats();
        }}
        onNavigateToDare={(title) => {
          setIsDropZonesOpen(false);
          setSearchQuery(title);
        }}
      />

      <ConfettiEffect />

      {/* Mobile Ergonomic Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenCreate={() => setIsCreateModalOpen(true)}
        onOpenArmory={() => setIsArmoryOpen(true)}
        onOpenSeasonPass={() => setIsSeasonPassOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenTournaments={() => setIsTournamentsOpen(true)}
        onOpenLiveDuels={() => setIsLiveDuelsOpen(true)}
        onOpenDropZones={() => setIsDropZonesOpen(true)}
        onOpenCredLog={() => setIsCredLogOpen(true)}
        onOpenProUpgrade={() => setIsProUpgradeOpen(true)}
        onOpenEventsMerch={() => setIsEventsMerchOpen(true)}
        onOpenProfile={() => {
          setProfileModalTab('heatmap');
          setProfileViewingUser(currentUser);
        }}
        currentUser={currentUser}
      />

      <Footer
        currentUser={currentUser}
        onOpenProfile={(u, tab) => {
          setProfileModalTab((tab as 'heatmap' | 'location-map' | 'completed' | 'created' | 'settings' | 'squad') || 'heatmap');
          setProfileViewingUser(u);
        }}
        onOpenCredLog={() => setIsCredLogOpen(true)}
        onOpenEventsMerch={() => setIsEventsMerchOpen(true)}
        onOpenProUpgrade={() => setIsProUpgradeOpen(true)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenLegalModal={(tab) => setLegalModalTab((tab as LegalTab) || 'faq')}
        onOpenTournaments={() => setIsTournamentsOpen(true)}
      />

      {/* PWA Offline Network Connectivity Toast */}
      <OfflineIndicator />

      {/* Web Push Instant Telemetry Authorization Banner */}
      <PushNotificationBanner
        userId={currentUser.id}
        onNavigateToDare={(dareId) => setHighlightedDareId(dareId)}
      />

    </div>
  );

  return mapsApiKey ? (
    <APIProvider apiKey={mapsApiKey}>{appContent}</APIProvider>
  ) : (
    appContent
  );
}
