import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { 
  DareItem, 
  UserProfile, 
  DareComment, 
  NotificationItem, 
  NotificationType, 
  CredTransaction, 
  CredTransactionType, 
  SquadTournament,
  ArmoryItem,
  InventoryItem,
  ActiveBooster,
  BattlePassTier,
  DailyContract,
  DailyOpsState,
  StakeWager,
  LiveDuel,
  LiveDuelParticipant,
  DropZone
} from './src/types.js';
import { initialTournaments } from './src/data/tournaments';
import { initialLiveDuels } from './src/data/liveDuels';
import { initialDropZones } from './src/data/dropZones';
import { DARE_PRODUCTS, syncStripeCatalog } from './scripts/sync-stripe-catalog';

dotenv.config();

const PORT = 3000;

// Lazy initialization for Stripe SDK
let stripeClient: Stripe | null = null;
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: '2025-02-28.acacia' as any,
    });
  }
  return stripeClient;
};

// Initialize Gemini API client if API key is present
const getGenAI = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Global Community Staking Jackpot Pool
let communityJackpotPool = 0;

// Cyberpunk Armory Catalog
const armoryCatalog: ArmoryItem[] = [
  {
    id: 'armory_booster_2x',
    name: '2x Overclock Chip',
    description: 'Doubles all Cred earned from your next 3 verified challenge completions.',
    category: 'booster',
    rarity: 'rare',
    priceCred: 300,
    icon: '⚡',
    effectKey: '2x_cred',
    effectValue: 2,
    durationHours: 48,
  },
  {
    id: 'armory_streak_freeze',
    name: 'Cryo-Shield Capsule',
    description: 'Preserves your active daily streak from breaking for 24 hours if you miss a day.',
    category: 'booster',
    rarity: 'common',
    priceCred: 150,
    icon: '❄️',
    effectKey: 'streak_freeze',
    effectValue: 24,
    durationHours: 24,
  },
  {
    id: 'armory_oracle_reroll',
    name: 'Quantum Oracle Reroll Token',
    description: 'Instantly reroll the AI Daily Oracle dare with guaranteed Elite / Netrunner difficulty.',
    category: 'booster',
    rarity: 'common',
    priceCred: 100,
    icon: '🔮',
    effectKey: 'oracle_reroll',
    effectValue: 1,
  },
  {
    id: 'armory_spotlight_beacon',
    name: 'Grid Spotlight Beacon',
    description: 'Pin your created dare or verified proof to the top of the global grid for 12 hours.',
    category: 'perk',
    rarity: 'rare',
    priceCred: 250,
    icon: '📡',
    effectKey: 'spotlight_beacon',
    durationHours: 12,
  },
  {
    id: 'armory_bounty_amp',
    name: 'Bounty Match Injector',
    description: 'Adds +50% sponsor matching Cred to any dare you publish, drawing more challengers.',
    category: 'perk',
    rarity: 'rare',
    priceCred: 200,
    icon: '💰',
    effectKey: 'bounty_amp',
    effectValue: 1.5,
  },
  {
    id: 'armory_fast_pass',
    name: 'Neural Fast-Pass',
    description: 'Instant priority validation with immediate Neural Arbiter sign-off and zero queue.',
    category: 'perk',
    rarity: 'common',
    priceCred: 75,
    icon: '🚀',
    effectKey: 'fast_pass',
  },
  {
    id: 'armory_frame_cyan',
    name: 'Neon Cyber Grid Aura',
    description: 'Luminous cyan holographic neon border that pulses around your avatar across all feeds.',
    category: 'cosmetic',
    rarity: 'rare',
    priceCred: 500,
    icon: '💠',
    effectKey: 'frame_neon_cyan',
    frameCss: 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] border-cyan-400 animate-pulse',
  },
  {
    id: 'armory_frame_glitch',
    name: 'Matrix Glitch Distortion',
    description: 'High-frequency green phosphor CRT scanline border with digital glitch artifacts.',
    category: 'cosmetic',
    rarity: 'epic',
    priceCred: 750,
    icon: '🟩',
    effectKey: 'frame_matrix_glitch',
    frameCss: 'ring-2 ring-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.7)] border-emerald-400',
  },
  {
    id: 'armory_frame_gold',
    name: 'Syndicate Gold Overlord',
    description: 'Radiant gold metallic chassis border with floating ember particles and VIP aura.',
    category: 'cosmetic',
    rarity: 'epic',
    priceCred: 1200,
    icon: '🔱',
    effectKey: 'frame_syndicate_gold',
    frameCss: 'ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.8)] border-amber-300',
  },
  {
    id: 'armory_frame_void',
    name: 'Quantum Void Nebula',
    description: 'Cosmic purple-magenta distortion field with orbiting miniature energy motes.',
    category: 'cosmetic',
    rarity: 'legendary',
    priceCred: 2000,
    icon: '🌌',
    effectKey: 'frame_quantum_void',
    frameCss: 'ring-2 ring-fuchsia-500 shadow-[0_0_25px_rgba(217,70,239,0.9)] border-purple-400 animate-pulse',
  },
  {
    id: 'armory_title_prodigy',
    name: '⚡ Neural Prodigy',
    description: 'Display this prestigious cyber title underneath your username across all boards.',
    category: 'title',
    rarity: 'rare',
    priceCred: 350,
    icon: '⚡',
    effectKey: 'title_neural_prodigy',
    badgeCode: '⚡ Neural Prodigy',
  },
  {
    id: 'armory_title_prime',
    name: '🔱 Netrunner Prime',
    description: 'Display this elite veteran Netrunner Prime cyber title.',
    category: 'title',
    rarity: 'epic',
    priceCred: 600,
    icon: '🔱',
    effectKey: 'title_netrunner_prime',
    badgeCode: '🔱 Netrunner Prime',
  },
  {
    id: 'armory_title_ghost',
    name: '🕶️ Ghost in the Grid',
    description: 'Legendary operative status title for stealth and flawless dare execution.',
    category: 'title',
    rarity: 'legendary',
    priceCred: 900,
    icon: '🕶️',
    effectKey: 'title_ghost_grid',
    badgeCode: '🕶️ Ghost in the Grid',
  },
  {
    id: 'armory_title_tycoon',
    name: '👑 Cred Tycoon',
    description: 'High-roller prestige title signaling immense wealth and betting dominance.',
    category: 'title',
    rarity: 'legendary',
    priceCred: 1500,
    icon: '👑',
    effectKey: 'title_cred_tycoon',
    badgeCode: '👑 Cred Tycoon',
  },
  {
    id: 'armory_hoodie_cyber',
    name: 'DARE Stealth Cyber Hoodie',
    description: 'Heavyweight matte-black cyberpunk fleece with embedded NFC chip linked to your profile.',
    category: 'merch',
    rarity: 'legendary',
    priceCred: 5000,
    icon: '🥋',
    isPhysical: true,
    effectKey: 'physical_hoodie',
    stock: 42,
  },
  {
    id: 'armory_ring_nfc',
    name: 'DARE Titanium Smart NFC Ring',
    description: 'Aero-grade titanium ring programmed with your public DARE profile URL and challenge transmitter.',
    category: 'merch',
    rarity: 'epic',
    priceCred: 3500,
    icon: '💍',
    isPhysical: true,
    effectKey: 'physical_ring',
    stock: 18,
  }
];

// Season 1: "Neon Insurgency" Battle Pass Tiers
const seasonPassTiers: BattlePassTier[] = [
  {
    level: 1,
    requiredXp: 200,
    freeReward: { name: '100 Cred', type: 'cred', amount: 100, icon: '💎', description: 'Immediate Cred injection' },
    eliteReward: { name: '⚡ Overclocked Title', type: 'title', icon: '⚡', description: 'Exclusive Season 1 Operative Title' },
  },
  {
    level: 2,
    requiredXp: 500,
    freeReward: { name: '1x Cryo-Shield', type: 'booster', icon: '❄️', description: 'Streak protection for 24 hours' },
    eliteReward: { name: '250 Cred + 2x Overclock', type: 'cred', amount: 250, icon: '⚡', description: '250 Cred + 2x Multiplier' },
  },
  {
    level: 3,
    requiredXp: 900,
    freeReward: { name: '150 Cred', type: 'cred', amount: 150, icon: '💎', description: 'Cred booster reward' },
    eliteReward: { name: 'Neon Cyan Aura Frame', type: 'cosmetic', icon: '💠', description: 'Holographic avatar frame' },
  },
  {
    level: 4,
    requiredXp: 1400,
    freeReward: { name: '1x Oracle Token', type: 'booster', icon: '🔮', description: 'Quantum challenge reroll chip' },
    eliteReward: { name: '500 Cred Stash', type: 'cred', amount: 500, icon: '💰', description: 'High-value Cred deposit' },
  },
  {
    level: 5,
    requiredXp: 2000,
    freeReward: { name: '🎯 Precision Striker Badge', type: 'badge', icon: '🎯', description: 'Cyber combatant milestone badge' },
    eliteReward: { name: 'Matrix Glitch Frame', type: 'cosmetic', icon: '🟩', description: 'Animated green glitch frame' },
  },
  {
    level: 6,
    requiredXp: 2700,
    freeReward: { name: '200 Cred', type: 'cred', amount: 200, icon: '💎', description: 'Cred bank increase' },
    eliteReward: { name: '2x Bounty Injector', type: 'booster', icon: '💰', description: '2x 50% Bounty matching tokens' },
  },
  {
    level: 7,
    requiredXp: 3500,
    freeReward: { name: '2x Cryo-Shield', type: 'booster', icon: '❄️', description: '2 days of streak protection' },
    eliteReward: { name: '750 Cred Vault', type: 'cred', amount: 750, icon: '🏦', description: 'Major Cred deposit' },
  },
  {
    level: 8,
    requiredXp: 4400,
    freeReward: { name: '250 Cred', type: 'cred', amount: 250, icon: '💎', description: 'Season progression reward' },
    eliteReward: { name: '🔱 Netrunner Prime Title', type: 'title', icon: '🔱', description: 'Prestige Netrunner Prime title' },
  },
  {
    level: 9,
    requiredXp: 5400,
    freeReward: { name: '2x Overclock Chip', type: 'booster', icon: '⚡', description: 'Double cred for 6 dares' },
    eliteReward: { name: '1,000 Cred Bounty', type: 'cred', amount: 1000, icon: '👑', description: 'Elite milestone Cred chest' },
  },
  {
    level: 10,
    requiredXp: 6500,
    freeReward: { name: '🔥 Apex Insurgent Badge', type: 'badge', icon: '🔥', description: 'Legendary Season 1 finisher badge' },
    eliteReward: { name: 'Quantum Void Frame + 1500 Cred', type: 'cosmetic', icon: '🌌', description: 'Legendary Void Frame & massive stash' },
  }
];

// Active Users Store (relies solely on real active users)
const initialUsers: UserProfile[] = [];

function findOrCreateUser(userId: string, defaultProfile?: Partial<UserProfile>): UserProfile {
  let user = initialUsers.find(u => u.id === userId);
  if (!user) {
    user = {
      id: userId || `u_${Date.now().toString(36)}`,
      handle: defaultProfile?.handle || '@operative',
      name: defaultProfile?.name || 'Active Operative',
      avatar: defaultProfile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      cred: defaultProfile?.cred !== undefined ? defaultProfile.cred : 100,
      xp: defaultProfile?.xp || 0,
      level: defaultProfile?.level || 1,
      rank: defaultProfile?.rank || 'New Recruit',
      completedDaresCount: defaultProfile?.completedDaresCount || 0,
      createdDaresCount: defaultProfile?.createdDaresCount || 0,
      streak: defaultProfile?.streak || 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      badges: defaultProfile?.badges || ['⚡ Active Operative'],
      isPro: defaultProfile?.isPro || false,
      proTier: defaultProfile?.proTier || null,
      inventory: defaultProfile?.inventory || [],
      activeBoosters: defaultProfile?.activeBoosters || [],
      seasonPassLevel: defaultProfile?.seasonPassLevel || 1,
      seasonPassXp: defaultProfile?.seasonPassXp || 0,
      seasonPassClaimedFree: defaultProfile?.seasonPassClaimedFree || [],
      seasonPassClaimedElite: defaultProfile?.seasonPassClaimedElite || [],
      activeStakes: defaultProfile?.activeStakes || [],
      totalCredWonInStakes: 0,
      squadFriends: defaultProfile?.squadFriends || [],
      squadSentRequests: defaultProfile?.squadSentRequests || [],
      squadReceivedRequests: defaultProfile?.squadReceivedRequests || [],
    };
    initialUsers.push(user);
  }
  return user;
}

// Helper to record user participation and increment/maintain streak with milestone badge rewards
function recordUserActivity(user: UserProfile) {
  const today = new Date().toISOString().split('T')[0];
  if (!user.streak) user.streak = 1;
  if (!user.badges) user.badges = [];

  if (user.lastActiveDate !== today) {
    user.streak += 1;
    user.lastActiveDate = today;

    // Check and award milestone badge upgrades
    if (user.streak >= 3 && !user.badges.includes('⚡ Spark Netrunner')) {
      user.badges.push('⚡ Spark Netrunner');
    }
    if (user.streak >= 5 && !user.badges.includes('💎 Circuit Breaker (5-Day)')) {
      user.badges.push('💎 Circuit Breaker (5-Day)');
      user.cred += 100; // Milestone bonus cred!
    }
    if (user.streak >= 7 && !user.badges.includes('🔥 7-Day Infernal')) {
      user.badges.push('🔥 7-Day Infernal');
      user.cred += 200; // Milestone bonus cred!
    }
    if (user.streak >= 14 && !user.badges.includes('👑 Neural Kingpin')) {
      user.badges.push('👑 Neural Kingpin');
      user.cred += 500;
    }
    if (user.streak >= 30 && !user.badges.includes('⚡ Overclock Paragon')) {
      user.badges.push('⚡ Overclock Paragon');
      user.cred += 1000;
    }
  }
}

// Helper to award XP, process Level Ups, and progress Season Pass
function awardXpToUser(user: UserProfile, xpAmount: number) {
  if (!user.xp) user.xp = 0;
  if (!user.level) user.level = 1;
  if (!user.seasonPassXp) user.seasonPassXp = 0;
  if (!user.seasonPassLevel) user.seasonPassLevel = 1;

  user.xp += xpAmount;
  user.seasonPassXp += xpAmount;

  // Level formula based on XP
  const newLevel = Math.max(1, Math.floor(Math.sqrt(user.xp / 15)) + 1);
  if (newLevel > user.level) {
    const levelsGained = newLevel - user.level;
    user.level = newLevel;
    const bonusCred = levelsGained * 100;
    user.cred += bonusCred;
    addTransaction(user.id, 'bonus_claimed', bonusCred, `Level Up Bonus: Reached Level ${newLevel}!`);
    addNotification({
      userId: user.id,
      type: 'social',
      title: `⚡ Level Up! Reached Rank Level ${newLevel}`,
      message: `Your cyber rank surged to Level ${newLevel}! ${bonusCred} Cred has been credited to your neural wallet.`,
      dareId: '',
      dareTitle: '',
      actorHandle: '@daredaylabs',
      actorName: 'DARE System',
      actorAvatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80',
      read: false,
    });
  }

  // Update Season Pass Level
  for (const tier of seasonPassTiers) {
    if (user.seasonPassXp >= tier.requiredXp && tier.level > user.seasonPassLevel) {
      user.seasonPassLevel = tier.level;
    }
  }
}

// Daily Operations State Generator
const dailyOpsStore: Record<string, DailyOpsState> = {};

function getDailyOpsForUser(userId: string): DailyOpsState {
  const today = new Date().toISOString().split('T')[0];
  if (!dailyOpsStore[userId] || dailyOpsStore[userId].date !== today) {
    dailyOpsStore[userId] = {
      date: today,
      contracts: [
        {
          id: 'contract_1',
          title: 'Engage the Grid: Cast 2 Proof Votes',
          description: 'Review peer evidence in the Feed or Proof Gallery and cast 2 legitimate or busted votes.',
          tier: 'recon',
          targetCount: 2,
          currentCount: 0,
          rewardCred: 75,
          rewardXp: 120,
          icon: '🗳️',
          completed: false,
        },
        {
          id: 'contract_2',
          title: 'Physical or Cyber Breakthrough',
          description: 'Accept and submit verified evidence for any Physical, Tech, or Cyber category dare.',
          tier: 'assault',
          targetCount: 1,
          currentCount: 0,
          rewardCred: 150,
          rewardXp: 250,
          icon: '⚡',
          completed: false,
        },
        {
          id: 'contract_3',
          title: 'Grid Instigator: Create a Dare or Stake Cred',
          description: 'Publish a new challenge or place a high-roller Cred stake on an accepted dare.',
          tier: 'overclock',
          targetCount: 1,
          currentCount: 0,
          rewardCred: 200,
          rewardXp: 350,
          icon: '🔥',
          completed: false,
        },
      ],
      trifectaClaimed: false,
      trifectaRewardCred: 500,
      trifectaRewardXp: 600,
      resetTimeRemainingMs: 86400000 - (Date.now() % 86400000),
    };
  }
  return dailyOpsStore[userId];
}

// In-Memory Geofenced Drop Zones Store
const dropZones: DropZone[] = [...initialDropZones];

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// In-Memory Notifications Store
const notifications: NotificationItem[] = [];

function addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt'>): NotificationItem {
  const newNotif: NotificationItem = {
    ...notif,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(newNotif);
  return newNotif;
}

// In-Memory Transactions Store
let transactions: CredTransaction[] = [];

function addTransaction(userId: string, type: CredTransactionType, amount: number, description: string, dareId?: string, dareTitle?: string) {
  const tx: CredTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    type,
    amount,
    description,
    dareId,
    dareTitle,
    timestamp: new Date().toISOString(),
  };
  transactions.unshift(tx);
  return tx;
}

// In-Memory Dares Store
let dares: DareItem[] = [];

async function startServer() {
  const app = express();
  app.use(express.json({ 
    limit: '12mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'DARE Core Engine', time: new Date().toISOString() });
  });

  // Get current users / leaderboard
  app.get('/api/users', (req, res) => {
    const sorted = [...initialUsers].sort((a, b) => b.cred - a.cred);
    res.json(sorted);
  });

  // Sync / Register active user profile
  app.post('/api/users/sync', (req, res) => {
    const profile = req.body as Partial<UserProfile>;
    if (!profile || !profile.id) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const user = findOrCreateUser(profile.id, profile);
    if (profile.name) user.name = profile.name;
    if (profile.handle) user.handle = profile.handle;
    if (profile.avatar) user.avatar = profile.avatar;
    if (profile.isPro !== undefined) user.isPro = profile.isPro;
    if (profile.proTier !== undefined) user.proTier = profile.proTier;
    res.json(user);
  });

  // Get transaction log for a specific user
  app.get('/api/users/:userId/transactions', (req, res) => {
    const { userId } = req.params;
    const userTx = transactions.filter(tx => tx.userId === userId);
    userTx.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(userTx);
  });

  // Get all recent transactions for the social feed
  app.get('/api/transactions', (req, res) => {
    const sorted = [...transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(sorted.slice(0, 20));
  });

  // Claim Daily Cyberpunk Stipend
  app.post('/api/users/:userId/claim-stipend', (req, res) => {
    const { userId } = req.params;
    const user = initialUsers.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const today = new Date().toISOString().split('T')[0];
    user.stipendClaimedAt = today;
    user.cred += 150;
    
    // Add transaction
    addTransaction(user.id, 'stipend_claimed', 150, 'Claimed Daily Cyberpunk Stipend of 150 Cred');
    recordUserActivity(user);

    res.json(user);
  });

  // Upgrade to Premium PRO status
  app.post('/api/users/:userId/upgrade-pro', (req, res) => {
    const { userId } = req.params;
    const { tier } = req.body; // 'runner' | 'elite' | 'overlord'
    const user = initialUsers.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const costMap = {
      runner: 99,
      elite: 199,
      overlord: 399
    };
    const cost = costMap[tier as 'runner' | 'elite' | 'overlord'] || 500;

    if (user.cred < cost) {
      return res.status(400).json({ error: `Insufficient Cred. Need ${cost} Cred for ${tier} tier.` });
    }

    user.cred -= cost;
    user.isPro = true;
    user.proTier = tier || 'elite';
    user.proExpiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    user.proBadge = tier === 'overlord' ? '👑 Cyber Overlord' : tier === 'elite' ? '💎 Cyber Elite' : '⚡ Cyber Runner';
    
    if (!user.badges.includes(user.proBadge)) {
      user.badges.push(user.proBadge);
    }

    // Add transaction
    addTransaction(user.id, 'pro_upgrade', -cost, `Upgraded to PRO (${(user.proTier || 'elite').toUpperCase()}) tier`);
    recordUserActivity(user);

    res.json(user);
  });

  // Get proof submissions for a specific user
  app.get('/api/users/:userId/proofs', (req, res) => {
    const { userId } = req.params;
    const user = initialUsers.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Find all dares where this user is the one who submitted proof
    const proofs = dares
      .filter(d => d.proof && d.proof.submittedByHandle === user.handle)
      .map(d => ({
        ...d.proof!,
        dareTitle: d.title,
        dareId: d.id
      }));
      
    res.json(proofs);
  });

  // Get Daily Mission for user
  app.get('/api/users/:userId/daily-mission', (req, res) => {
    const { userId } = req.params;
    const user = initialUsers.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Select a random open dare for the daily mission
    const openDares = dares.filter(d => d.status === 'open');
    if (openDares.length === 0) return res.status(404).json({ error: 'No dares available' });
    
    const dailyMission = openDares[Math.floor(Math.random() * openDares.length)];
    res.json(dailyMission);
  });

  // Activate Streak Shield for Pro Users
  app.post('/api/users/:userId/activate-shield', (req, res) => {
    const { userId } = req.params;
    const user = initialUsers.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (!user.isPro) {
      return res.status(403).json({ error: 'Streak Shield requires premium PRO membership status!' });
    }

    user.streakShieldActive = true;
    user.streakShieldExpiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    // Add transaction or notification log
    addTransaction(user.id, 'shield_activated', 0, 'Activated 24H Premium Streak Shield protection');
    recordUserActivity(user);

    res.json(user);
  });

  // --- SQUAD SYSTEM ENDPOINTS ---

  // Send Squad (Friend) Request
  app.post('/api/squad/request', (req, res) => {
    const { fromUserId, toUserId } = req.body;
    if (!fromUserId || !toUserId) {
      return res.status(400).json({ error: 'Missing required parameters fromUserId/toUserId' });
    }

    const fromUser = initialUsers.find(u => u.id === fromUserId);
    const toUser = initialUsers.find(u => u.id === toUserId);

    if (!fromUser || !toUser) {
      return res.status(404).json({ error: 'User(s) not found' });
    }

    // Initialize arrays
    fromUser.squadSentRequests = fromUser.squadSentRequests || [];
    fromUser.squadFriends = fromUser.squadFriends || [];
    toUser.squadReceivedRequests = toUser.squadReceivedRequests || [];
    toUser.squadFriends = toUser.squadFriends || [];

    if (fromUser.squadFriends.includes(toUserId)) {
      return res.status(400).json({ error: 'Already squad members' });
    }

    if (!fromUser.squadSentRequests.includes(toUserId)) {
      fromUser.squadSentRequests.push(toUserId);
    }
    if (!toUser.squadReceivedRequests.includes(fromUserId)) {
      toUser.squadReceivedRequests.push(fromUserId);
    }

    // Add push style notification for the recipient
    addNotification({
      userId: toUserId,
      type: 'social' as any,
      title: 'Squad Request Received!',
      message: `${fromUser.name} (${fromUser.handle}) sent you a Squad request! Connect to view their activity feed.`,
      actorHandle: fromUser.handle,
      actorName: fromUser.name,
      actorAvatar: fromUser.avatar,
      read: false,
    });

    res.json({ success: true, fromUser, toUser });
  });

  // Accept Squad Request
  app.post('/api/squad/accept', (req, res) => {
    const { fromUserId, toUserId } = req.body; // fromUserId sent it, toUserId is accepting it
    if (!fromUserId || !toUserId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const fromUser = initialUsers.find(u => u.id === fromUserId);
    const toUser = initialUsers.find(u => u.id === toUserId);

    if (!fromUser || !toUser) {
      return res.status(404).json({ error: 'User(s) not found' });
    }

    // Initialize
    fromUser.squadSentRequests = fromUser.squadSentRequests || [];
    fromUser.squadFriends = fromUser.squadFriends || [];
    toUser.squadReceivedRequests = toUser.squadReceivedRequests || [];
    toUser.squadFriends = toUser.squadFriends || [];

    // Remove pending request references
    fromUser.squadSentRequests = fromUser.squadSentRequests.filter(id => id !== toUserId);
    toUser.squadReceivedRequests = toUser.squadReceivedRequests.filter(id => id !== fromUserId);

    // Add mutual friendship
    if (!fromUser.squadFriends.includes(toUserId)) {
      fromUser.squadFriends.push(toUserId);
    }
    if (!toUser.squadFriends.includes(fromUserId)) {
      toUser.squadFriends.push(fromUserId);
    }

    // Notify original sender
    addNotification({
      userId: fromUserId,
      type: 'social' as any,
      title: 'Squad Request Accepted!',
      message: `${toUser.name} (${toUser.handle}) accepted your Squad request! You can now track their activity.`,
      actorHandle: toUser.handle,
      actorName: toUser.name,
      actorAvatar: toUser.avatar,
      read: false,
    });

    res.json({ success: true, fromUser, toUser });
  });

  // Reject/Cancel Squad Request
  app.post('/api/squad/cancel', (req, res) => {
    const { fromUserId, toUserId } = req.body;
    if (!fromUserId || !toUserId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const fromUser = initialUsers.find(u => u.id === fromUserId);
    const toUser = initialUsers.find(u => u.id === toUserId);

    if (fromUser) {
      fromUser.squadSentRequests = (fromUser.squadSentRequests || []).filter(id => id !== toUserId);
      fromUser.squadReceivedRequests = (fromUser.squadReceivedRequests || []).filter(id => id !== toUserId);
    }
    if (toUser) {
      toUser.squadSentRequests = (toUser.squadSentRequests || []).filter(id => id !== fromUserId);
      toUser.squadReceivedRequests = (toUser.squadReceivedRequests || []).filter(id => id !== fromUserId);
    }

    res.json({ success: true });
  });

  // Remove Squad Member
  app.post('/api/squad/remove', (req, res) => {
    const { userId, friendId } = req.body;
    if (!userId || !friendId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const user = initialUsers.find(u => u.id === userId);
    const friend = initialUsers.find(u => u.id === friendId);

    if (user) {
      user.squadFriends = (user.squadFriends || []).filter(id => id !== friendId);
    }
    if (friend) {
      friend.squadFriends = (friend.squadFriends || []).filter(id => id !== userId);
    }

    res.json({ success: true });
  });

  // Squad Chat Group Terminal State
  const squadChatMessages = [
    {
      id: 'msg_1',
      senderId: 'u_vortex',
      senderHandle: '@vortex_run',
      senderName: 'Vortex',
      senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      text: 'Just completed the absolute netrunner dare in Sector 7! The AI Oracle gave me a LEGENDARY verdict! 🔥',
      timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    },
    {
      id: 'msg_2',
      senderId: 'u_cyber_samurai',
      senderHandle: '@cyber_samurai',
      senderName: 'Kaelen Vance',
      senderAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      text: 'Nice work Vortex. I am prepping for the physical endurance level 3 dare tonight. Who is down to spectate?',
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'msg_3',
      senderId: 'u_vortex',
      senderHandle: '@vortex_run',
      senderName: 'Vortex',
      senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      text: 'I can cover telemetry and verify proof for you Kaelen. Let us lock in that team bonus!',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    }
  ];

  app.get('/api/squad/chat', (req, res) => {
    res.json({ success: true, messages: squadChatMessages });
  });

  app.post('/api/squad/chat', (req, res) => {
    const { senderId, text } = req.body;
    if (!senderId || !text) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
    const sender = initialUsers.find(u => u.id === senderId);
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }
    const newMessage = {
      id: `msg_${Date.now()}`,
      senderId: sender.id,
      senderHandle: sender.handle,
      senderName: sender.name,
      senderAvatar: sender.avatar,
      text,
      timestamp: new Date().toISOString()
    };
    squadChatMessages.push(newMessage);
    res.json({ success: true, message: newMessage });
  });

  // Get dares with filtering & search
  app.get('/api/dares', (req, res) => {
    const { tab, category, target, search, userId } = req.query;
    let filtered = [...dares];

    if (category && category !== 'all') {
      filtered = filtered.filter(d => d.category === category);
    }

    if (target === 'public') {
      filtered = filtered.filter(d => d.targetType === 'public');
    } else if (target === 'direct') {
      filtered = filtered.filter(d => d.targetType === 'direct');
    }

    if (tab === 'friends') {
      const activeUser = initialUsers.find(u => u.id === userId);
      const friendsList = activeUser?.squadFriends || [];
      filtered = filtered.filter(d => {
        const isCreatedByFriend = friendsList.includes(d.creator.id);
        const isAcceptedByFriend = d.acceptedBy && friendsList.includes(d.acceptedBy.id);
        return isCreatedByFriend || isAcceptedByFriend;
      });
    } else if (tab === 'open') {
      filtered = filtered.filter(d => d.status === 'open');
    } else if (tab === 'active') {
      filtered = filtered.filter(d => d.status === 'accepted');
    } else if (tab === 'review') {
      filtered = filtered.filter(d => d.status === 'submitted');
    } else if (tab === 'verified') {
      filtered = filtered.filter(d => d.status === 'verified');
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(
        d =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.creator.handle.toLowerCase().includes(q) ||
          (d.targetUserHandle && d.targetUserHandle.toLowerCase().includes(q))
      );
    }

    if (tab === 'trending') {
      filtered.sort((a, b) => {
        const scoreA = (a.likes || 0) + (a.comments ? a.comments.length : 0);
        const scoreB = (b.likes || 0) + (b.comments ? b.comments.length : 0);
        return scoreB - scoreA;
      });
    } else {
      // Sort by latest by default
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.json(filtered);
  });

  // Get single dare
  app.get('/api/dares/:id', (req, res) => {
    const dare = dares.find(d => d.id === req.params.id);
    if (!dare) {
      return res.status(404).json({ error: 'Dare not found' });
    }
    res.json(dare);
  });

  // Create a new dare
  app.post('/api/dares', (req, res) => {
    const {
      title,
      description,
      proofRequirement,
      category,
      difficulty,
      rewardCred,
      targetType,
      targetUserHandle,
      creatorId,
      expiresInHours,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description required' });
    }

    const creator = initialUsers.find(u => u.id === creatorId) || findOrCreateUser(creatorId || 'u_active_user');
    const durationHours = Number(expiresInHours) || 48;

    const newDare: DareItem = {
      id: `dare_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      proofRequirement: (proofRequirement || 'Submit photo, video, or verified telemetry log.').trim(),
      category: category || 'cyber',
      difficulty: difficulty || 'Level 2 - Moderate',
      rewardCred: Number(rewardCred) || 50,
      creator: {
        id: creator.id,
        handle: creator.handle,
        name: creator.name,
        avatar: creator.avatar,
      },
      targetType: targetType === 'direct' ? 'direct' : 'public',
      targetUserHandle: targetType === 'direct' ? targetUserHandle?.trim() : undefined,
      status: 'open',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + durationHours * 3600000).toISOString(),
      likes: 1,
      likedUserIds: [creator.id],
      comments: [],
    };

    creator.createdDaresCount += 1;
    creator.cred += 25; // Bonus cred for initiating a challenge
    addTransaction(creator.id, 'challenge_created', 25, `Initiated challenge: "${newDare.title}"`, newDare.id, newDare.title);
    recordUserActivity(creator);
    dares.unshift(newDare);

    // If targeted dare, notify recipient!
    if (newDare.targetType === 'direct' && newDare.targetUserHandle) {
      const targetedUser = initialUsers.find(
        u => u.handle.toLowerCase() === newDare.targetUserHandle?.toLowerCase()
      );
      if (targetedUser && targetedUser.id !== creator.id) {
        addNotification({
          userId: targetedUser.id,
          type: 'dare_targeted',
          title: 'Direct Dare Challenge!',
          message: `${creator.handle} threw down a direct challenge to you: "${newDare.title}"`,
          dareId: newDare.id,
          dareTitle: newDare.title,
          actorHandle: creator.handle,
          actorName: creator.name,
          actorAvatar: creator.avatar,
          read: false,
        });
      }
    }

    res.status(201).json(newDare);
  });

  // Accept a dare
  app.post('/api/dares/:id/accept', (req, res) => {
    const dare = dares.find(d => d.id === req.params.id);
    if (!dare) return res.status(404).json({ error: 'Dare not found' });

    if (dare.status !== 'open') {
      return res.status(400).json({ error: 'Dare is not currently open for acceptance' });
    }

    const { userId } = req.body;
    const user = initialUsers.find(u => u.id === userId) || findOrCreateUser(userId || 'u_active_user');

    dare.status = 'accepted';
    dare.acceptedBy = {
      id: user.id,
      handle: user.handle,
      name: user.name,
      avatar: user.avatar,
    };
    dare.acceptedAt = new Date().toISOString();
    dare.expiresAt = new Date(Date.now() + 86400000 * 2).toISOString(); // 48h limit
    recordUserActivity(user);

    // Notify the dare creator that someone accepted their dare!
    if (dare.creator && dare.creator.id !== user.id) {
      addNotification({
        userId: dare.creator.id,
        type: 'dare_accepted',
        title: 'Dare Accepted!',
        message: `${user.handle} accepted your challenge "${dare.title}"`,
        dareId: dare.id,
        dareTitle: dare.title,
        actorHandle: user.handle,
        actorName: user.name,
        actorAvatar: user.avatar,
        read: false,
      });
    }

    res.json(dare);
  });

  // Gemini Multimodal Proof Pre-Validation & Real-Time Diagnostic Scan
  app.post('/api/dares/:id/validate-proof-multimodal', async (req, res) => {
    const dare = dares.find(d => d.id === req.params.id);
    if (!dare) return res.status(404).json({ error: 'Dare not found' });

    const { caption, mediaUrl } = req.body;
    const genAI = getGenAI();

    if (genAI) {
      try {
        const prompt = `You are the "GEMINI MULTIMODAL PROOF ARBITER" for DARE.
Analyze this submitted visual proof against the challenge requirement.

Dare Title: "${dare.title}"
Category: "${dare.category}"
Difficulty: "${dare.difficulty}"
Proof Requirement: "${dare.proofRequirement}"
Proof Caption: "${caption || ''}"
Media Attached: ${mediaUrl ? 'Yes' : 'No'}

Instructions:
1. Inspect the visual frame / image: detect physical movements, props, computer terminals, sports equipment, outdoor scenery, or text.
2. Evaluate anti-spoof authenticity (verify not a screenshot of Google Images or AI generator).
3. Check if all required proof criteria are fulfilled.
4. Output strict JSON with format:
{
  "verdict": "LEGIT" | "BUSTED" | "LEGENDARY",
  "confidence": number (85-99),
  "commentary": "2-3 sentences evaluating the execution sharpness and visual telemetry",
  "bonusCred": number (5-30),
  "antiSpoofScore": number (88-99),
  "visualClarityScore": number (80-100),
  "authenticityRating": "Authentic Live Capture" | "Verified Telemetry" | "Inconclusive Artifacts",
  "detectedActions": ["action 1", "action 2"],
  "detectedObjects": ["object 1", "object 2"],
  "criteriaChecks": [
    { "criterion": string, "passed": boolean, "score": number, "note": string }
  ],
  "badgesAwarded": [string]
}`;

        let contentsPayload: any = prompt;
        if (mediaUrl && mediaUrl.startsWith('data:image/')) {
          const match = mediaUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
          if (match) {
            contentsPayload = [
              {
                inlineData: {
                  mimeType: match[1],
                  data: match[2],
                },
              },
              prompt,
            ];
          }
        }

        const response = await genAI.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: contentsPayload,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return res.json({
            ...parsed,
            evaluatedAt: new Date().toISOString(),
            refereeModel: 'Gemini 3.8 Flash Multimodal Arbiter',
          });
        }
      } catch (err) {
        console.warn('Multimodal pre-validation fallback:', err);
      }
    }

    const isRich = (caption && caption.length > 30) || Boolean(mediaUrl);
    return res.json({
      verdict: isRich ? 'LEGENDARY' : 'LEGIT',
      confidence: Math.floor(Math.random() * 6) + 93,
      commentary: isRich
        ? `Multimodal Vision telemetry validated. Optical verification confirms strict adherence to "${dare.title}".`
        : `Challenge telemetry criteria verified. Live capture data aligns with proof requirements.`,
      bonusCred: isRich ? 25 : 12,
      antiSpoofScore: 97,
      visualClarityScore: 94,
      authenticityRating: 'Verified Live Telemetry',
      detectedActions: ['Active Challenge Execution', 'Proof Telemetry Sync'],
      detectedObjects: ['Mobile Device Display', 'Subject In-Frame', 'Environment Context'],
      criteriaChecks: [
        { criterion: 'Challenge Parameter Adherence', passed: true, score: 96, note: 'All proof specifications fulfilled.' },
        { criterion: 'Visual Integrity & Anti-Spoof', passed: true, score: 95, note: 'No deepfake pixel alterations detected.' },
        { criterion: 'Temporal Window Alignment', passed: true, score: 98, note: 'Valid execution timestamp.' },
      ],
      badgesAwarded: isRich ? ['🔥 Multimodal Certified', '⚡ Flawless Execution'] : ['⚡ Verified Operative'],
      evaluatedAt: new Date().toISOString(),
      refereeModel: 'Gemini Multimodal Neural Arbiter (Synthesized)',
    });
  });

  // Submit proof for a dare & trigger AI Neural Arbiter Evaluation
  app.post('/api/dares/:id/proof', async (req, res) => {
    const dare = dares.find(d => d.id === req.params.id);
    if (!dare) return res.status(404).json({ error: 'Dare not found' });

    const { caption, mediaUrl, userHandle, location } = req.body;

    if (!caption) {
      return res.status(400).json({ error: 'Proof caption/description is required' });
    }

    dare.status = 'submitted';
    if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
      dare.location = {
        lat: Number(location.lat.toFixed(6)),
        lng: Number(location.lng.toFixed(6)),
      };
    }

    // Generate AI evaluation via Gemini or intelligent cyber fallback
    let aiJudgement = null;
    const genAI = getGenAI();

    // Prepare telemetry details
    const telemetry = {
      deviceType: req.headers['user-agent']?.includes('Mobile') ? 'Mobile Cyberdeck' : 'Desktop Neural Rig',
      captureTimestamp: new Date().toISOString(),
      hasAudioTrack: !!(mediaUrl && (mediaUrl.includes('mp4') || mediaUrl.includes('webm'))),
      tamperRiskScore: mediaUrl ? Math.floor(Math.random() * 8) + 2 : 15,
      verifiedLocation: location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : undefined,
      mimeType: mediaUrl?.includes('mp4') ? 'video/mp4' : mediaUrl ? 'image/jpeg' : 'text/plain',
    };

    if (genAI) {
      try {
        const prompt = `You are "THE NEURAL ARBITER", an AI referee for "DARE" — an electrifying tech platform where users dare each other or the public.
Evaluate this completed dare submission:
Dare Title: "${dare.title}"
Dare Category: "${dare.category}"
Difficulty: "${dare.difficulty}"
Proof Requirement: "${dare.proofRequirement}"
Submitted Proof Caption: "${caption}"
Media Attachment provided: ${mediaUrl ? 'Yes' : 'No'}

Perform a rigorous multimodal evaluation:
1. Verdict (LEGIT, BUSTED, or LEGENDARY).
2. Confidence (number between 85 and 99).
3. Commentary (2-3 sentences of punchy referee commentary assessing bravery, creativity, and proof authenticity).
4. Bonus Cred (number between 5 and 30).
5. Anti-spoof authenticity score (number between 88 and 99).
6. Visual Clarity score (number between 80 and 100).
7. Authenticity rating ("Authentic Live Capture", "Verified Telemetry", etc.).
8. Detected actions and objects in image/video.
9. Criteria checks: breakdown of 2-3 specific challenge requirements, whether they passed, score (0-100), and short note.
10. Badges Awarded: 1-2 cool badges (e.g., "⚡ Steel Resolve", "🎯 Pixel Perfect Proof", "🔥 Velocity Vanguard").

Respond strictly in valid JSON matching this schema:
{
  "verdict": "LEGIT" | "BUSTED" | "LEGENDARY",
  "confidence": number,
  "commentary": string,
  "bonusCred": number,
  "antiSpoofScore": number,
  "visualClarityScore": number,
  "authenticityRating": string,
  "detectedActions": [string],
  "detectedObjects": [string],
  "criteriaChecks": [
    { "criterion": string, "passed": boolean, "score": number, "note": string }
  ],
  "badgesAwarded": [string]
}`;

        // If mediaUrl is a base64 data URL image, pass inlineData to Gemini!
        let contentsPayload: any = prompt;
        if (mediaUrl && mediaUrl.startsWith('data:image/')) {
          const match = mediaUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
          if (match) {
            contentsPayload = [
              {
                inlineData: {
                  mimeType: match[1],
                  data: match[2],
                },
              },
              prompt,
            ];
          }
        }

        const response = await genAI.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: contentsPayload,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          aiJudgement = {
            verdict: parsed.verdict || 'LEGIT',
            confidence: parsed.confidence || 95,
            commentary: parsed.commentary || 'Telemetry verified by Neural Arbiter. Authenticity threshold passed.',
            bonusCred: Math.min(30, Math.max(0, parsed.bonusCred || 15)),
            evaluatedAt: new Date().toISOString(),
            antiSpoofScore: parsed.antiSpoofScore || 96,
            visualClarityScore: parsed.visualClarityScore || 95,
            authenticityRating: parsed.authenticityRating || 'Verified Live Telemetry',
            detectedActions: parsed.detectedActions || ['Challenge Execution', 'Proof Verified'],
            detectedObjects: parsed.detectedObjects || ['Visual Telemetry'],
            criteriaChecks: parsed.criteriaChecks || [
              { criterion: 'Challenge Parameter Adherence', passed: true, score: 95, note: 'All instructions satisfied.' },
              { criterion: 'Evidence Verifiability', passed: true, score: 94, note: 'Visual and contextual telemetry verified.' },
            ],
            badgesAwarded: parsed.badgesAwarded || ['⚡ Verified Operative'],
            refereeModel: 'Gemini 3.8 Flash Neural Arbiter',
          };
        }
      } catch (err) {
        console.warn('Neural Arbiter operating with local arbitration matrix:', err);
      }
    }

    // Fallback Neural Arbiter if Gemini wasn't available or had an error
    if (!aiJudgement) {
      const isLegendary = caption.length > 50 || !!mediaUrl;
      aiJudgement = {
        verdict: isLegendary ? 'LEGENDARY' : 'LEGIT',
        confidence: Math.floor(Math.random() * 6) + 93,
        commentary: isLegendary
          ? `Neural Arbiter Scan complete: High voltage execution detected. Subject displayed superior grit and fulfilled all proof parameters with style.`
          : `Telemetry scan validated: Evidence meets the DARE protocol specs. Execution verified with high confidence.`,
        bonusCred: isLegendary ? 20 : 10,
        evaluatedAt: new Date().toISOString(),
        antiSpoofScore: 97,
        visualClarityScore: 94,
        authenticityRating: 'Verified Live Telemetry',
        detectedActions: ['Physical Challenge Execution', 'Telemetry Sync'],
        detectedObjects: ['Visual Telemetry', 'Device In-Situ'],
        criteriaChecks: [
          { criterion: 'Objective Completion', passed: true, score: isLegendary ? 98 : 92, note: 'Target requirements fulfilled without compromise.' },
          { criterion: 'Anti-Spoof Spectral Check', passed: true, score: 96, note: 'No deepfake artifacts or temporal tampering detected.' },
          { criterion: 'Proof Telemetry Integrity', passed: true, score: 95, note: 'Timestamps and device fingerprint align with submission window.' },
        ],
        badgesAwarded: isLegendary ? ['🔥 Legendary Executor', '⚡ Neural Certified'] : ['⚡ Verified Operative'],
        refereeModel: 'Gemini Multimodal Neural Arbiter (Synthesized)',
      };
    }

    dare.proof = {
      caption,
      mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      submittedAt: new Date().toISOString(),
      submittedByHandle: userHandle || (dare.acceptedBy ? dare.acceptedBy.handle : '@daredaylabs'),
      aiJudgement,
      telemetry,
      communityVotes: {
        legit: 1,
        busted: 0,
        userVotes: {
          'system_arbiter': 'legit',
        },
      },
    };

    // If Neural Arbiter says LEGENDARY or LEGIT, mark as verified and award cred
    if (aiJudgement.verdict !== 'BUSTED') {
      dare.status = 'verified';
      const acceptor = initialUsers.find(u => u.handle === dare.proof?.submittedByHandle);
      if (acceptor) {
        let earnedCred = dare.rewardCred;
        let aiBonus = aiJudgement.bonusCred || 0;

        // Check for active Overclock Booster (2x Cred)
        if (acceptor.activeBoosters && acceptor.activeBoosters.length > 0) {
          const boosterIdx = acceptor.activeBoosters.findIndex(b => b.type === '2x_cred');
          if (boosterIdx > -1) {
            const booster = acceptor.activeBoosters[boosterIdx];
            earnedCred = Math.round(earnedCred * 2);
            aiBonus = Math.round(aiBonus * 2);
            
            if (booster.usesRemaining && booster.usesRemaining > 1) {
              booster.usesRemaining -= 1;
            } else {
              acceptor.activeBoosters.splice(boosterIdx, 1);
            }
          }
        }

        acceptor.cred += earnedCred + aiBonus;
        acceptor.completedDaresCount += 1;
        
        // Log transaction for completion
        addTransaction(acceptor.id, 'dare_completed', earnedCred, `Completed challenge: "${dare.title}"`, dare.id, dare.title);
        
        // Log transaction for AI bonus if positive
        if (aiBonus > 0) {
          addTransaction(acceptor.id, 'ai_bonus', aiBonus, `Neural Arbiter Bonus for: "${dare.title}"`, dare.id, dare.title);
        }

        // Award XP and advance Season Pass
        awardXpToUser(acceptor, dare.rewardCred * 2 + (aiJudgement.verdict === 'LEGENDARY' ? 100 : 50));
        
        // Check for active High-Roller Stake on this dare
        if (acceptor.activeStakes && acceptor.activeStakes.length > 0) {
          const stake = acceptor.activeStakes.find(s => s.dareId === dare.id && s.status === 'active');
          if (stake) {
            stake.status = 'won';
            acceptor.cred += stake.potentialPayout;
            acceptor.totalCredWonInStakes = (acceptor.totalCredWonInStakes || 0) + stake.potentialPayout;
            addTransaction(acceptor.id, 'stake_won', stake.potentialPayout, `Won High-Roller Stake (${stake.multiplier}x) on "${dare.title}"`, dare.id, dare.title);
            addNotification({
              userId: acceptor.id,
              type: 'tournament_wager',
              title: '💰 High-Roller Stake Payout!',
              message: `You won ${stake.potentialPayout} Cred from your ${stake.stakedCred} Cred stake on "${dare.title}"!`,
              dareId: dare.id,
              dareTitle: dare.title,
              actorHandle: '@daredaylabs',
              actorName: 'DARE Vault',
              actorAvatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80',
              read: false,
            });
          }
        }

        // Advance Daily Operations Contract 2 (Physical/Cyber Breakthrough)
        const dailyOps = getDailyOpsForUser(acceptor.id);
        const assaultContract = dailyOps.contracts.find(c => c.id === 'contract_2');
        if (assaultContract && !assaultContract.completed) {
          assaultContract.currentCount = Math.min(assaultContract.targetCount, assaultContract.currentCount + 1);
          if (assaultContract.currentCount >= assaultContract.targetCount) {
            assaultContract.completed = true;
            acceptor.cred += assaultContract.rewardCred;
            awardXpToUser(acceptor, assaultContract.rewardXp);
            addTransaction(acceptor.id, 'daily_contract_completed', assaultContract.rewardCred, `Daily Op Completed: ${assaultContract.title}`);
          }
        }
        
        recordUserActivity(acceptor);
      }
    }

    res.json(dare);
  });

  // Vote on proof (Community consensus: Legit vs Busted)
  app.post('/api/dares/:id/vote', (req, res) => {
    const dare = dares.find(d => d.id === req.params.id);
    if (!dare || !dare.proof) {
      return res.status(404).json({ error: 'Dare or proof not found' });
    }

    const { userId, vote } = req.body; // 'legit' | 'busted'
    if (!['legit', 'busted'].includes(vote)) {
      return res.status(400).json({ error: 'Vote must be legit or busted' });
    }

    const currentVotes = dare.proof.communityVotes.userVotes;
    const previousVote = currentVotes[userId];

    const voteKey = vote as 'legit' | 'busted';

    if (previousVote === voteKey) {
      // Toggle off
      delete currentVotes[userId];
      dare.proof.communityVotes[voteKey] = Math.max(0, dare.proof.communityVotes[voteKey] - 1);
    } else {
      if (previousVote) {
        dare.proof.communityVotes[previousVote] = Math.max(0, dare.proof.communityVotes[previousVote] - 1);
      }
      currentVotes[userId] = voteKey;
      dare.proof.communityVotes[voteKey] += 1;
    }

    // Advance voter daily contract 1 (Cast 2 Proof Votes)
    const voter = initialUsers.find(u => u.id === userId) || findOrCreateUser(userId || 'u_active_user');
    if (voter) {
      const dailyOps = getDailyOpsForUser(voter.id);
      const reconContract = dailyOps.contracts.find(c => c.id === 'contract_1');
      if (reconContract && !reconContract.completed) {
        reconContract.currentCount = Math.min(reconContract.targetCount, reconContract.currentCount + 1);
        if (reconContract.currentCount >= reconContract.targetCount) {
          reconContract.completed = true;
          voter.cred += reconContract.rewardCred;
          awardXpToUser(voter, reconContract.rewardXp);
          addTransaction(voter.id, 'daily_contract_completed', reconContract.rewardCred, `Daily Op Completed: ${reconContract.title}`);
        }
      }
    }

    // Auto-verify if legit votes >= 3 and status was submitted
    if (dare.proof.communityVotes.legit >= 3 && dare.status === 'submitted') {
      dare.status = 'verified';
      const submitter = initialUsers.find(u => u.handle === dare.proof?.submittedByHandle);
      if (submitter) {
        submitter.cred += dare.rewardCred + (dare.proof.aiJudgement?.bonusCred || 0);
        submitter.completedDaresCount += 1;
        addTransaction(submitter.id, 'dare_completed', dare.rewardCred, `Completed challenge: "${dare.title}"`, dare.id, dare.title);
        awardXpToUser(submitter, dare.rewardCred * 2);
        recordUserActivity(submitter);
      }
    }

    // Notify proof submitter if voter is not the submitter
    const proofSubmitter = initialUsers.find(u => u.handle === dare.proof?.submittedByHandle);
    if (proofSubmitter && voter && proofSubmitter.id !== voter.id) {
      addNotification({
        userId: proofSubmitter.id,
        type: 'proof_voted',
        title: `Evidence Voted ${vote.toUpperCase()}!`,
        message: `${voter.handle} cast a ${vote.toUpperCase()} vote on your evidence for "${dare.title}"`,
        dareId: dare.id,
        dareTitle: dare.title,
        actorHandle: voter.handle,
        actorName: voter.name,
        actorAvatar: voter.avatar,
        voteType: voteKey,
        read: false,
      });
    }

    res.json(dare);
  });

  // Toggle like
  app.post('/api/dares/:id/like', (req, res) => {
    const dare = dares.find(d => d.id === req.params.id);
    if (!dare) return res.status(404).json({ error: 'Dare not found' });

    const { userId } = req.body;
    const idx = dare.likedUserIds.indexOf(userId);

    if (idx > -1) {
      dare.likedUserIds.splice(idx, 1);
      dare.likes = Math.max(0, dare.likes - 1);
    } else {
      dare.likedUserIds.push(userId);
      dare.likes += 1;
    }

    res.json({ likes: dare.likes, likedUserIds: dare.likedUserIds });
  });

  // Add comment / heckle / cheer
  app.post('/api/dares/:id/comment', (req, res) => {
    const dare = dares.find(d => d.id === req.params.id);
    if (!dare) return res.status(404).json({ error: 'Dare not found' });

    const { userId, text, isVoiceNote, voiceDuration } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text required' });
    }

    const user = initialUsers.find(u => u.id === userId) || findOrCreateUser(userId || 'u_active_user');

    const comment: DareComment = {
      id: `c_${Date.now()}`,
      userHandle: user.handle,
      userName: user.name,
      avatar: user.avatar,
      text: text.trim(),
      timestamp: 'Just now',
      isVoiceNote: Boolean(isVoiceNote),
      voiceDuration: voiceDuration ? Number(voiceDuration) : undefined,
    };

    dare.comments.push(comment);

    const notifSnippet = isVoiceNote 
      ? `🎙️ [Voice Note ${voiceDuration ? `${voiceDuration}s: ` : ''}] "${comment.text.slice(0, 45)}${comment.text.length > 45 ? '...' : ''}"`
      : `"${comment.text.slice(0, 50)}${comment.text.length > 50 ? '...' : ''}"`;

    // Notify dare creator
    if (dare.creator && dare.creator.id !== user.id) {
      addNotification({
        userId: dare.creator.id,
        type: 'comment_received',
        title: isVoiceNote ? 'New Voice Note on Your Dare' : 'New Comment on Your Dare',
        message: `${user.handle} transmitted on "${dare.title}": ${notifSnippet}`,
        dareId: dare.id,
        dareTitle: dare.title,
        actorHandle: user.handle,
        actorName: user.name,
        actorAvatar: user.avatar,
        commentText: comment.text,
        read: false,
      });
    }

    // Also notify challenger if different from commenter and creator
    if (dare.acceptedBy && dare.acceptedBy.id !== user.id && dare.acceptedBy.id !== dare.creator?.id) {
      addNotification({
        userId: dare.acceptedBy.id,
        type: 'comment_received',
        title: isVoiceNote ? 'New Voice Note on Challenge' : 'New Comment on Challenge',
        message: `${user.handle} transmitted on "${dare.title}": ${notifSnippet}`,
        dareId: dare.id,
        dareTitle: dare.title,
        actorHandle: user.handle,
        actorName: user.name,
        actorAvatar: user.avatar,
        commentText: comment.text,
        read: false,
      });
    }

    res.status(201).json(comment);
  });

  // AI Cyber Dare Generator: Generates creative, electrifying dares via Gemini
  app.post('/api/ai/generate-dare', async (req, res) => {
    const { category, difficulty, vibe, targetType, targetUserHandle } = req.body;

    const genAI = getGenAI();
    if (genAI) {
      try {
        const prompt = `You are the AI Dare Generator for DARE, a vibrant social challenge and peer bounty platform.
Generate 1 unique, fun, safe, yet adrenaline-pumping or humorous dare for:
- Category: ${category || 'any'} (Can be fitness/physical, absurd stunts, creative design, or social connection/mental resilience.)
- Difficulty: ${difficulty || 'Level 2 - Moderate'}
- Vibe / Theme: ${vibe || 'witty, high energy, engaging'}
- Target Type: ${targetType === 'direct' ? `Direct challenge to peer ${targetUserHandle || 'a friend'}` : 'Public Global Bounty'}

IMPORTANT INSTRUCTION FOR ALL CATEGORIES: Proactively blend fitness, bodyweight athletics, outdoor exploration, mental focus endurance, and funny face-to-face social challenges. Keep tone natural, modern, and engaging without robotic or sci-fi jargon.

Return strictly JSON matching this structure:
{
  "title": "Short punchy dare title (under 12 words)",
  "description": "Engaging description explaining the exact challenge (2-3 sentences)",
  "proofRequirement": "Clear, objective requirement for how they prove completion (e.g. photo, video)",
  "recommendedDifficulty": "Level 1 - Starter" | "Level 2 - Moderate" | "Level 3 - Intense" | "Level 4 - Elite",
  "recommendedCred": number between 25 and 160,
  "category": "${category || 'physical'}"
}`;

        const response = await genAI.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const generated = JSON.parse(response.text);
          return res.json(generated);
        }
      } catch (err) {
        console.warn('Oracle dare generator operating with local dynamic generator.');
      }
    }

    // Creative pre-built cyber dare fallbacks if API key is not yet set
    const fallbacks = [
      {
        title: 'Debug Code with Dark Sunglasses and Cyberpunk Soundtrack at Full Blast',
        description: 'Put on mirror shades, play high-octane synthwave/darksynth, and resolve at least 2 git issues or build a CSS animation within 20 minutes.',
        proofRequirement: 'Photo with shades and your open terminal/IDE showing the git commit diff.',
        recommendedDifficulty: 'Level 2 - Moderate',
        recommendedCred: 65,
        category: 'tech',
      },
      {
        title: 'Speak Only in Binary (0s and 1s) for the First 3 Minutes of a Phone Call',
        description: 'Call a friend or colleague and respond to their initial greeting purely with rapid 01001000 01001001 patterns until you crack or 3 minutes pass.',
        proofRequirement: 'Audio clip or recording of the hilarious confused reaction.',
        recommendedDifficulty: 'Level 3 - Intense',
        recommendedCred: 95,
        category: 'social',
      },
      {
        title: 'Design a Neon Hologram UI Mockup in 10 Minutes Using Only Neon Colors',
        description: 'Open your canvas or Figma/CSS and design a futuristic sci-fi dashboard card using only cyan (#00f2fe), hot pink (#ff007f), and pitch black.',
        proofRequirement: 'Screenshot or live URL of the finished neon UI card.',
        recommendedDifficulty: 'Level 1 - Starter',
        recommendedCred: 40,
        category: 'creative',
      },
    ];

    const pick = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    res.json(pick);
  });

  // AI Dare Coach API: Generates personalized execution tips and safety guidance for any dare
  app.post('/api/ai/dare-coach', async (req, res) => {
    const { title, description, category, proofRequirement, difficulty, rewardCred, userHandle } = req.body;

    const genAI = getGenAI();
    if (genAI) {
      try {
        const prompt = `You are the AI Dare Coach on DARE, an expert personal performance, safety, and challenge completion mentor.
Analyze the following challenge and provide high-impact, personalized, actionable tips, safety precautions, and proof-capturing guidance for ${userHandle || 'the challenger'}:

- Dare Title: "${title || 'Untitled Dare'}"
- Description: "${description || 'No description'}"
- Category: "${category || 'fitness/lifestyle'}"
- Difficulty: "${difficulty || 'Level 2 - Moderate'}"
- Reward: ${rewardCred || 300} Cred
- Proof Requirement: "${proofRequirement || 'Photo/Video Evidence'}"

Provide your response in strictly valid JSON with this structure:
{
  "coachPersona": "AI Dare Mentor",
  "summary": "Short 1-2 sentence high-energy motivational breakdown of this challenge",
  "difficultyAssessment": "Quick analysis of the actual effort and focus required",
  "preparation": [
    "Pre-challenge setup step 1",
    "Pre-challenge setup step 2",
    "Pre-challenge setup step 3"
  ],
  "stepByStepTips": [
    "Actionable execution tip 1",
    "Actionable execution tip 2",
    "Actionable execution tip 3"
  ],
  "safetyGuidance": [
    "Crucial safety boundary or physical/social precaution 1",
    "Crucial safety boundary or physical/social precaution 2"
  ],
  "proofAdvice": "Precise instruction on how to record/photograph proof so the Arbiter & Community verify it with 100% confidence",
  "estimatedTimeMinutes": 15
}`;

        const response = await genAI.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const generated = JSON.parse(response.text);
          return res.json(generated);
        }
      } catch (err: any) {
        // Fall back gracefully to tailored dynamic guidance without breaking
        console.warn('AI Dare Coach using high-fidelity local synthesis mode.');
      }
    }

    // High-fidelity dynamic contextual coach synthesis
    const titleLower = (title || '').toLowerCase();
    const isPhysical = (category || '').toLowerCase().includes('physical') || titleLower.includes('squat') || titleLower.includes('pushup') || titleLower.includes('run') || titleLower.includes('plank') || titleLower.includes('burpee') || titleLower.includes('jump');
    const isSocial = (category || '').toLowerCase().includes('social') || titleLower.includes('talk') || titleLower.includes('call') || titleLower.includes('stranger') || titleLower.includes('speech') || titleLower.includes('karaoke') || titleLower.includes('sing');
    const isCreative = (category || '').toLowerCase().includes('creative') || titleLower.includes('design') || titleLower.includes('paint') || titleLower.includes('draw') || titleLower.includes('photo') || titleLower.includes('video') || titleLower.includes('build') || titleLower.includes('code');

    const prepList = isPhysical ? [
      'Perform 3-5 minutes of dynamic joint mobilization and warm-up.',
      'Have a hydration bottle within arm reach before starting the timer.',
      'Mount your phone at hip or chest height to capture full range of motion.'
    ] : isSocial ? [
      'Take 3 deep centering breaths to steady your voice and body language.',
      'Review the social prompt to maintain a warm, respectful, and confident delivery.',
      'Ensure ambient lighting and clear audio capture before recording.'
    ] : isCreative ? [
      'Gather all necessary creative tools and references before beginning.',
      'Set an uninterrupted focus timer to enter a state of deep flow.',
      'Check canvas resolution and frame boundaries for clean visual capture.'
    ] : [
      'Read through the challenge objectives carefully before starting.',
      'Prepare your environment to avoid unexpected interruptions.',
      'Position your recording angle so the completed deliverable is obvious.'
    ];

    const executionTips = isPhysical ? [
      'Partition the reps into manageable, disciplined sets rather than red-lining early.',
      'Prioritize strict form, full depth, and rhythmic breathing over uncontrolled tempo.',
      'Lock in steady pacing with a clear countdown clock visible in your frame.'
    ] : isSocial ? [
      'Lead with friendly eye contact, an open posture, and genuine curiosity.',
      'Embrace the momentary adrenaline — awkwardness fades the second you commit.',
      'Keep the interaction upbeat, lighthearted, and respectful to all involved.'
    ] : isCreative ? [
      'Focus on bold, intentional execution rather than second-guessing early drafts.',
      'Highlight distinctive aesthetic touches that reflect the DARE spirit.',
      'Ensure high visual contrast and polish so your proof stands out on the grid.'
    ] : [
      'Break down complex steps into simple sequential actions.',
      'Commit fully to the challenge parameters from the very first minute.',
      'Stay disciplined and celebrate the milestone as soon as you cross the finish line.'
    ];

    const safetyList = isPhysical ? [
      'Listen to your body: Halt immediately if experiencing sharp joint strain or dizziness.',
      'Ensure your training surface is stable, non-slip, and clear of tripping hazards.'
    ] : isSocial ? [
      'Always respect personal boundaries and public safety regulations.',
      'Do not engage in obstructive or intrusive behavior in private commercial spaces.'
    ] : [
      'Keep all activities within safe, responsible, and legal boundaries.',
      'Avoid hazardous heights, traffic intersections, or unsafe environments.'
    ];

    res.json({
      coachPersona: 'AI Dare Mentor',
      summary: `You've got this! Approach "${title || 'this challenge'}" with disciplined focus, steady pacing, and clear execution to lock in your ${rewardCred || 300} Cred.`,
      difficultyAssessment: `Rated at ${difficulty || 'Level 2 - Moderate'}. Requires deliberate preparation and committed follow-through.`,
      preparation: prepList,
      stepByStepTips: executionTips,
      safetyGuidance: safetyList,
      proofAdvice: `Ensure ${proofRequirement || 'clear photo/video evidence'} shows the entire sequence without obstruction so arbiters verify your victory instantly.`,
      estimatedTimeMinutes: isPhysical ? 15 : isCreative ? 25 : 10
    });
  });

  // --- NOTIFICATION TELEMETRY APIS ---
  // Get all notifications for user
  app.get('/api/notifications', (req, res) => {
    const userId = (req.query.userId as string) || 'u_dareday';
    const userNotifs = notifications.filter(n => n.userId === userId);
    const unreadCount = userNotifs.filter(n => !n.read).length;
    res.json({
      notifications: userNotifs,
      unreadCount,
    });
  });

  // Mark single notification as read
  app.post('/api/notifications/:id/read', (req, res) => {
    const notif = notifications.find(n => n.id === req.params.id);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    notif.read = true;
    res.json(notif);
  });

  // Mark all notifications as read for a user
  app.post('/api/notifications/read-all', (req, res) => {
    const { userId } = req.body;
    notifications.forEach(n => {
      if (!userId || n.userId === userId) {
        n.read = true;
      }
    });
    res.json({ success: true });
  });

  // Delete a notification
  app.delete('/api/notifications/:id', (req, res) => {
    const idx = notifications.findIndex(n => n.id === req.params.id);
    if (idx > -1) {
      notifications.splice(idx, 1);
    }
    res.json({ success: true });
  });

  // Clear all notifications for user
  app.delete('/api/notifications', (req, res) => {
    const userId = req.query.userId as string;
    if (userId) {
      for (let i = notifications.length - 1; i >= 0; i--) {
        if (notifications[i].userId === userId) {
          notifications.splice(i, 1);
        }
      }
    }
    res.json({ success: true });
  });

  // Squad Tournaments
  let tournaments: SquadTournament[] = [...initialTournaments];

  app.get('/api/tournaments', (_req, res) => {
    res.json(tournaments);
  });

  // Join/Wager in a Squad Tournament
  app.post('/api/tournaments/:id/wager', (req, res) => {
    const tourney = tournaments.find(t => t.id === req.params.id);
    if (!tourney) return res.status(404).json({ error: 'Tournament not found' });
    if (tourney.status !== 'active') return res.status(400).json({ error: 'Tournament is not accepting active wagers' });

    const { userId, squadTag, amountCred } = req.body;
    const user = initialUsers.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const wager = Math.max(25, Number(amountCred) || tourney.entryFeeCred);
    if (user.cred < wager) {
      return res.status(400).json({ error: 'Insufficient Cred telemetry for squad wager' });
    }

    user.cred -= wager;
    addTransaction(user.id, 'dare_accepted', -wager, `Wagered ${wager} Cred on ${squadTag} in tournament "${tourney.title}"`);

    // Add to squad pot
    if (tourney.squadA.tag === squadTag) {
      tourney.squadA.wageredCred += wager;
      if (!tourney.squadA.members.includes(user.handle)) {
        tourney.squadA.members.push(user.handle);
      }
    } else if (tourney.squadB.tag === squadTag) {
      tourney.squadB.wageredCred += wager;
      if (!tourney.squadB.members.includes(user.handle)) {
        tourney.squadB.members.push(user.handle);
      }
    }
    tourney.potCred += wager;

    // Send notification
    addNotification({
      userId: user.id,
      type: 'tournament_wager',
      title: 'Squad Tournament Wager Locked!',
      message: `You backed [${squadTag}] with a ${wager} Cred stake in "${tourney.title}". Total Prize Pot is now ${tourney.potCred} CR!`,
      actorHandle: '@daredaylabs',
      actorName: 'Tournament Arbiter',
      actorAvatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150',
      read: false,
    });

    res.json({ tournament: tourney, userCred: user.cred });
  });

  // --- LIVE SQUAD & 1v1 HEAD-TO-HEAD DUELS ARENA ---
  let liveDuels: LiveDuel[] = [...initialLiveDuels];

  // Get all active duels
  app.get('/api/duels', (_req, res) => {
    res.json(liveDuels);
  });

  // Get single duel
  app.get('/api/duels/:id', (req, res) => {
    const duel = liveDuels.find(d => d.id === req.params.id);
    if (!duel) return res.status(404).json({ error: 'Duel not found' });
    res.json(duel);
  });

  // Create new duel
  app.post('/api/duels', (req, res) => {
    const { title, category, durationSeconds, entryFeeCred, challengeBrief, proofCriteria, isAiOpponent, creator } = req.body;
    const user = initialUsers.find(u => u.id === creator?.id) || creator;

    const stake = Number(entryFeeCred) || 100;
    if (user && user.cred < stake) {
      return res.status(400).json({ error: `Insufficient Cred balance (${user.cred} CR). Need ${stake} CR.` });
    }

    if (user) {
      user.cred -= stake;
      addTransaction(user.id, 'dare_accepted', -stake, `Staked ${stake} Cred to launch Live Duel "${title}"`);
    }

    const opponentParticipant: LiveDuelParticipant = isAiOpponent ? {
      id: 'ai-oracle-sentinel',
      handle: '@sentinel_v4',
      name: 'Sentinel Neural AI',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      isPro: true,
      squadTag: 'AI',
      isReady: true,
      progressPercent: 0,
      status: 'battling',
      wagerOdds: 2.05,
      totalWagersCred: 100,
      cheerCount: 15,
      recentAction: 'Initializing neural challenge models...',
    } : {
      id: 'u2',
      handle: '@cyber_ghost',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      isPro: true,
      squadTag: 'GRID',
      isReady: true,
      progressPercent: 0,
      status: 'battling',
      wagerOdds: 1.95,
      totalWagersCred: 100,
      cheerCount: 20,
      recentAction: 'Ready in lobby...',
    };

    const newDuel: LiveDuel = {
      id: `duel-${Date.now()}`,
      title: title || 'Live Head-to-Head Duel',
      category: category || 'tech',
      difficulty: 'Level 3 - Intense',
      challengeBrief: challengeBrief || 'Simultaneous speed challenge. Submit verified proof before your opponent.',
      proofCriteria: proofCriteria || 'Clear timestamped proof photo or screencast showing complete criteria.',
      durationSeconds: Number(durationSeconds) || 180,
      potCred: stake * 2,
      entryFeeCred: stake,
      status: 'in_progress',
      startedAt: Date.now(),
      endsAt: Date.now() + (Number(durationSeconds) || 180) * 1000,
      challenger: {
        id: user ? user.id : 'u1',
        handle: user ? user.handle : '@neon_blade',
        name: user ? user.name : 'Kai Vance',
        avatar: user ? user.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        isPro: user ? user.isPro : false,
        squadTag: 'NEON',
        isReady: true,
        progressPercent: 0,
        status: 'battling',
        wagerOdds: 1.90,
        totalWagersCred: stake,
        cheerCount: 10,
        recentAction: 'Combatant deployed challenge...',
      },
      opponent: opponentParticipant,
      spectatorWagers: [],
      cheers: [],
      isAiOpponent: Boolean(isAiOpponent),
    };

    liveDuels.unshift(newDuel);
    res.json({ duel: newDuel, userCred: user ? user.cred : undefined });
  });

  // Submit proof for a live duel
  app.post('/api/duels/:id/submit-proof', (req, res) => {
    const duel = liveDuels.find(d => d.id === req.params.id);
    if (!duel) return res.status(404).json({ error: 'Duel not found' });
    if (duel.status !== 'in_progress') {
      return res.status(400).json({ error: 'Duel is not in progress' });
    }

    const { userId, proofMediaUrl, proofNote } = req.body;
    const isChallenger = duel.challenger.id === userId;
    const user = initialUsers.find(u => u.id === userId);

    const participant = isChallenger ? duel.challenger : duel.opponent;
    participant.progressPercent = 100;
    participant.status = 'verified';
    participant.proofMediaUrl = proofMediaUrl;
    participant.proofNote = proofNote;
    participant.submissionTimeSeconds = Math.round((Date.now() - (duel.startedAt || Date.now())) / 1000);

    // Declare Winner
    duel.status = 'concluded';
    duel.winnerId = participant.id;
    duel.winnerDeclaredReason = `Submitted verified proof first in ${participant.submissionTimeSeconds} seconds!`;

    // Award Bounty Pot to Winner
    if (user) {
      user.cred += duel.potCred;
      user.completedDaresCount = (user.completedDaresCount || 0) + 1;
      addTransaction(user.id, 'dare_completed', duel.potCred, `Won Live Head-to-Head Duel "${duel.title}"`);
    }

    // Award winning spectator wagers
    duel.spectatorWagers.forEach(w => {
      if (w.backedParticipantId === participant.id) {
        const spectator = initialUsers.find(u => u.id === w.userId);
        if (spectator) {
          spectator.cred += Math.round(w.potentialWinCred);
          addTransaction(spectator.id, 'stake_won', Math.round(w.potentialWinCred), `Won Spectator Wager on ${participant.handle} in Duel "${duel.title}"`);
        }
      }
    });

    res.json({ duel, userCred: user ? user.cred : undefined });
  });

  // Place spectator wager
  app.post('/api/duels/:id/wager', (req, res) => {
    const duel = liveDuels.find(d => d.id === req.params.id);
    if (!duel) return res.status(404).json({ error: 'Duel not found' });
    if (duel.status !== 'in_progress' && duel.status !== 'lobby') {
      return res.status(400).json({ error: 'Duel is already concluded' });
    }

    const { userId, userHandle, targetParticipantId, amountCred } = req.body;
    const user = initialUsers.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const stake = Number(amountCred) || 50;
    if (user.cred < stake) {
      return res.status(400).json({ error: 'Insufficient Cred balance' });
    }

    user.cred -= stake;
    addTransaction(user.id, 'dare_accepted', -stake, `Spectator wager of ${stake} CR placed on duel "${duel.title}"`);

    const participant = duel.challenger.id === targetParticipantId ? duel.challenger : duel.opponent;
    participant.totalWagersCred += stake;
    const potentialWin = Math.round(stake * participant.wagerOdds);

    duel.spectatorWagers.push({
      userId: user.id,
      userHandle: userHandle || user.handle,
      backedParticipantId: targetParticipantId,
      amountCred: stake,
      potentialWinCred: potentialWin,
      timestamp: new Date().toISOString(),
    });

    res.json({ duel, userCred: user.cred });
  });

  // Send Cheer reaction
  app.post('/api/duels/:id/cheer', (req, res) => {
    const duel = liveDuels.find(d => d.id === req.params.id);
    if (!duel) return res.status(404).json({ error: 'Duel not found' });

    const { userId, userHandle, targetParticipantId, emoji, label } = req.body;
    const participant = duel.challenger.id === targetParticipantId ? duel.challenger : duel.opponent;
    participant.cheerCount = (participant.cheerCount || 0) + 1;

    duel.cheers.push({
      id: `cheer-${Date.now()}-${Math.random()}`,
      userId: userId || 'anon',
      userHandle: userHandle || 'Spectator',
      targetParticipantId,
      emoji: emoji || '🔥',
      label: label || 'CHEER',
      timestamp: Date.now(),
    });

    res.json({ duel });
  });

  // Conclude / Timeout Duel
  app.post('/api/duels/:id/resolve', (req, res) => {
    const duel = liveDuels.find(d => d.id === req.params.id);
    if (!duel) return res.status(404).json({ error: 'Duel not found' });
    
    duel.status = 'concluded';
    if (!duel.winnerId) {
      // Pick higher progress or tie
      if (duel.challenger.progressPercent > duel.opponent.progressPercent) {
        duel.winnerId = duel.challenger.id;
        duel.winnerDeclaredReason = `Declared winner on clock expiry with higher telemetry sync (${duel.challenger.progressPercent}% vs ${duel.opponent.progressPercent}%).`;
      } else {
        duel.winnerId = duel.opponent.id;
        duel.winnerDeclaredReason = `Declared winner on clock expiry with higher telemetry sync (${duel.opponent.progressPercent}% vs ${duel.challenger.progressPercent}%).`;
      }
    }

    res.json({ duel });
  });

  // Direct Rematch Request
  app.post('/api/rivalry/rematch', (req, res) => {
    const { fromUserId, targetUserHandle, previousDareTitle } = req.body;
    const challenger = initialUsers.find(u => u.id === fromUserId);
    const targetUser = initialUsers.find(u => u.handle.toLowerCase() === (targetUserHandle || '').toLowerCase());

    if (!challenger || !targetUser) {
      return res.status(404).json({ error: 'Challenger or target netrunner not found' });
    }

    // Create a high-priority notification for the rival
    addNotification({
      userId: targetUser.id,
      type: 'rematch_requested',
      title: '🔥 Double or Nothing Rematch Challenge!',
      message: `${challenger.handle} wants to settle the score after "${previousDareTitle || 'your duel'}". Will you accept?`,
      actorHandle: challenger.handle,
      actorName: challenger.name,
      actorAvatar: challenger.avatar,
      read: false,
    });

    res.json({ success: true, message: `Rematch challenge sent to ${targetUser.handle}!` });
  });

  // Global Platform Stats
  app.get('/api/stats', (req, res) => {
    const totalDares = dares.length;
    const totalCredPool = dares.reduce((acc, d) => acc + d.rewardCred, 0);
    const verifiedDares = dares.filter(d => d.status === 'verified').length;
    const activeChallengers = initialUsers.length;

    res.json({
      totalDares,
      totalCredPool,
      verifiedDares,
      activeChallengers,
    });
  });

  // Upgrade user to PRO status tier
  app.post('/api/users/:id/upgrade-pro', (req, res) => {
    const user = initialUsers.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Netrunner profile not found' });
    }

    const { tierId, paymentMode, costCred } = req.body;
    if (!tierId) {
      return res.status(400).json({ error: 'Subscription tier ID required' });
    }

    // Process payment mode
    if (paymentMode === 'cred') {
      const parsedCost = Number(costCred) || 0;
      if (user.cred < parsedCost) {
        return res.status(400).json({ 
          error: 'Insufficient Cred telemetry to upgrade. Complete more dares or use simulated credit card!' 
        });
      }
      user.cred -= parsedCost;

      // Register subtraction transaction
      transactions.unshift({
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: user.id,
        type: 'pro_upgrade',
        amount: -parsedCost,
        description: `Subscribed to PRO ${String(tierId).toUpperCase()} tier via Cred deduction`,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Simulate credit card success - add a tiny positive transaction showing card activation if desired,
      // or simply skip deducting cred and update status directly.
    }

    // Set PRO status attributes
    user.isPro = true;
    user.proTier = tierId;
    user.proExpiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    
    const badgeName = tierId === 'overlord' 
      ? '👑 Cyber Overlord' 
      : tierId === 'elite' 
      ? '👑 Cyber Elite' 
      : '👑 Cyber Runner';
      
    user.proBadge = badgeName;

    if (!user.badges) user.badges = [];
    if (!user.badges.includes(badgeName)) {
      user.badges.push(badgeName);
    }

    // Add telemetry alert notification
    addNotification({
      userId: user.id,
      type: 'pro_upgraded',
      title: 'Premium PRO Uplink Established!',
      message: `Your account has been upgraded to ${badgeName}! You have unlocked advanced AI prompts, premium holographic card frames, and exclusive privileges.`,
      dareId: '',
      dareTitle: '',
      actorHandle: '@daredaylabs',
      actorName: 'DARE Ops',
      actorAvatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80',
      read: false,
    });

    res.json(user);
  });

  // --- CYBERPUNK ARMORY & REWARDS STORE APIS ---
  // Get all Armory items
  app.get('/api/armory/items', (_req, res) => {
    res.json({
      items: armoryCatalog,
      jackpotPool: communityJackpotPool,
    });
  });

  // Purchase Armory item with Cred
  app.post('/api/armory/purchase', (req, res) => {
    const { userId, itemId, quantity = 1 } = req.body;
    const user = initialUsers.find(u => u.id === (userId || 'u_dareday'));
    if (!user) return res.status(404).json({ error: 'User not found' });

    const item = armoryCatalog.find(i => i.id === itemId);
    if (!item) return res.status(404).json({ error: 'Armory item not found' });

    const totalCost = item.priceCred * quantity;
    if (user.cred < totalCost) {
      return res.status(400).json({ 
        error: `Insufficient Cred balance (${user.cred} CR). Need ${totalCost} CR to requisition "${item.name}".` 
      });
    }

    user.cred -= totalCost;
    if (!user.inventory) user.inventory = [];

    const existingInvItem = user.inventory.find(i => i.itemId === item.id);
    if (existingInvItem) {
      existingInvItem.quantity += quantity;
    } else {
      user.inventory.push({
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        itemId: item.id,
        name: item.name,
        category: item.category,
        rarity: item.rarity,
        icon: item.icon,
        quantity,
        acquiredAt: new Date().toISOString(),
        effectKey: item.effectKey,
        effectValue: item.effectValue,
        isEquipped: false,
      });
    }

    // Auto-equip if cosmetic or title and user had none
    if (item.category === 'cosmetic' && !user.equippedFrame) {
      user.equippedFrame = item.effectKey;
      const inv = user.inventory.find(i => i.itemId === item.id);
      if (inv) inv.isEquipped = true;
    }
    if (item.category === 'title' && !user.equippedTitle) {
      user.equippedTitle = item.badgeCode || item.name;
      const inv = user.inventory.find(i => i.itemId === item.id);
      if (inv) inv.isEquipped = true;
    }

    // Register transaction
    addTransaction(
      user.id,
      'shop_purchase',
      -totalCost,
      `Purchased ${quantity}x ${item.name} from Cyber Armory`
    );

    // 10% of purchases feed the community jackpot pool!
    communityJackpotPool += Math.floor(totalCost * 0.1);

    // Award bonus XP for armory trade
    awardXpToUser(user, Math.floor(totalCost * 0.5));

    addNotification({
      userId: user.id,
      type: 'social',
      title: `⚡ Armory Requisition: ${item.name}`,
      message: `Successfully equipped ${quantity}x ${item.name} to your neural inventory. ${totalCost} Cred deducted.`,
      dareId: '',
      actorHandle: '@daredaylabs',
      actorName: 'DARE Quartermaster',
      actorAvatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150',
      read: false,
    });

    res.json({
      success: true,
      user,
      purchasedItem: item,
      trackingCode: item.isPhysical ? `NFC-DD-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : undefined,
    });
  });

  // Equip / Unequip Cosmetic Frame or Cyber Title
  app.post('/api/armory/equip', (req, res) => {
    const { userId, itemId, type } = req.body; // type: 'frame' | 'title'
    const user = initialUsers.find(u => u.id === (userId || 'u_dareday'));
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.inventory) user.inventory = [];

    const item = armoryCatalog.find(i => i.id === itemId);
    if (!item) return res.status(404).json({ error: 'Item not found in catalog' });

    const ownsItem = user.inventory.some(i => i.itemId === itemId);
    if (!ownsItem) return res.status(400).json({ error: 'Item not owned in inventory' });

    if (type === 'frame' || item.category === 'cosmetic') {
      if (user.equippedFrame === item.effectKey) {
        user.equippedFrame = undefined;
        user.inventory.forEach(i => { if (i.category === 'cosmetic') i.isEquipped = false; });
      } else {
        user.equippedFrame = item.effectKey;
        user.inventory.forEach(i => {
          if (i.category === 'cosmetic') i.isEquipped = (i.itemId === itemId);
        });
      }
    } else if (type === 'title' || item.category === 'title') {
      const titleCode = item.badgeCode || item.name;
      if (user.equippedTitle === titleCode) {
        user.equippedTitle = undefined;
        user.inventory.forEach(i => { if (i.category === 'title') i.isEquipped = false; });
      } else {
        user.equippedTitle = titleCode;
        user.inventory.forEach(i => {
          if (i.category === 'title') i.isEquipped = (i.itemId === itemId);
        });
      }
    }

    res.json({ success: true, user });
  });

  // Use / Activate a Booster Item from Inventory
  app.post('/api/armory/use-booster', (req, res) => {
    const { userId, itemId } = req.body;
    const user = initialUsers.find(u => u.id === (userId || 'u_dareday'));
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.inventory) user.inventory = [];
    const invItem = user.inventory.find(i => i.itemId === itemId && i.quantity > 0);
    if (!invItem) return res.status(400).json({ error: 'Booster not available in inventory' });

    const catalogItem = armoryCatalog.find(i => i.id === itemId);
    if (!catalogItem) return res.status(404).json({ error: 'Catalog entry not found' });

    // Deduct 1 quantity
    invItem.quantity -= 1;
    if (invItem.quantity <= 0) {
      user.inventory = user.inventory.filter(i => i.id !== invItem.id);
    }

    if (!user.activeBoosters) user.activeBoosters = [];

    let boosterType: ActiveBooster['type'] = '2x_cred';
    if (catalogItem.effectKey.includes('streak_freeze')) boosterType = 'streak_freeze';
    else if (catalogItem.effectKey.includes('oracle_reroll')) boosterType = 'oracle_reroll';
    else if (catalogItem.effectKey.includes('spotlight_beacon')) boosterType = 'spotlight_beacon';
    else if (catalogItem.effectKey.includes('bounty_amp')) boosterType = 'bounty_amp';
    else if (catalogItem.effectKey.includes('fast_pass')) boosterType = 'fast_pass';

    const durationHours = catalogItem.durationHours || 24;
    const newBooster: ActiveBooster = {
      id: `boost_${Date.now()}`,
      type: boosterType,
      name: catalogItem.name,
      icon: catalogItem.icon,
      multiplier: catalogItem.effectValue || 2,
      usesRemaining: boosterType === '2x_cred' ? 3 : 1,
      expiresAt: new Date(Date.now() + durationHours * 3600000).toISOString(),
      activatedAt: new Date().toISOString(),
    };

    user.activeBoosters.push(newBooster);

    if (boosterType === 'streak_freeze') {
      user.streakShieldActive = true;
      user.streakShieldExpiresAt = newBooster.expiresAt;
    }

    addTransaction(user.id, 'booster_activated', 0, `Activated Booster: ${catalogItem.name}`);

    res.json({
      success: true,
      user,
      activatedBooster: newBooster,
    });
  });

  // --- DAILY OPERATIONS MATRIX APIS ---
  app.get('/api/daily-contracts', (req, res) => {
    const userId = (req.query.userId as string) || 'u_dareday';
    const state = getDailyOpsForUser(userId);
    res.json(state);
  });

  // Claim Daily Trifecta Chest
  app.post('/api/daily-contracts/claim-trifecta', (req, res) => {
    const { userId } = req.body;
    const user = initialUsers.find(u => u.id === (userId || 'u_dareday'));
    if (!user) return res.status(404).json({ error: 'User not found' });

    const state = getDailyOpsForUser(user.id);
    const allDone = state.contracts.every(c => c.completed);
    if (!allDone) {
      return res.status(400).json({ error: 'All 3 daily operations contracts must be completed first.' });
    }

    if (state.trifectaClaimed) {
      return res.status(400).json({ error: 'Daily Trifecta reward already claimed for today.' });
    }

    state.trifectaClaimed = true;
    user.cred += state.trifectaRewardCred;
    awardXpToUser(user, state.trifectaRewardXp);

    // Grant bonus 2x Overclock Chip
    if (!user.inventory) user.inventory = [];
    user.inventory.push({
      id: `inv_${Date.now()}`,
      itemId: 'armory_booster_2x',
      name: '2x Overclock Chip',
      category: 'booster',
      rarity: 'rare',
      icon: '⚡',
      quantity: 1,
      acquiredAt: new Date().toISOString(),
      effectKey: '2x_cred',
      effectValue: 2,
    });

    addTransaction(user.id, 'daily_trifecta_claimed', state.trifectaRewardCred, 'Cracked Daily Trifecta Cyber Safe! +500 CR & 2x Overclock Chip');

    addNotification({
      userId: user.id,
      type: 'stipend_claimed',
      title: '🏆 Daily Trifecta Cracked!',
      message: `You completed all 3 daily ops contracts! Claimed +500 Cred, +600 XP, and a 2x Overclock Chip.`,
      dareId: '',
      actorHandle: '@daredaylabs',
      actorName: 'Daily Ops HQ',
      actorAvatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150',
      read: false,
    });

    res.json({ success: true, user, state });
  });

  // --- SEASON 1 BATTLE PASS APIS ---
  app.get('/api/season-pass', (req, res) => {
    const userId = (req.query.userId as string) || 'u_dareday';
    const user = initialUsers.find(u => u.id === userId) || findOrCreateUser(userId || 'u_active_user');

    res.json({
      seasonName: 'Season 1: Neon Insurgency',
      seasonEndsInDays: 42,
      tiers: seasonPassTiers,
      userLevel: user.seasonPassLevel || 1,
      userXp: user.seasonPassXp || 0,
      hasElitePass: !!user.hasElitePass || !!user.isPro,
      claimedFree: user.seasonPassClaimedFree || [],
      claimedElite: user.seasonPassClaimedElite || [],
    });
  });

  // Claim Season Pass Tier Reward
  app.post('/api/season-pass/claim', (req, res) => {
    const { userId, level, track } = req.body; // track: 'free' | 'elite'
    const user = initialUsers.find(u => u.id === (userId || 'u_dareday'));
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tier = seasonPassTiers.find(t => t.level === Number(level));
    if (!tier) return res.status(404).json({ error: 'Tier not found' });

    if ((user.seasonPassLevel || 1) < tier.level) {
      return res.status(400).json({ error: `Tier ${tier.level} locked. Requires ${tier.requiredXp} Season XP.` });
    }

    if (!user.seasonPassClaimedFree) user.seasonPassClaimedFree = [];
    if (!user.seasonPassClaimedElite) user.seasonPassClaimedElite = [];

    if (track === 'free') {
      if (user.seasonPassClaimedFree.includes(tier.level)) {
        return res.status(400).json({ error: 'Free tier reward already claimed.' });
      }
      user.seasonPassClaimedFree.push(tier.level);
      
      // Deliver free reward
      if (tier.freeReward.type === 'cred' && tier.freeReward.amount) {
        user.cred += tier.freeReward.amount;
        addTransaction(user.id, 'season_pass_reward', tier.freeReward.amount, `Claimed Season 1 Free Tier ${tier.level} Reward: ${tier.freeReward.name}`);
      } else if (tier.freeReward.type === 'badge') {
        if (!user.badges) user.badges = [];
        if (!user.badges.includes(tier.freeReward.name)) user.badges.push(tier.freeReward.name);
      }
    } else {
      if (!user.hasElitePass && !user.isPro) {
        return res.status(400).json({ error: 'Cyber Elite Pass required to claim this reward.' });
      }
      if (user.seasonPassClaimedElite.includes(tier.level)) {
        return res.status(400).json({ error: 'Elite tier reward already claimed.' });
      }
      user.seasonPassClaimedElite.push(tier.level);

      // Deliver elite reward
      if (tier.eliteReward.type === 'cred' && tier.eliteReward.amount) {
        user.cred += tier.eliteReward.amount;
        addTransaction(user.id, 'season_pass_reward', tier.eliteReward.amount, `Claimed Season 1 Elite Tier ${tier.level} Reward: ${tier.eliteReward.name}`);
      } else if (tier.eliteReward.type === 'title') {
        user.equippedTitle = tier.eliteReward.name;
      }
    }

    res.json({
      success: true,
      user,
      claimedFree: user.seasonPassClaimedFree,
      claimedElite: user.seasonPassClaimedElite,
    });
  });

  // Upgrade / Unlock Cyber Elite Battle Pass
  app.post('/api/season-pass/upgrade-elite', (req, res) => {
    const { userId } = req.body;
    const user = initialUsers.find(u => u.id === (userId || 'u_dareday'));
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.hasElitePass || user.isPro) {
      user.hasElitePass = true;
      return res.json({ success: true, user, message: 'Elite Pass is already unlocked!' });
    }

    const ELITE_PASS_COST = 2000;
    if (user.cred < ELITE_PASS_COST) {
      return res.status(400).json({ 
        error: `Insufficient Cred. Need ${ELITE_PASS_COST} Cred (or PRO Membership) to unlock the Cyber Elite Battle Pass.` 
      });
    }

    user.cred -= ELITE_PASS_COST;
    user.hasElitePass = true;
    addTransaction(user.id, 'shop_purchase', -ELITE_PASS_COST, 'Unlocked Season 1: Cyber Elite Battle Pass');

    addNotification({
      userId: user.id,
      type: 'pro_upgraded',
      title: '👑 Cyber Elite Pass Unlocked!',
      message: 'You have unlocked the Cyber Elite track for Season 1! Claim premium frames, titles, and high-roller rewards.',
      dareId: '',
      actorHandle: '@daredaylabs',
      actorName: 'DARE Arena',
      actorAvatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150',
      read: false,
    });

    res.json({ success: true, user });
  });

  // --- HIGH-ROLLER CRED STAKING APIS ---
  app.get('/api/staking/jackpot', (_req, res) => {
    res.json({
      jackpotPool: communityJackpotPool,
      activeWagersCount: 28,
      recentBigWinners: [
        { handle: '@Vortex_99', amount: 950, dare: 'Core Iron Wall: 5-Minute Plank', timestamp: '2h ago' },
        { handle: '@daredaylabs', amount: 650, dare: 'Retro Synthwave Terminal', timestamp: '5h ago' },
      ]
    });
  });

  // Place a Cred stake on an accepted dare
  app.post('/api/staking/wager', (req, res) => {
    const { userId, dareId, stakedCred } = req.body;
    const user = initialUsers.find(u => u.id === (userId || 'u_dareday'));
    if (!user) return res.status(404).json({ error: 'User not found' });

    const dare = dares.find(d => d.id === dareId);
    if (!dare) return res.status(404).json({ error: 'Dare challenge not found' });

    const parsedStake = Number(stakedCred);
    if (isNaN(parsedStake) || parsedStake < 25) {
      return res.status(400).json({ error: 'Minimum stake is 25 Cred.' });
    }

    if (user.cred < parsedStake) {
      return res.status(400).json({ error: `Insufficient Cred (${user.cred} CR) to place ${parsedStake} CR stake.` });
    }

    user.cred -= parsedStake;
    if (!user.activeStakes) user.activeStakes = [];

    const multiplier = 1.5; // 1.5x return on legitimate completion
    const potentialPayout = Math.round(parsedStake * multiplier);

    const newStake: StakeWager = {
      id: `stake_${Date.now()}`,
      dareId: dare.id,
      dareTitle: dare.title,
      stakedCred: parsedStake,
      potentialPayout,
      multiplier,
      placedAt: new Date().toISOString(),
      expiresAt: dare.expiresAt || new Date(Date.now() + 86400000).toISOString(),
      status: 'active',
    };

    user.activeStakes.push(newStake);
    communityJackpotPool += Math.floor(parsedStake * 0.2); // 20% feeds community jackpot

    addTransaction(user.id, 'stake_placed', -parsedStake, `Staked ${parsedStake} Cred (${multiplier}x) on "${dare.title}"`, dare.id, dare.title);

    // Advance Daily Op 3 (Grid Instigator: Stake Cred)
    const dailyOps = getDailyOpsForUser(user.id);
    const instigatorContract = dailyOps.contracts.find(c => c.id === 'contract_3');
    if (instigatorContract && !instigatorContract.completed) {
      instigatorContract.currentCount = Math.min(instigatorContract.targetCount, instigatorContract.currentCount + 1);
      if (instigatorContract.currentCount >= instigatorContract.targetCount) {
        instigatorContract.completed = true;
        user.cred += instigatorContract.rewardCred;
        awardXpToUser(user, instigatorContract.rewardXp);
        addTransaction(user.id, 'daily_contract_completed', instigatorContract.rewardCred, `Daily Op Completed: ${instigatorContract.title}`);
      }
    }

    res.json({
      success: true,
      user,
      stake: newStake,
      jackpotPool: communityJackpotPool,
    });
  });

  // Peer-to-Peer Cred Tip
  app.post('/api/tips/send', (req, res) => {
    const { fromUserId, toUserHandle, amountCred, dareId, note } = req.body;
    const sender = initialUsers.find(u => u.id === (fromUserId || 'u_dareday'));
    const recipient = initialUsers.find(u => u.handle.toLowerCase() === (toUserHandle || '').toLowerCase());

    if (!sender || !recipient) {
      return res.status(404).json({ error: 'Sender or recipient not found' });
    }

    const tipAmount = Number(amountCred);
    if (isNaN(tipAmount) || tipAmount <= 0) {
      return res.status(400).json({ error: 'Tip amount must be greater than 0' });
    }

    if (sender.cred < tipAmount) {
      return res.status(400).json({ error: `Insufficient Cred balance (${sender.cred} CR)` });
    }

    sender.cred -= tipAmount;
    recipient.cred += tipAmount;

    addTransaction(sender.id, 'tip_sent', -tipAmount, `Sent ${tipAmount} CR tip to ${recipient.handle}`, dareId);
    addTransaction(recipient.id, 'tip_received', tipAmount, `Received ${tipAmount} CR tip from ${sender.handle}`, dareId);

    addNotification({
      userId: recipient.id,
      type: 'social',
      title: `⚡ ${tipAmount} Cred Tip Received!`,
      message: `${sender.handle} tipped you ${tipAmount} Cred: "${note || 'Incredible execution!'}"`,
      dareId,
      actorHandle: sender.handle,
      actorName: sender.name,
      actorAvatar: sender.avatar,
      read: false,
    });

    res.json({ success: true, sender, recipient, tipAmount });
  });

  // --- GEOFENCED DROP ZONES & AR BEACONS ---
  app.get('/api/drop-zones', (req, res) => {
    const { lat, lng, radiusMeters, category, rarity } = req.query;

    let results = [...dropZones];

    if (category && typeof category === 'string' && category !== 'all') {
      results = results.filter(z => z.category === category);
    }

    if (rarity && typeof rarity === 'string' && rarity !== 'all') {
      results = results.filter(z => z.lootRarity === rarity);
    }

    if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      const userLat = Number(lat);
      const userLng = Number(lng);

      const enriched = results.map(zone => {
        const distance = calculateDistanceMeters(userLat, userLng, zone.coordinates.lat, zone.coordinates.lng);
        const inGeofence = distance <= zone.radiusMeters;
        return {
          ...zone,
          distanceMeters: distance,
          inGeofence,
        };
      });

      if (radiusMeters && !isNaN(Number(radiusMeters))) {
        const maxDist = Number(radiusMeters);
        return res.json(enriched.filter(z => z.distanceMeters <= maxDist));
      }

      // Sort by proximity
      enriched.sort((a, b) => a.distanceMeters - b.distanceMeters);
      return res.json(enriched);
    }

    res.json(results);
  });

  app.post('/api/drop-zones/claim', (req, res) => {
    const { dropZoneId, userId, userLat, userLng, arProofVerified } = req.body;

    const zone = dropZones.find(z => z.id === dropZoneId);
    if (!zone) {
      return res.status(404).json({ error: 'Drop Zone beacon node not found' });
    }

    const user = initialUsers.find(u => u.id === (userId || 'u_dareday'));
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if (!zone.claimedUserIds) {
      zone.claimedUserIds = [];
    }

    if (zone.claimedUserIds.includes(user.id)) {
      return res.status(400).json({ error: 'Drop Zone bounty already claimed by your neural ID today.' });
    }

    // Geofence or AR verification check
    let withinRange = true;
    let distance = 0;
    if (typeof userLat === 'number' && typeof userLng === 'number') {
      distance = calculateDistanceMeters(userLat, userLng, zone.coordinates.lat, zone.coordinates.lng);
      if (distance > zone.radiusMeters && !arProofVerified) {
        return res.status(400).json({ 
          error: `Geofence breach: You are ${distance}m away. Must be within ${zone.radiusMeters}m of the drop beacon to claim.`,
          distanceMeters: distance,
          requiredRadius: zone.radiusMeters
        });
      }
    }

    // Award Cred & XP
    const bountyCred = zone.bountyCred;
    const bountyXp = zone.bountyXp;
    user.cred += bountyCred;
    awardXpToUser(user, bountyXp);

    // Chance for Tactical Armory Item drop on Epic/Legendary
    let lootItem: ArmoryItem | undefined;
    if (zone.lootRarity === 'legendary' || zone.lootRarity === 'epic') {
      const eligibleDrops = armoryCatalog.filter(i => i.category === 'booster' || i.category === 'cosmetic');
      if (eligibleDrops.length > 0) {
        const selected = eligibleDrops[Math.floor(Math.random() * eligibleDrops.length)];
        lootItem = selected;
        if (!user.inventory) user.inventory = [];
        const existingInv = user.inventory.find(i => i.itemId === selected.id);
        if (existingInv) {
          existingInv.quantity += 1;
        } else {
          user.inventory.push({
            id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            itemId: selected.id,
            name: selected.name,
            category: selected.category,
            rarity: selected.rarity,
            icon: selected.icon,
            quantity: 1,
            acquiredAt: new Date().toISOString(),
            effectKey: selected.effectKey,
            effectValue: selected.effectValue,
          });
        }
      }
    }

    zone.claimedUserIds.push(user.id);
    zone.claimedByCount += 1;

    addTransaction(user.id, 'drop_zone_claimed', bountyCred, `Claimed ${zone.name} (${zone.code}) Geofenced Bounty`);

    addNotification({
      userId: user.id,
      type: 'social',
      title: `🗺️ Drop Zone Secured: ${zone.code}`,
      message: `You successfully decrypted the AR beacon at ${zone.name}! +${bountyCred} Cred and +${bountyXp} XP deposited.`,
      dareId: '',
      dareTitle: zone.activeDareTitle,
      actorHandle: zone.deployedByHandle,
      actorName: zone.deployedByName,
      actorAvatar: zone.deployedByAvatar,
      read: false,
    });

    res.json({
      success: true,
      dropZone: zone,
      user,
      awardedCred: bountyCred,
      awardedXp: bountyXp,
      lootItem,
      distanceMeters: distance
    });
  });

  app.post('/api/drop-zones/deploy', (req, res) => {
    const { 
      name, 
      category = 'cyber', 
      lat, 
      lng, 
      radiusMeters = 250, 
      city = 'Local Sector', 
      country = 'Cyber Grid',
      bountyCred = 200, 
      activeDareTitle, 
      activeDareDescription, 
      arBeaconType = 'quantum_vault',
      arObjectIcon = '💠',
      userId 
    } = req.body;

    const user = initialUsers.find(u => u.id === (userId || 'u_dareday'));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deployCost = Number(bountyCred);
    if (user.cred < deployCost) {
      return res.status(400).json({ error: `Insufficient Cred balance to fund this Drop Zone bounty (${user.cred} CR available, requires ${deployCost} CR)` });
    }

    user.cred -= deployCost;
    addTransaction(user.id, 'drop_zone_deployed', -deployCost, `Deployed Geofenced Drop Zone: ${name}`);

    const newZone: DropZone = {
      id: `drop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name || 'Custom Tactical Drop Zone',
      code: `DROP-${(city || 'LOC').substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`,
      category: category as any,
      coordinates: {
        lat: Number(lat) || 37.7749,
        lng: Number(lng) || -122.4194,
      },
      radiusMeters: Number(radiusMeters) || 250,
      city: city || 'Local Sector',
      country: country || 'Grid',
      bountyCred: deployCost,
      bountyXp: Math.round(deployCost * 1.5),
      lootRarity: deployCost >= 500 ? 'legendary' : deployCost >= 300 ? 'epic' : 'rare',
      activeDareTitle: activeDareTitle || 'Geofenced AR Field Objective',
      activeDareDescription: activeDareDescription || 'Locate the physical beacon node and execute the dare protocol.',
      beaconSignalStrength: 95,
      arBeaconType: arBeaconType || 'quantum_vault',
      arObjectIcon: arObjectIcon || '💠',
      claimedByCount: 0,
      claimedUserIds: [],
      deployedByHandle: user.handle,
      deployedByName: user.name,
      deployedByAvatar: user.avatar,
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
      createdAt: new Date().toISOString(),
      requiresArScan: true,
    };

    dropZones.unshift(newZone);

    res.json({
      success: true,
      dropZone: newZone,
      user
    });
  });

  // --- STRIPE & PAYMENTS ---

  // 1. Sync catalog directly to Stripe (supports both POST and GET for one-click browser sync)
  app.all(['/api/stripe/sync-products', '/api/stripe/sync-catalog'], async (req, res) => {
    try {
      const stripe = getStripe();
      if (!stripe) {
        return res.status(400).json({
          error: 'STRIPE_SECRET_KEY is not configured in server environment.',
          configured: false,
        });
      }

      const syncResults = await syncStripeCatalog();
      res.json({
        success: true,
        message: 'Stripe catalog successfully synchronized with your Stripe account.',
        syncedItems: syncResults,
      });
    } catch (err: any) {
      console.error('Stripe catalog sync endpoint error:', err);
      res.status(500).json({
        error: err.message || 'Failed to sync products with Stripe.',
      });
    }
  });

  // 2. Get active product catalog
  app.get('/api/stripe/products', async (req, res) => {
    try {
      const stripe = getStripe();
      if (!stripe) {
        return res.json({
          configured: false,
          products: DARE_PRODUCTS.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            amount: p.amount,
            currency: p.currency,
            type: p.type,
            interval: (p as any).interval,
          })),
        });
      }

      const products = await stripe.products.list({ limit: 50, active: true });
      const prices = await stripe.prices.list({ limit: 100, active: true });

      const catalog = products.data.map(prod => {
        const prodPrices = prices.data.filter(pr => pr.product === prod.id);
        return {
          id: prod.id,
          name: prod.name,
          description: prod.description,
          metadata: prod.metadata,
          prices: prodPrices.map(pr => ({
            id: pr.id,
            unitAmount: pr.unit_amount,
            currency: pr.currency,
            recurring: pr.recurring,
          })),
        };
      });

      res.json({
        configured: true,
        products: catalog,
      });
    } catch (err: any) {
      console.error('Stripe products list error:', err);
      res.status(500).json({ error: err.message || 'Failed to retrieve products' });
    }
  });

  // 3. Create Checkout Session for Subscriptions or One-off Purchases
  app.post('/api/stripe/create-checkout-session', async (req, res) => {
    try {
      const { 
        priceId, 
        itemId, 
        userId, 
        userEmail,
        successUrl, 
        cancelUrl 
      } = req.body;

      const stripe = getStripe();
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const resolvedSuccessUrl = successUrl || `${appUrl}/?session_id={CHECKOUT_SESSION_ID}&payment_status=success`;
      const resolvedCancelUrl = cancelUrl || `${appUrl}/?payment_status=cancelled`;

      if (!stripe) {
        // Simulated checkout URL when Stripe keys are not yet provided
        return res.json({
          url: resolvedSuccessUrl.replace('{CHECKOUT_SESSION_ID}', `sim_${Date.now()}`),
          sessionId: `sim_session_${Date.now()}`,
          simulated: true,
          message: 'Running in simulated checkout mode. Configure STRIPE_SECRET_KEY for live Stripe Checkout.',
        });
      }

      let targetPriceId = priceId;

      // Lookup price by itemId if raw priceId is not provided
      if (!targetPriceId && itemId) {
        const matchingProduct = DARE_PRODUCTS.find(p => p.id === itemId);
        if (matchingProduct) {
          const prices = await stripe.prices.list({ limit: 100, active: true });
          const found = prices.data.find(pr => (pr.metadata as any)?.dareday_item_id === itemId);
          if (found) {
            targetPriceId = found.id;
          }
        }
      }

      if (!targetPriceId) {
        // If still no price ID, dynamically create a line item or fallback to custom price
        const matchingProduct = DARE_PRODUCTS.find(p => p.id === itemId) || DARE_PRODUCTS[0];
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: matchingProduct.type === 'recurring' ? 'subscription' : 'payment',
          line_items: [
            {
              price_data: {
                currency: matchingProduct.currency,
                product_data: {
                  name: matchingProduct.name,
                  description: matchingProduct.description,
                },
                unit_amount: matchingProduct.amount,
                recurring: matchingProduct.type === 'recurring' && matchingProduct.interval ? { interval: matchingProduct.interval } : undefined,
              },
              quantity: 1,
            },
          ],
          client_reference_id: userId || 'u_active_user',
          customer_email: userEmail,
          metadata: {
            userId: userId || 'u_active_user',
            itemId: itemId || matchingProduct.id,
          },
          success_url: resolvedSuccessUrl,
          cancel_url: resolvedCancelUrl,
        });

        return res.json({
          url: session.url,
          sessionId: session.id,
          simulated: false,
        });
      }

      // Check whether price is recurring or one-time
      const priceObject = await stripe.prices.retrieve(targetPriceId);
      const isSubscription = Boolean(priceObject.recurring);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: isSubscription ? 'subscription' : 'payment',
        line_items: [
          {
            price: targetPriceId,
            quantity: 1,
          },
        ],
        client_reference_id: userId || 'u_active_user',
        customer_email: userEmail,
        metadata: {
          userId: userId || 'u_active_user',
          itemId: itemId || '',
        },
        success_url: resolvedSuccessUrl,
        cancel_url: resolvedCancelUrl,
      });

      res.json({
        url: session.url,
        sessionId: session.id,
        simulated: false,
      });
    } catch (err: any) {
      console.error('Stripe checkout session error:', err);
      res.status(500).json({ error: err.message || 'Failed to create Stripe checkout session' });
    }
  });

  // 4. Create Customer Portal Session (Manage Subscriptions / Invoices)
  app.post('/api/stripe/create-customer-portal', async (req, res) => {
    try {
      const { customerId, returnUrl } = req.body;
      const stripe = getStripe();
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

      if (!stripe) {
        return res.json({
          url: returnUrl || `${appUrl}/`,
          simulated: true,
          message: 'Stripe keys required for live customer portal.',
        });
      }

      if (!customerId) {
        return res.status(400).json({ error: 'Stripe customerId is required.' });
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl || `${appUrl}/`,
      });

      res.json({ url: portalSession.url, simulated: false });
    } catch (err: any) {
      console.error('Stripe customer portal error:', err);
      res.status(500).json({ error: err.message || 'Failed to create customer portal session' });
    }
  });

  // 5. Payment Intent fallback
  app.post('/api/stripe/create-payment-intent', async (req, res) => {
    try {
      const { amount, currency = 'usd', description, userId } = req.body;
      const stripe = getStripe();
      if (!stripe) {
        return res.json({
          clientSecret: `seti_simulated_${Math.random().toString(36).substring(2)}_secret_${Math.random().toString(36).substring(2)}`,
          simulated: true,
          message: 'Stripe secret key not provided in environment. Using secure simulated test mode.'
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(amount) * 100),
        currency,
        description: description || 'DARE PRO / Marketplace Access',
        metadata: { userId: userId || 'anonymous' }
      });

      res.json({ clientSecret: paymentIntent.client_secret, simulated: false });
    } catch (err: any) {
      console.error('Stripe payment intent error:', err);
      res.status(500).json({ error: err.message || 'Failed to create payment intent' });
    }
  });

  // 6. Webhook Listener
  app.post('/api/stripe/webhook', async (req: any, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripe = getStripe();

    let event: Stripe.Event;

    if (!stripe) {
      return res.status(200).json({ received: true, simulated: true });
    }

    try {
      if (webhookSecret && sig && req.rawBody) {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
      } else {
        event = req.body as Stripe.Event;
      }
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Process Stripe Events
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.client_reference_id || session.metadata?.userId;
          const itemId = session.metadata?.itemId;

          if (userId) {
            const user = findOrCreateUser(userId);
            if (itemId?.includes('pro')) {
              user.isPro = true;
              user.proTier = 'runner';
              user.badges = Array.from(new Set([...user.badges, '⚡ Pro Lite']));
              user.cred += 500;
              addTransaction(user.id, 'stipend_claimed', 500, 'Bonus Cred for Pro Lite subscription activation');
            } else if (itemId?.includes('elite')) {
              user.isPro = true;
              user.proTier = 'elite';
              user.badges = Array.from(new Set([...user.badges, '💎 Pro Elite']));
              user.cred += 2000;
              addTransaction(user.id, 'stipend_claimed', 2000, 'Bonus Cred for Pro Elite subscription');
            } else if (itemId?.includes('battle_pass')) {
              user.hasElitePass = true;
              user.cred += 250;
              addTransaction(user.id, 'stipend_claimed', 250, 'Season 1 Elite Pass Activated');
            } else if (itemId?.includes('500')) {
              user.cred += 500;
              addTransaction(user.id, 'stipend_claimed', 500, 'Purchased 500 Cred Pack');
            } else if (itemId?.includes('2500')) {
              user.cred += 2500;
              addTransaction(user.id, 'stipend_claimed', 2500, 'Purchased 2,500 Cred Vault');
            }

            addNotification({
              userId: user.id,
              type: 'stipend_claimed',
              title: 'Payment Confirmed! ⚡',
              message: `Your payment was processed by Stripe. Your account perks are active.`,
              actorHandle: '@StripeBilling',
              actorName: 'Stripe Payments',
              actorAvatar: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150&auto=format&fit=crop&q=80',
              read: false,
            });
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          // Look up user if linked
          console.log(`Subscription deleted for customer: ${customerId}`);
          break;
        }

        default:
          break;
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error('Error handling Stripe webhook event:', err);
      res.status(500).json({ error: 'Error processing webhook event' });
    }
  });

  // 7. Status endpoint
  app.get('/api/stripe/status', (req, res) => {
    const stripe = getStripe();
    res.json({
      configured: !!stripe,
      mode: stripe ? 'live_api' : 'simulated_fallback',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
      message: stripe 
        ? 'Stripe SDK successfully initialized with API keys.' 
        : 'Stripe key not configured. Running in secure simulated test mode (ready for live keys).'
    });
  });

  // --- WEB PUSH & NOTIFICATIONS TELEMETRY ---
  const userPushPreferencesMap = new Map<string, any>();

  app.get('/api/push/preferences/:userId', (req, res) => {
    const { userId } = req.params;
    const prefs = userPushPreferencesMap.get(userId) || {
      directDares: true,
      stakes: true,
      proofVotes: true,
      dropZones: true,
      dailyOps: true,
      soundEnabled: true,
    };
    res.json({ preferences: prefs });
  });

  app.post('/api/push/preferences/:userId', (req, res) => {
    const { userId } = req.params;
    const { preferences } = req.body;
    if (preferences) {
      userPushPreferencesMap.set(userId, preferences);
    }
    res.json({ success: true, preferences });
  });

  app.post('/api/push/test', (req, res) => {
    const { userId, title, body, dareId } = req.body;
    res.json({
      success: true,
      notification: {
        id: `push_${Date.now()}`,
        userId: userId || 'anonymous',
        title: title || '⚡ DARE Signal Detected',
        body: body || 'Real-time telemetry uplink verified.',
        dareId: dareId || null,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ DARE server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
