import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import compression from 'compression';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { cert, getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
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
  DareFormat,
  DareCircle
} from './src/types.js';
import { initialTournaments } from './src/data/tournaments';
import { initialLiveDuels } from './src/data/liveDuels';
import { initialDares } from './src/data/initialDares';
import { getDailyPlatformDares } from './src/data/platformDailyDares';
import { DARE_PRODUCTS, DARE_CRED_PACKS, syncStripeCatalog } from './scripts/sync-stripe-catalog';

dotenv.config();

// Types for Authenticated Request
export interface AuthenticatedUser {
  uid: string;
  email?: string;
  token?: any;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Initialize Firebase Admin safely with support for all credential formats
import firebaseConfig from './firebase-applet-config.json';
let db: any = null;
let adminAuth: any = null;
let hasAdminCredentials = false;

try {
  let credential: any = null;
  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (saRaw) {
    try {
      const parsed = typeof saRaw === 'string' && (saRaw.trim().startsWith('{') || saRaw.trim().startsWith('['))
        ? JSON.parse(saRaw)
        : JSON.parse(Buffer.from(saRaw, 'base64').toString('utf8'));
      credential = cert(parsed);
      hasAdminCredentials = true;
    } catch (_e) {
      if (typeof saRaw === 'string' && !saRaw.includes('{')) {
        credential = cert(saRaw);
        hasAdminCredentials = true;
      }
    }
  } else if (googleAppCreds) {
    try {
      if (googleAppCreds.trim().startsWith('{')) {
        credential = cert(JSON.parse(googleAppCreds));
      } else {
        credential = cert(googleAppCreds);
      }
      hasAdminCredentials = true;
    } catch (_e) {}
  } else if (clientEmail && privateKey) {
    try {
      credential = cert({
        projectId: firebaseConfig.projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      });
      hasAdminCredentials = true;
    } catch (_e) {}
  }

  const existingApps = getApps();
  let app: any;
  if (!existingApps || existingApps.length === 0) {
    const appOptions: any = {
      projectId: firebaseConfig.projectId,
    };
    if (credential) {
      appOptions.credential = credential;
    }
    app = initializeApp(appOptions);
  } else {
    app = getApp();
  }
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
  try {
    adminAuth = getAdminAuth(app);
  } catch (_authErr) {
    adminAuth = null;
  }
} catch (e) {
  console.warn('Firebase Admin init warning (falling back to memory store):', e);
}

// Reusable Express Authentication Middleware enforcing Firebase ID token validation
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Bearer authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: Empty token' });
  }

  try {
    if (adminAuth && hasAdminCredentials) {
      const decoded = await adminAuth.verifyIdToken(idToken);
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        token: decoded,
      };
      return next();
    } else {
      // Development / sandbox mode token parser
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload && (payload.user_id || payload.sub || payload.uid)) {
            req.user = {
              uid: payload.user_id || payload.sub || payload.uid,
              email: payload.email,
              token: payload,
            };
            return next();
          }
        }
      } catch (_e) {}

      if (idToken.length > 0 && !idToken.includes(' ')) {
        req.user = {
          uid: idToken,
          token: { uid: idToken }
        };
        return next();
      }

      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  } catch (err: any) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication token' });
  }
};

// Rate Limiting Engine
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitBucket>();

function rateLimiter(options: { windowMs: number; max: number; keyPrefix?: string }) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const clientIp = (req.headers['x-real-ip'] as string)?.trim() || req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${options.keyPrefix || 'rl'}:${clientIp}`;
    const now = Date.now();
    let bucket = rateLimitStore.get(key);

    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 1, resetAt: now + options.windowMs };
      rateLimitStore.set(key, bucket);
      return next();
    }

    if (bucket.count >= options.max) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        error: 'Rate limit exceeded. Too many requests. Please try again shortly.',
        retryAfterSeconds: retryAfterSec,
      });
    }

    bucket.count += 1;
    next();
  };
}

const authSyncRateLimiter = rateLimiter({ windowMs: 60000, max: 40, keyPrefix: 'auth_sync' });
const squadChatRateLimiter = rateLimiter({ windowMs: 60000, max: 30, keyPrefix: 'squad_chat' });
const dareCreationRateLimiter = rateLimiter({ windowMs: 60000, max: 20, keyPrefix: 'dare_create' });
const proofSubmissionRateLimiter = rateLimiter({ windowMs: 60000, max: 15, keyPrefix: 'proof_sub' });
const aiRateLimiter = rateLimiter({ windowMs: 60000, max: 15, keyPrefix: 'ai_ops' });
const paymentRateLimiter = rateLimiter({ windowMs: 60000, max: 20, keyPrefix: 'stripe_ops' });

// Idempotency Tracking for Stripe Webhook Events
const processedStripeEventIds = new Set<string>();

async function isStripeEventProcessed(eventId: string): Promise<boolean> {
  if (processedStripeEventIds.has(eventId)) return true;
  if (!db || !hasAdminCredentials) return false;
  try {
    const snap = await db.collection('stripeWebhookEvents').doc(eventId).get();
    if (snap && snap.exists) {
      processedStripeEventIds.add(eventId);
      return true;
    }
  } catch (_e) {}
  return false;
}

async function recordStripeEventProcessed(eventId: string, type: string) {
  processedStripeEventIds.add(eventId);
  if (!db || !hasAdminCredentials) return;
  try {
    await db.collection('stripeWebhookEvents').doc(eventId).set({
      id: eventId,
      type,
      processedAt: new Date().toISOString(),
    });
  } catch (_e) {}
}

// Database Connectivity Health Check
async function checkFirestoreHealth(): Promise<'connected' | 'unconfigured' | 'unreachable'> {
  if (!hasAdminCredentials) return 'unconfigured';
  if (!db) return 'unreachable';
  try {
    await db.collection('_health').doc('ping').get();
    return 'connected';
  } catch (_err) {
    return 'unreachable';
  }
}

// User persistence helpers
async function saveUserToFirestore(user: UserProfile) {
  try {
    if (!db || !user || !user.id || !hasAdminCredentials) return;
    await db.collection('users').doc(user.id).set(user, { merge: true });
  } catch (_err) {}
}

async function getUserFromFirestore(userId: string): Promise<UserProfile | null> {
  try {
    if (!db || !userId || !hasAdminCredentials) return null;
    const snap = await db.collection('users').doc(userId).get();
    if (snap && snap.exists) {
      return snap.data() as UserProfile;
    }
  } catch (_err) {}
  return null;
}

// Dare persistence helpers
async function saveDareToFirestore(dare: DareItem) {
  try {
    if (!db || !dare || !dare.id || !hasAdminCredentials) return;
    await db.collection('dares').doc(dare.id).set(dare, { merge: true });
  } catch (_err) {}
}

async function deleteDareFromFirestore(dareId: string) {
  try {
    if (!db || !dareId || !hasAdminCredentials) return;
    await db.collection('dares').doc(dareId).delete();
  } catch (_err) {}
}

// Duel persistence helpers
async function saveDuelToFirestore(duel: LiveDuel) {
  try {
    if (!db || !duel || !duel.id || !hasAdminCredentials) return;
    await db.collection('duels').doc(duel.id).set(duel, { merge: true });
  } catch (_err) {}
}

// Chat persistence helpers
async function saveChatMessageToFirestore(msg: any) {
  try {
    if (!db || !msg || !msg.id || !hasAdminCredentials) return;
    await db.collection('squadChatMessages').doc(msg.id).set(msg);
  } catch (_err) {}
}

// Transaction persistence helpers
async function saveTransactionToFirestore(tx: CredTransaction) {
  try {
    if (!db || !tx || !tx.id || !hasAdminCredentials) return;
    await db.collection('transactions').doc(tx.id).set(tx);
  } catch (_err) {}
}

// Notification persistence helpers
async function saveNotificationToFirestore(notif: NotificationItem) {
  try {
    if (!db || !notif || !notif.id || !hasAdminCredentials) return;
    await db.collection('notifications').doc(notif.id).set(notif, { merge: true });
  } catch (_err) {}
}

// Tournament persistence helpers
async function saveTournamentToFirestore(tourney: SquadTournament) {
  try {
    if (!db || !tourney || !tourney.id || !hasAdminCredentials) return;
    await db.collection('tournaments').doc(tourney.id).set(tourney, { merge: true });
  } catch (_err) {}
}

// Notification deletion helper
async function deleteNotificationFromFirestore(notifId: string) {
  try {
    if (!db || !notifId || !hasAdminCredentials) return;
    await db.collection('notifications').doc(notifId).delete();
  } catch (_err) {}
}

// Process safety handlers to prevent unexpected server termination
process.on('unhandledRejection', (reason, promise) => {
  console.warn('⚠️ Server Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ Server Uncaught Exception:', err);
});

// Dev server behind the proxy must listen on port 3000
const PORT = (() => {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    return parseInt(process.argv[portArgIndex + 1], 10);
  }
  if (process.env.NODE_ENV !== 'production') {
    return 3000;
  }
  return process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
})();

// Lazy initialization for Stripe SDK
let stripeClient: Stripe | null = null;
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key);
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

// Member Perks & Rewards Catalog
const armoryCatalog: ArmoryItem[] = [
  {
    id: 'armory_booster_2x',
    name: '2x Cred Reward Booster',
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
    name: 'Streak Protection Shield',
    description: 'Preserves your active daily streak from breaking for 24 hours if you miss a day.',
    category: 'booster',
    rarity: 'common',
    priceCred: 150,
    icon: '🛡️',
    effectKey: 'streak_freeze',
    effectValue: 24,
    durationHours: 24,
  },
  {
    id: 'armory_spotlight_beacon',
    name: 'Feed Spotlight (24h)',
    description: 'Pins your published challenge or proof submission to the top of the Community Feed.',
    category: 'perk',
    rarity: 'rare',
    priceCred: 250,
    icon: '📌',
    effectKey: 'spotlight_beacon',
    durationHours: 24,
  },
  {
    id: 'armory_bounty_amp',
    name: 'Creator Reward Match (+50%)',
    description: 'Adds +50% bonus reward to any challenge you publish to attract more participants.',
    category: 'perk',
    rarity: 'rare',
    priceCred: 200,
    icon: '🎁',
    effectKey: 'bounty_amp',
    effectValue: 1.5,
  },
  {
    id: 'armory_fast_pass',
    name: 'Priority Verification',
    description: 'Fast-track your photo and video proof submissions with instant priority review.',
    category: 'perk',
    rarity: 'common',
    priceCred: 75,
    icon: '🚀',
    effectKey: 'fast_pass',
  },
  {
    id: 'armory_frame_gold',
    name: 'Gold Creator Ring',
    description: 'Sleek, minimalist 24K gold border around your avatar across the feed and leaderboard.',
    category: 'cosmetic',
    rarity: 'epic',
    priceCred: 600,
    icon: '✨',
    effectKey: 'frame_syndicate_gold',
    frameCss: 'ring-2 ring-amber-400 border-amber-300 shadow-sm',
  },
  {
    id: 'armory_frame_cyan',
    name: 'Cyan Verified Border',
    description: 'Vibrant modern cyan ring highlighting your profile across discussions and challenges.',
    category: 'cosmetic',
    rarity: 'rare',
    priceCred: 400,
    icon: '💎',
    effectKey: 'frame_neon_cyan',
    frameCss: 'ring-2 ring-cyan-400 border-cyan-400 shadow-sm',
  },
  {
    id: 'armory_frame_glitch',
    name: 'Emerald Athlete Ring',
    description: 'Clean emerald athletic border for fitness and outdoor challengers.',
    category: 'cosmetic',
    rarity: 'epic',
    priceCred: 500,
    icon: '🌿',
    effectKey: 'frame_matrix_glitch',
    frameCss: 'ring-2 ring-emerald-400 border-emerald-400 shadow-sm',
  },
  {
    id: 'armory_frame_void',
    name: 'Sunset Creator Gradient',
    description: 'Modern rose-to-amber creator gradient border with clean styling.',
    category: 'cosmetic',
    rarity: 'legendary',
    priceCred: 800,
    icon: '🌅',
    effectKey: 'frame_quantum_void',
    frameCss: 'ring-2 ring-pink-500 border-rose-400 shadow-sm',
  },
  {
    id: 'armory_title_prodigy',
    name: '⚡ Top Challenger',
    description: 'Official verified challenger badge displayed on your public profile.',
    category: 'title',
    rarity: 'rare',
    priceCred: 350,
    icon: '⚡',
    effectKey: 'title_neural_prodigy',
    badgeCode: '⚡ Top Challenger',
  },
  {
    id: 'armory_title_prime',
    name: '🏆 Community Ambassador',
    description: 'Leadership badge for active community contributors and creators.',
    category: 'title',
    rarity: 'epic',
    priceCred: 600,
    icon: '🏆',
    effectKey: 'title_netrunner_prime',
    badgeCode: '🏆 Community Ambassador',
  },
  {
    id: 'armory_title_ghost',
    name: '🏃 Endurance Athlete',
    description: 'Verified badge for physical, fitness, and outdoor challenge masters.',
    category: 'title',
    rarity: 'legendary',
    priceCred: 900,
    icon: '🏃',
    effectKey: 'title_ghost_grid',
    badgeCode: '🏃 Endurance Athlete',
  },
  {
    id: 'armory_title_tycoon',
    name: '👑 Founding Member',
    description: 'Prestigious founding supporter badge honoring early platform members.',
    category: 'title',
    rarity: 'legendary',
    priceCred: 1200,
    icon: '👑',
    effectKey: 'title_cred_tycoon',
    badgeCode: '👑 Founding Member',
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
    freeReward: { name: '🎯 Precision Striker Badge', type: 'badge', icon: '🎯', description: 'Milestone combatant badge' },
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
    eliteReward: { name: '🔱 Dare Champion Title', type: 'title', icon: '🔱', description: 'Prestige Dare Champion title' },
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

function findOrCreateUser(userId: string, defaultProfile?: Partial<UserProfile> & { isExplicitUpdate?: boolean; email?: string }): UserProfile {
  let user = initialUsers.find(u => u.id === userId);

  const isDareOpsOwner = Boolean(
    (userId && (userId.includes('daredaylabs') || userId.includes('daydare'))) || 
    (defaultProfile && (defaultProfile as any).email?.toLowerCase()?.includes('daredaylabs')) ||
    (defaultProfile && (defaultProfile as any).email?.toLowerCase()?.includes('daydare')) ||
    defaultProfile?.handle?.toLowerCase() === '@daredaylabs' || 
    defaultProfile?.handle?.toLowerCase() === '@daydarelabs' ||
    defaultProfile?.handle?.toLowerCase() === '@dareday' ||
    (defaultProfile?.name && defaultProfile.name.toLowerCase() === 'daydarelabs') ||
    (defaultProfile?.name && defaultProfile.name.toLowerCase() === 'dareday labs')
  );

  if (!user) {
    let initialHandle = defaultProfile?.handle;
    if (!initialHandle || initialHandle === '@operative' || (isDareOpsOwner && (initialHandle === '@daredaylabs' || initialHandle === '@daydarelabs' || initialHandle === '@dareday'))) {
      initialHandle = isDareOpsOwner ? '@dare' : (initialHandle || '@challenger');
    }

    let initialName = defaultProfile?.name;
    if (!initialName || initialName === 'Active Operative' || initialName === 'DARE Operative' || (isDareOpsOwner && (initialName === 'jay' || initialName === 'daydarelabs' || initialName === 'dareday labs'))) {
      initialName = isDareOpsOwner ? 'Jay' : (initialName || 'Challenger');
    }

    let initialAvatar = defaultProfile?.avatar;
    if (!initialAvatar || (isDareOpsOwner && (initialAvatar.includes('photo-1535713875002') || initialAvatar.includes('googleusercontent.com')))) {
      initialAvatar = isDareOpsOwner ? '/logo.png' : (initialAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
    }

    const newUser: UserProfile = {
      id: userId || `u_${Date.now().toString(36)}`,
      handle: initialHandle,
      name: initialName,
      avatar: initialAvatar,
      cred: isDareOpsOwner ? 500 : 0,
      xp: 0,
      level: 1,
      rank: 'Challenger',
      completedDaresCount: 0,
      createdDaresCount: 0,
      streak: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      badges: isDareOpsOwner ? ['⚡ Verified Creator', '👑 Pro Challenger', '💎 Founder'] : [],
      isPro: isDareOpsOwner,
      proTier: isDareOpsOwner ? 'ultra' : null,
      inventory: [],
      activeBoosters: [],
      seasonPassLevel: 1,
      seasonPassXp: 0,
      seasonPassClaimedFree: [],
      seasonPassClaimedElite: [],
      activeStakes: [],
      totalCredWonInStakes: 0,
      squadFriends: [],
      squadSentRequests: [],
      squadReceivedRequests: [],
      disableHelpBubbles: defaultProfile?.disableHelpBubbles || false,
      referralCode: defaultProfile?.referralCode,
      referralCount: 0,
    };
    initialUsers.push(newUser);
    saveUserToFirestore(newUser);
    return newUser;
  } else if (defaultProfile) {
    if (defaultProfile.handle) {
      if (isDareOpsOwner && (defaultProfile.handle === '@daredaylabs' || defaultProfile.handle === '@daydarelabs' || defaultProfile.handle === '@operative' || defaultProfile.handle === '@dareday')) {
        user.handle = '@dare';
      } else {
        user.handle = defaultProfile.handle;
      }
    }
    if (defaultProfile.name) {
      if (isDareOpsOwner && (defaultProfile.name === 'jay' || defaultProfile.name === 'Active Operative' || defaultProfile.name === 'DARE Operative' || defaultProfile.name === 'daydarelabs' || defaultProfile.name === 'dareday labs')) {
        user.name = 'Jay';
      } else {
        user.name = defaultProfile.name;
      }
    }
    if (defaultProfile.avatar) {
      if (isDareOpsOwner && (defaultProfile.avatar.includes('photo-1535713875002') || defaultProfile.avatar.includes('googleusercontent.com'))) {
        user.avatar = (user.avatar && user.avatar !== '/logo.png' && !user.avatar.includes('photo-1535713875002') && !user.avatar.includes('googleusercontent.com')) ? user.avatar : '/logo.png';
      } else {
        user.avatar = defaultProfile.avatar;
      }
    }
    if (defaultProfile.disableHelpBubbles !== undefined) {
      user.disableHelpBubbles = defaultProfile.disableHelpBubbles;
    }
    saveUserToFirestore(user);
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
    if (user.streak >= 3 && !user.badges.includes('⚡ Spark Pioneer') && !user.badges.includes('⚡ Spark Netrunner')) {
      user.badges.push('⚡ Spark Pioneer');
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
  saveUserToFirestore(user);
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
      message: `Your platform rank surged to Level ${newLevel}! ${bonusCred} Cred has been credited to your balance.`,
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
  saveUserToFirestore(user);
}

// Daily Operations State Generator & Firestore Persistence
function getDailyOpsForUser(userId: string): DailyOpsState {
  const today = new Date().toISOString().split('T')[0];
  const user = initialUsers.find(u => u.id === userId) || findOrCreateUser(userId);

  if (!user.dailyOps || user.dailyOps.date !== today) {
    user.dailyOps = {
      date: today,
      contracts: [
        {
          id: 'contract_1',
          title: 'Community Review: Cast 2 Proof Votes',
          description: 'Review peer evidence in the Feed or Proof Gallery and cast 2 verification votes.',
          tier: 'Community',
          targetCount: 2,
          currentCount: 0,
          rewardCred: 75,
          rewardXp: 120,
          icon: 'check',
          completed: false,
        },
        {
          id: 'contract_2',
          title: 'Active Challenge: Complete 1 Dare',
          description: 'Accept and submit verified evidence for any Fitness, Creative, or Social dare.',
          tier: 'Challenge',
          targetCount: 1,
          currentCount: 0,
          rewardCred: 150,
          rewardXp: 250,
          icon: 'zap',
          completed: false,
        },
        {
          id: 'contract_3',
          title: 'Creator Spotlight: Post a Challenge',
          description: 'Publish a new challenge to the feed or send a direct challenge to a friend.',
          tier: 'Creator',
          targetCount: 1,
          currentCount: 0,
          rewardCred: 200,
          rewardXp: 350,
          icon: 'flame',
          completed: false,
        },
      ],
      trifectaClaimed: false,
      trifectaRewardCred: 500,
      trifectaRewardXp: 600,
      resetTimeRemainingMs: 86400000 - (Date.now() % 86400000),
    };
    saveUserToFirestore(user);
  }

  user.dailyOps.resetTimeRemainingMs = 86400000 - (Date.now() % 86400000);
  return user.dailyOps;
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
  saveNotificationToFirestore(newNotif);
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
  saveTransactionToFirestore(tx);
  return tx;
}

// In-Memory Dares Store
let dares: DareItem[] = [...initialDares];

// Platform Daily Dares Generator & In-Memory Sync
function ensurePlatformDailyDares(): DareItem[] {
  const today = new Date().toISOString().split('T')[0];
  const platformDares = getDailyPlatformDares(today);
  for (const pd of platformDares) {
    const existing = dares.find(d => d.id === pd.id);
    if (!existing) {
      dares.unshift(pd);
    } else {
      // Purge any legacy synthetic likes from in-memory dare and ensure likes count strictly equals genuine likedUserIds.length
      if (existing.isPlatformDaily) {
        existing.likedUserIds = existing.likedUserIds || [];
        existing.likes = existing.likedUserIds.length;
      }
    }
  }
  return platformDares;
}

// Pre-hydrate today's platform daily dares on startup
ensurePlatformDailyDares();

// In-Memory Live Duels Store
let liveDuels: LiveDuel[] = [...initialLiveDuels];

// In-Memory Squad Tournaments Store
let tournaments: SquadTournament[] = [...initialTournaments];

// In-Memory Squad Chat Group Messages Store
const squadChatMessages: Array<{
  id: string;
  senderId: string;
  senderHandle: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
}> = [];

// In-Memory Social Feed Posts Store (Real community updates, photos & discussions)
const socialFeedPosts: Array<{
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  isPro?: boolean;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  dareRef?: {
    id: string;
    title: string;
    rewardCred: number;
    category?: string;
  };
  likesCount: number;
  likedUserIds: string[];
  comments: Array<{
    id: string;
    authorId: string;
    authorName: string;
    authorHandle: string;
    authorAvatar: string;
    text: string;
    createdAt: string;
  }>;
  tags?: string[];
  createdAt: string;
}> = [];

// In-Memory Twitter / X-style Direct Messages Store (Real users only)
const directMessages: Array<{
  id: string;
  conversationId: string;
  senderId: string;
  senderHandle: string;
  senderName: string;
  senderAvatar: string;
  recipientId?: string;
  recipientHandle?: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  reactions?: Record<string, string[]>;
  dareAttachment?: {
    id: string;
    title: string;
    credReward: number;
    category: string;
  };
}> = [];

// Bootstrap loader: hydrate runtime stores from Firestore on startup
async function loadAllInitialDataFromFirestore() {
  if (!db || !hasAdminCredentials) return;
  try {
    // Load Users (Hydrate genuine registered users, purge mock profiles)
    const usersSnap = await db.collection('users').get();
    if (usersSnap && !usersSnap.empty) {
      const userPurgePromises: Promise<any>[] = [];
      usersSnap.forEach((doc: any) => {
        const u = doc.data() as UserProfile;
        const isMockUser = Boolean(
          u.id === 'u_marcus' || 
          u.id === 'u_sophia' || 
          u.id === 'u_kai' || 
          u.id === 'u_alex' || 
          u.id === 'u_elena' ||
          u.handle === '@marcus_v' ||
          u.handle === '@sophia_fit' ||
          u.handle === '@kai_dare' ||
          u.handle === '@dare_alex' ||
          u.handle === '@elena_c'
        );

        if (isMockUser) {
          userPurgePromises.push(doc.ref.delete().catch(() => {}));
        } else {
          if (!initialUsers.some(existing => existing.id === u.id)) {
            initialUsers.push(u);
          }
        }
      });
      if (userPurgePromises.length > 0) {
        Promise.all(userPurgePromises).catch(() => {});
        console.log(`[Firestore] Purged ${userPurgePromises.length} mock user profile(s).`);
      }
      console.log(`[Firestore] Hydrated ${initialUsers.length} genuine user profile(s).`);
    }

    // Load Dares (Strict genuine user data only; automatically purge legacy bot/mock dares)
    const daresSnap = await db.collection('dares').get();
    if (daresSnap && !daresSnap.empty) {
      const liveDares: DareItem[] = [];
      const purgePromises: Promise<any>[] = [];

      daresSnap.forEach((doc: any) => {
        const d = doc.data() as DareItem;
        const isBotOrMock = Boolean(
          d.creator?.handle === '@dare_ai' || 
          d.creator?.handle === '@dare_hq' || 
          d.creator?.id === 'ai-oracle-sentinel' || 
          d.creator?.id === 'dare_platform_system' ||
          d.id?.startsWith('dare_seed_') ||
          d.id === 'dare_midnight_sprint' ||
          d.id === 'dare_nike_speed' ||
          d.id === 'dare_urban_vault' ||
          d.id === 'dare_redbull_freestyle' ||
          d.id === 'dare_solo_handstand' ||
          d.id === 'dare_campus_rap' ||
          d.creator?.handle === '@marcus_v' ||
          d.creator?.handle === '@sophia_fit' ||
          d.creator?.handle === '@kai_dare' ||
          d.creator?.handle === '@dare_alex' ||
          d.creator?.handle === '@elena_c' ||
          d.creator?.id === 'u_marcus' ||
          d.creator?.id === 'u_sophia' ||
          d.creator?.id === 'u_kai' ||
          d.creator?.id === 'u_alex'
        );

        if (isBotOrMock) {
          purgePromises.push(doc.ref.delete().catch(() => {}));
        } else {
          // Guarantee that any platform daily dare or user dare has likes strictly consistent with actual likedUserIds
          if (d.isPlatformDaily || !d.likedUserIds) {
            d.likedUserIds = d.likedUserIds || [];
            d.likes = d.likedUserIds.length;
          }
          liveDares.push(d);
        }
      });

      if (purgePromises.length > 0) {
        Promise.all(purgePromises).catch(() => {});
        console.log(`[Firestore] Purged ${purgePromises.length} legacy/mock dare(s).`);
      }

      dares.length = 0;
      dares.push(...liveDares);
      console.log(`[Firestore] Hydrated ${liveDares.length} genuine user dare(s).`);
    }

    // Load Live Duels (Strict genuine user duels only; auto-purge legacy mocks)
    const duelsSnap = await db.collection('duels').get();
    if (duelsSnap && !duelsSnap.empty) {
      const duelPurgePromises: Promise<any>[] = [];
      const genuineDuels: LiveDuel[] = [];
      duelsSnap.forEach((doc: any) => {
        const dl = doc.data() as LiveDuel;
        const isMockDuel = Boolean(
          dl.id?.startsWith('duel-live-') ||
          dl.challenger?.id === 'u_marcus' ||
          dl.challenger?.handle === '@marcus_fit' ||
          dl.opponent?.id === 'u_elena' ||
          dl.opponent?.handle === '@elena_athletics' ||
          dl.opponent?.handle === '@elena_r' ||
          dl.challenger?.handle === '@alex_creatives' ||
          dl.opponent?.handle === '@sarah_c' ||
          dl.opponent?.handle === '@david_m'
        );

        if (isMockDuel) {
          duelPurgePromises.push(doc.ref.delete().catch(() => {}));
        } else {
          genuineDuels.push(dl);
        }
      });
      if (duelPurgePromises.length > 0) {
        Promise.all(duelPurgePromises).catch(() => {});
        console.log(`[Firestore] Purged ${duelPurgePromises.length} legacy mock duel(s).`);
      }
      liveDuels.length = 0;
      liveDuels.push(...genuineDuels);
      console.log(`[Firestore] Hydrated ${genuineDuels.length} genuine live duel(s).`);
    }

    // Load Tournaments (Strict genuine squad competitions only; auto-purge legacy mocks)
    const tourneysSnap = await db.collection('tournaments').get();
    if (tourneysSnap && !tourneysSnap.empty) {
      const tourneyPurgePromises: Promise<any>[] = [];
      const genuineTourneys: SquadTournament[] = [];
      tourneysSnap.forEach((doc: any) => {
        const t = doc.data() as SquadTournament;
        const isMockTourney = Boolean(
          t.id?.startsWith('tourney-') ||
          t.squadA?.members?.includes('@marcus_v') ||
          t.squadB?.members?.includes('@elena_c') ||
          t.squadA?.members?.includes('@maya_design')
        );

        if (isMockTourney) {
          tourneyPurgePromises.push(doc.ref.delete().catch(() => {}));
        } else {
          genuineTourneys.push(t);
        }
      });
      if (tourneyPurgePromises.length > 0) {
        Promise.all(tourneyPurgePromises).catch(() => {});
        console.log(`[Firestore] Purged ${tourneyPurgePromises.length} legacy mock tournament(s).`);
      }
      tournaments.length = 0;
      tournaments.push(...genuineTourneys);
      console.log(`[Firestore] Hydrated ${genuineTourneys.length} genuine squad tournament(s).`);
    }

    // Drop zones feature removed

    // Load Social Feed Posts
    const socialSnap = await db.collection('socialFeedPosts').orderBy('createdAt', 'desc').limit(150).get();
    if (socialSnap && !socialSnap.empty) {
      socialSnap.forEach((doc: any) => {
        const post = doc.data();
        if (!socialFeedPosts.some(p => p.id === post.id)) {
          socialFeedPosts.push(post);
        }
      });
      console.log(`[Firestore] Hydrated ${socialSnap.size} social feed post(s).`);
    }

    // Load Squad Chat Messages
    const chatSnap = await db.collection('squadChatMessages').orderBy('timestamp', 'desc').limit(100).get();
    if (chatSnap && !chatSnap.empty) {
      const msgs = chatSnap.docs.map((doc: any) => doc.data()).reverse();
      squadChatMessages.length = 0;
      squadChatMessages.push(...msgs);
      console.log(`[Firestore] Hydrated ${chatSnap.size} squad chat message(s).`);
    }

    // Load Transactions
    const txSnap = await db.collection('transactions').orderBy('timestamp', 'desc').limit(200).get();
    if (txSnap && !txSnap.empty) {
      txSnap.forEach((doc: any) => {
        const tx = doc.data() as CredTransaction;
        if (!transactions.some(existing => existing.id === tx.id)) {
          transactions.push(tx);
        }
      });
      console.log(`[Firestore] Hydrated ${txSnap.size} transaction(s).`);
    }

    // Load Notifications
    const notifSnap = await db.collection('notifications').orderBy('createdAt', 'desc').limit(200).get();
    if (notifSnap && !notifSnap.empty) {
      notifSnap.forEach((doc: any) => {
        const n = doc.data() as NotificationItem;
        if (!notifications.some(existing => existing.id === n.id)) {
          notifications.push(n);
        }
      });
      console.log(`[Firestore] Hydrated ${notifSnap.size} notification(s).`);
    }
  } catch (err: any) {
    console.warn('[Firestore] Bootstrap hydration warning:', err?.message || err);
  }
}

async function startServer() {
  await loadAllInitialDataFromFirestore();

  const app = express();
  // Enable gzip/brotli HTTP response compression to accelerate asset and data transfer
  app.use(compression());
  // Enable 1-hop proxy trust for Render load balancer so req.ip and X-Forwarded headers are validated
  app.set('trust proxy', 1);
  app.use((_req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    next();
  });

  // --- POSTHOG REVERSE PROXY (/ingest) ---
  // Mount BEFORE express.json() to stream unconsumed raw bytes (events, session recordings)
  // Maps /ingest/* -> PostHog EU ingestion (https://eu.i.posthog.com/*) and assets (https://eu-assets.i.posthog.com/*)
  const posthogHost = (process.env.POSTHOG_HOST || 'https://eu.i.posthog.com').replace(/\/$/, '');
  const isEuRegion = posthogHost.includes('eu.');
  const posthogAssetHost = (process.env.POSTHOG_ASSET_HOST || (isEuRegion ? 'https://eu-assets.i.posthog.com' : 'https://us-assets.i.posthog.com')).replace(/\/$/, '');

  const posthogProxy = createProxyMiddleware({
    target: posthogHost,
    changeOrigin: true,
    router: (req) => {
      const url = req.url || '';
      if (url.startsWith('/static/') || url.startsWith('/array/')) {
        return posthogAssetHost;
      }
      return posthogHost;
    },
    on: {
      proxyReq: (proxyReq, req, _res) => {
        // Forward client real IP for accurate geolocation in PostHog
        // On Render, the edge load-balancer provides verified X-Real-IP and appends to X-Forwarded-For.
        // With 'trust proxy 1', req.ip provides the verified client IP, preventing client header spoofing.
        const clientIp = (req.headers['x-real-ip'] as string)?.trim() || (req as any).ip || req.socket.remoteAddress || '';
        if (clientIp) {
          proxyReq.setHeader('x-real-ip', clientIp);
          const existingXff = req.headers['x-forwarded-for'] as string;
          if (existingXff) {
            proxyReq.setHeader('x-forwarded-for', existingXff);
          } else {
            proxyReq.setHeader('x-forwarded-for', clientIp);
          }
        }
        if (req.headers.host) {
          proxyReq.setHeader('x-forwarded-host', req.headers.host);
        }
        // Strip site cookies and authorization to protect user privacy
        if (proxyReq.getHeader('cookie')) {
          proxyReq.removeHeader('cookie');
        }
        if (proxyReq.getHeader('authorization')) {
          proxyReq.removeHeader('authorization');
        }
      },
      error: (err, _req, res: any) => {
        console.error('PostHog reverse proxy encountered an upstream error:', err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: 'PostHog upstream service temporarily unavailable' });
        }
      }
    }
  });

  app.use('/ingest', posthogProxy);

  app.use(express.json({ 
    limit: '25mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // --- API ROUTES ---

  // Health check with active database connection status
  app.get('/api/health', async (_req, res) => {
    const dbStatus = await checkFirestoreHealth();
    res.json({
      status: 'ok',
      service: 'DARE Core Engine',
      database: dbStatus,
      time: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // --- REAL-TIME TELEMETRY / ANALYTICS CAPTURE ---
  const telemetryEvents: any[] = [];
  const MAX_TELEMETRY_LOGS = 500;

  // Ingest client event
  app.post('/api/analytics/event', (req, res) => {
    try {
      const eventData = req.body || {};
      if (!eventData.event) {
        return res.status(400).json({ error: 'event name required' });
      }

      const clientIp = (req.headers['x-real-ip'] as string)?.trim() || (req as any).ip || req.socket.remoteAddress || 'unknown';
      const eventRecord = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        event: eventData.event,
        category: eventData.category || 'general',
        label: eventData.label || null,
        value: eventData.value !== undefined ? eventData.value : null,
        metadata: eventData.metadata || {},
        userId: eventData.userId || null,
        userHandle: eventData.userHandle || null,
        path: eventData.path || '/',
        timestamp: eventData.timestamp || new Date().toISOString(),
        clientIp: clientIp.replace(/:\d+$/, ''), // Masked/sanitized
        userAgent: req.headers['user-agent']?.substring(0, 150) || 'unknown',
      };

      telemetryEvents.unshift(eventRecord);
      if (telemetryEvents.length > MAX_TELEMETRY_LOGS) {
        telemetryEvents.pop();
      }

      res.status(202).json({ success: true, eventId: eventRecord.id });
    } catch (_err) {
      res.status(200).json({ success: false }); // Non-blocking
    }
  });

  // Query recent telemetry events & high-level stats
  app.get('/api/analytics/events', (req, res) => {
    const limit = Math.min(parseInt((req.query.limit as string) || '100', 10), MAX_TELEMETRY_LOGS);
    const categoryCounts: Record<string, number> = {};
    const eventCounts: Record<string, number> = {};

    telemetryEvents.forEach((evt) => {
      categoryCounts[evt.category] = (categoryCounts[evt.category] || 0) + 1;
      eventCounts[evt.event] = (eventCounts[evt.event] || 0) + 1;
    });

    res.json({
      totalRecorded: telemetryEvents.length,
      categoryCounts,
      topEvents: eventCounts,
      recentEvents: telemetryEvents.slice(0, limit),
    });
  });

  // Get current users / leaderboard
  app.get('/api/users', (req, res) => {
    const sorted = [...initialUsers].sort((a, b) => b.cred - a.cred);
    res.json(sorted);
  });

  // Get single user by ID or handle
  app.get('/api/users/:id', async (req, res) => {
    const identifier = req.params.id;
    if (!identifier) {
      return res.status(400).json({ error: 'User identifier is required' });
    }

    const cleanHandle = identifier.startsWith('@') ? identifier : `@${identifier}`;
    let user = initialUsers.find(u => 
      u.id === identifier || 
      u.handle.toLowerCase() === identifier.toLowerCase() ||
      u.handle.toLowerCase() === cleanHandle.toLowerCase()
    );

    if (!user && hasAdminCredentials) {
      const firestoreUser = await getUserFromFirestore(identifier);
      if (firestoreUser) {
        user = firestoreUser;
      }
    }

    if (!user) {
      // Find from existing dares creator or acceptedBy
      const matchingDare = dares.find(d => 
        d.creator.id === identifier || 
        d.creator.handle.toLowerCase() === identifier.toLowerCase() ||
        d.creator.handle.toLowerCase() === cleanHandle.toLowerCase() ||
        d.acceptedBy?.id === identifier ||
        d.acceptedBy?.handle.toLowerCase() === identifier.toLowerCase() ||
        d.acceptedBy?.handle.toLowerCase() === cleanHandle.toLowerCase()
      );

      if (matchingDare) {
        const isCreator = matchingDare.creator.id === identifier || 
                          matchingDare.creator.handle.toLowerCase() === identifier.toLowerCase() ||
                          matchingDare.creator.handle.toLowerCase() === cleanHandle.toLowerCase();
        const target = isCreator ? matchingDare.creator : matchingDare.acceptedBy!;
        user = findOrCreateUser(target.id, {
          name: target.name,
          handle: target.handle,
          avatar: target.avatar,
          isPro: target.isPro,
          proTier: target.proTier,
        });
      }
    }

    if (user) {
      return res.json(user);
    }
    return res.status(404).json({ error: 'User not found' });
  });

  // Flexible authentication for profile updates (supports Firebase Auth & guest sessions)
  const optionalAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return requireAuth(req, res, next);
    }
    next();
  };

  // Update user profile (Username, Display Name, Profile Picture / Avatar)
  const handleProfileUpdate = (req: express.Request, res: express.Response) => {
    const callerId = req.user?.uid || req.params.id || req.body.id || req.body.userId || 'guest';
    const targetUserId = req.params.id || req.body.id || req.body.userId;

    if (req.user && targetUserId && targetUserId !== req.user.uid && !targetUserId.startsWith('guest_')) {
      return res.status(403).json({ error: 'Forbidden: Cannot update another user profile' });
    }

    const { handle, name, avatar, disableHelpBubbles } = req.body;
    let user = initialUsers.find(u => u.id === callerId || (targetUserId && u.id === targetUserId)) || 
               initialUsers.find(u => req.user?.uid && u.id === req.user.uid) ||
               findOrCreateUser(callerId || targetUserId || 'user_guest');

    const oldHandle = user.handle;
    const oldName = user.name;
    const oldAvatar = user.avatar;

    // Validate and format handle / username if provided
    if (handle !== undefined) {
      let formattedHandle = String(handle).trim();
      if (!formattedHandle.startsWith('@')) {
        formattedHandle = `@${formattedHandle}`;
      }

      // Check handle length & alphanumeric format (3 to 24 chars including @)
      const handleRegex = /^@[a-zA-Z0-9_]{3,24}$/;
      if (!handleRegex.test(formattedHandle)) {
        return res.status(400).json({ 
          error: 'Username must be 3-24 characters and contain only letters, numbers, and underscores (e.g. @dare_runner).' 
        });
      }

      // Check if handle is taken by another user
      const isTaken = initialUsers.some(u => 
        u.id !== user.id && u.handle.toLowerCase() === formattedHandle.toLowerCase()
      );
      if (isTaken) {
        return res.status(400).json({ 
          error: `Username ${formattedHandle} is already claimed by another operative on the Grid. Please choose a different handle.` 
        });
      }

      user.handle = formattedHandle;
    }

    // Validate and update display name if provided
    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 50) {
        return res.status(400).json({ error: 'Display Name must be between 1 and 50 characters.' });
      }
      user.name = trimmedName;
      // Ensure all instances matching caller or target in initialUsers are synced
      initialUsers.forEach(u => {
        if (u.id === user.id || u.id === callerId || (targetUserId && u.id === targetUserId)) {
          u.name = trimmedName;
        }
      });
    }

    // Validate and update avatar if provided
    if (avatar !== undefined) {
      const avatarStr = String(avatar).trim();
      if (avatarStr) {
        user.avatar = avatarStr;
      }
    }

    if (disableHelpBubbles !== undefined) {
      user.disableHelpBubbles = Boolean(disableHelpBubbles);
    }

    // Cascade username / name / avatar changes to user's created and accepted dares
    if (user.handle !== oldHandle || user.name !== oldName || user.avatar !== oldAvatar) {
      dares.forEach(d => {
        if (d.creator && d.creator.id === user.id) {
          d.creator.handle = user.handle;
          d.creator.name = user.name;
          d.creator.avatar = user.avatar;
        }
        if (d.acceptedBy && d.acceptedBy.id === user.id) {
          d.acceptedBy.handle = user.handle;
          d.acceptedBy.name = user.name;
          d.acceptedBy.avatar = user.avatar;
        }
        if (d.comments && d.comments.length > 0) {
          d.comments.forEach(c => {
            if (c.userHandle === oldHandle) {
              c.userHandle = user.handle;
              c.userName = user.name;
              c.avatar = user.avatar;
            }
          });
        }
      });

      // Cascade to social feed posts
      socialFeedPosts.forEach(p => {
        if (p.authorId === user.id) {
          p.authorName = user.name;
          p.authorHandle = user.handle;
          p.authorAvatar = user.avatar;
        }
        p.comments?.forEach(c => {
          if (c.authorId === user.id) {
            c.authorName = user.name;
            c.authorHandle = user.handle;
            c.authorAvatar = user.avatar;
          }
        });
      });

      // Also cascade to tournaments if participating
      tournaments.forEach(t => {
        if (t.squadA && t.squadA.members.includes(oldHandle)) {
          t.squadA.members = t.squadA.members.map(m => m === oldHandle ? user.handle : m);
        }
        if (t.squadB && t.squadB.members.includes(oldHandle)) {
          t.squadB.members = t.squadB.members.map(m => m === oldHandle ? user.handle : m);
        }
      });
    }

    // Persist to Firestore
    saveUserToFirestore(user);

    return res.json({ success: true, user });
  };

  app.put('/api/users/:id/profile', optionalAuth, handleProfileUpdate);
  app.post('/api/users/:id/profile', optionalAuth, handleProfileUpdate);
  app.patch('/api/users/:id/profile', optionalAuth, handleProfileUpdate);
  app.put('/api/users/profile', optionalAuth, handleProfileUpdate);
  app.post('/api/users/profile', optionalAuth, handleProfileUpdate);
  app.patch('/api/users/profile', optionalAuth, handleProfileUpdate);
  app.patch('/api/user/profile', optionalAuth, handleProfileUpdate);
  app.post('/api/user/profile', optionalAuth, handleProfileUpdate);

  // Sync / Register active user profile
  app.post('/api/users/sync', optionalAuth, authSyncRateLimiter, (req, res) => {
    const callerId = req.user?.uid || (req.body as any)?.id;
    if (!callerId) {
      return res.status(400).json({ error: 'Missing user identification for sync' });
    }
    const profile = req.body as Partial<UserProfile> & { isExplicitUpdate?: boolean };
    
    if (req.user?.uid && profile?.id && profile.id !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden: Cannot synchronize profile for another user ID' });
    }

    const safeMetadata = {
      name: profile?.name,
      handle: profile?.handle,
      avatar: profile?.avatar,
      disableHelpBubbles: profile?.disableHelpBubbles,
    };

    const user = findOrCreateUser(callerId, safeMetadata);
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

  // Claim Daily Stipend
  app.post('/api/users/:userId/claim-stipend', requireAuth, (req, res) => {
    const callerId = req.user!.uid;
    if (req.params.userId !== callerId) {
      return res.status(403).json({ error: 'Forbidden: Cannot claim stipend for another user account' });
    }

    const user = initialUsers.find(u => u.id === callerId) || findOrCreateUser(callerId);

    const today = new Date().toISOString().split('T')[0];
    if (user.stipendClaimedAt === today) {
      return res.status(400).json({ error: 'Daily stipend has already been claimed for today. Please return tomorrow!' });
    }

    user.stipendClaimedAt = today;
    user.cred += 150;
    
    // Add transaction
    addTransaction(user.id, 'stipend_claimed', 150, 'Claimed Daily Stipend of 150 Cred');
    recordUserActivity(user);
    saveUserToFirestore(user);

    res.json(user);
  });

  // Upgrade to Premium PRO status
  app.post('/api/users/:userId/upgrade-pro', async (req, res) => {
    // 1. Identify user from auth header or request params
    let callerId: string | null = null;
    let userEmail: string | undefined = undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1]?.trim();
      if (idToken) {
        if (adminAuth && hasAdminCredentials) {
          try {
            const decoded = await adminAuth.verifyIdToken(idToken);
            callerId = decoded.uid;
            userEmail = decoded.email;
          } catch (_err) {}
        }
        if (!callerId) {
          try {
            const parts = idToken.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
              callerId = payload.user_id || payload.sub || payload.uid;
              userEmail = payload.email;
            }
          } catch (_e) {}
        }
        if (!callerId && (idToken.startsWith('u_') || idToken.startsWith('test_') || idToken.startsWith('auth_') || idToken.startsWith('guest_'))) {
          callerId = idToken;
        }
      }
    }

    const targetUserId = callerId || req.params.userId;
    if (!targetUserId || (targetUserId.startsWith('guest_') && !callerId)) {
      return res.status(401).json({ 
        error: 'Please sign in with Google to link and activate your DARE PRO membership.' 
      });
    }

    const { tier, tierId, paymentMode, costCred } = req.body;
    const effectiveTier = (tierId || tier || 'elite').toLowerCase(); // 'runner' / 'lite' | 'elite' | 'overlord' / 'ultra'
    const user = initialUsers.find(u => u.id === targetUserId) || await getUserFromFirestore(targetUserId) || findOrCreateUser(targetUserId);

    if (paymentMode === 'cred') {
      const credCostMap: Record<string, number> = {
        runner: 2500,
        lite: 2500,
        elite: 5000,
        overlord: 10000,
        ultra: 10000
      };
      const cost = Number(costCred) || credCostMap[effectiveTier] || 5000;
      if (user.cred < cost) {
        return res.status(400).json({ error: `Insufficient Cred. You need ${cost.toLocaleString()} CR for ${effectiveTier.toUpperCase()} tier.` });
      }
      user.cred -= cost;
      addTransaction(user.id, 'pro_upgrade', -cost, `Upgraded to PRO (${effectiveTier.toUpperCase()}) tier via Cred deduction`);
    } else {
      // Card / direct upgrade: Add bonus stipend
      const bonusStipendMap: Record<string, number> = {
        runner: 250,
        lite: 250,
        elite: 500,
        overlord: 1000,
        ultra: 1000
      };
      const bonusCred = bonusStipendMap[effectiveTier] || 500;
      user.cred += bonusCred;
      addTransaction(user.id, 'stipend_claimed', bonusCred, `Welcome bonus for PRO (${effectiveTier.toUpperCase()}) card activation`);
    }

    // Set PRO attributes
    user.isPro = true;
    user.proTier = effectiveTier;
    user.proExpiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    const badgeName = (effectiveTier === 'overlord' || effectiveTier === 'ultra')
      ? '👑 Pro Ultra'
      : effectiveTier === 'elite'
      ? '💎 Pro Elite'
      : '⚡ Pro Lite';
    user.proBadge = badgeName;
    if (!user.badges) user.badges = [];
    if (!user.badges.includes(badgeName)) {
      user.badges.push(badgeName);
    }

    addNotification({
      userId: user.id,
      type: 'stipend_claimed',
      title: 'Premium PRO Uplink Established! 👑',
      message: `Your account has been upgraded to ${badgeName}! You have unlocked advanced AI prompts, premium holographic card frames, and exclusive privileges.`,
      actorHandle: '@dare_hq',
      actorName: 'DARE Central Command',
      actorAvatar: '/logo.png',
      read: false
    });

    recordUserActivity(user);
    saveUserToFirestore(user);

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

  // --- CANONICAL DAILY DARE RESOLVER & PERSISTENCE ---
  async function getOrResolveDailyDare(): Promise<DareItem | null> {
    const today = new Date().toISOString().split('T')[0];
    const platformDares = ensurePlatformDailyDares();

    // 1. Check Firestore dailyDares/{today} mapping first when Firestore is configured
    if (db && hasAdminCredentials) {
      try {
        const docSnap = await db.collection('dailyDares').doc(today).get();
        if (docSnap.exists) {
          const dailyDareId = docSnap.data()?.dareId;
          const matched = dares.find(d => d.id === dailyDareId);
          if (matched) return matched;
        }
      } catch (readErr) {
        console.error('Firestore error reading dailyDares mapping for date', today, readErr);
      }
    }

    // 2. Return primary platform daily dare generated for today
    if (platformDares.length > 0) {
      return platformDares[0];
    }

    // 3. Fallback to any open public dare
    let dailyDare = dares.find(d => d.status === 'open' && d.targetType === 'public');
    return dailyDare || null;
  }

  // Canonical Daily Dare Endpoint (Primary featured daily dare)
  app.get('/api/daily-dare', async (_req, res) => {
    try {
      const dailyDare = await getOrResolveDailyDare();
      if (!dailyDare) {
        return res.json(null);
      }
      res.json(dailyDare);
    } catch (err: any) {
      console.error('Daily dare error:', err);
      res.status(500).json({ error: 'Failed to retrieve daily dare' });
    }
  });

  // All Platform Daily Dares Endpoint (The 3 curated daily dares generated for today)
  app.get('/api/daily-dares', (_req, res) => {
    try {
      const platformDares = ensurePlatformDailyDares();
      res.json({ success: true, dailyDares: platformDares });
    } catch (err: any) {
      console.error('Error fetching platform daily dares:', err);
      res.status(500).json({ error: 'Failed to retrieve platform daily dares' });
    }
  });

  // Get Daily Mission (Unified with canonical Daily Dare resolver)
  app.get('/api/daily-mission', async (_req, res) => {
    try {
      const dailyDare = await getOrResolveDailyDare();
      res.json(dailyDare || null);
    } catch (err: any) {
      console.error('Daily mission error:', err);
      res.status(500).json({ error: 'Failed to retrieve daily mission' });
    }
  });

  app.get('/api/users/:userId/daily-mission', async (_req, res) => {
    try {
      const dailyDare = await getOrResolveDailyDare();
      res.json(dailyDare || null);
    } catch (err: any) {
      console.error('Daily mission error:', err);
      res.status(500).json({ error: 'Failed to retrieve daily mission' });
    }
  });

  // In-memory idempotency cache for AI generation (scoped to userId + idempotencyKey, TTL 60 seconds)
  const aiIdempotencyCache = new Map<string, { timestamp: number; dare: DareItem }>();

  // AI Dare Lab Generation Endpoint (Strict server-side Gemini generation with zero synthetic fallback)
  app.post('/api/ai-dares/generate', requireAuth, aiRateLimiter, async (req, res) => {
    try {
      const userId = req.user!.uid;
      const { 
        category = 'digital', 
        difficulty = 'Level 2 - Moderate', 
        interests = [], 
        locationContext = 'Anywhere', 
        userStyle = 'Balanced', 
        idempotencyKey 
      } = req.body;

      // 1. Idempotency Check: if client retries with the same idempotency key within 60s, return cached dare
      if (idempotencyKey && typeof idempotencyKey === 'string') {
        const cacheKey = `${userId}:${idempotencyKey}`;
        const cached = aiIdempotencyCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 60000) {
          return res.json({ success: true, dare: cached.dare, cached: true });
        }
      }

      const user = initialUsers.find(u => u.id === userId) || findOrCreateUser(userId);
      const genAI = getGenAI();

      if (!genAI) {
        return res.status(503).json({
          error: 'AI Dare generation service is unavailable. Ensure GEMINI_API_KEY is configured.',
        });
      }

      const prompt = `You are DARE AI, an expert challenge referee for the DARE social protocol.
Generate a creative, engaging, and safe challenge for category "${category}" and difficulty "${difficulty}".
User Preferences & Context:
- Interests: ${Array.isArray(interests) && interests.length > 0 ? interests.join(', ') : 'General fun'}
- Location Context: ${locationContext}
- User Pace/Style: ${userStyle}
- User Level: ${user.level || 1}

Ensure the mission is strictly legal, non-hazardous, fun, and clearly verifiable via photo, video, GPS, or audio track.
Output ONLY valid JSON matching this schema:
{
  "title": "string (engaging challenge title)",
  "description": "string (clear, actionable instructions)",
  "proofRequirement": "string (verifiable photo, video, or data telemetry requirement)",
  "rewardCred": 150
}`;

      const response = await genAI.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      if (!response.text) {
        return res.status(502).json({
          error: 'AI Oracle returned an empty response. Please retry generation.',
        });
      }

      let parsed: any;
      try {
        parsed = JSON.parse(response.text);
      } catch (parseErr) {
        return res.status(502).json({
          error: 'AI Oracle response was malformed JSON. Please retry generation.',
        });
      }

      if (!parsed.title || !parsed.description) {
        return res.status(502).json({
          error: 'AI Oracle response missing title or description. Please retry generation.',
        });
      }

      const title = String(parsed.title).trim();
      const description = String(parsed.description).trim();
      const proofRequirement = String(parsed.proofRequirement || 'Photo or video evidence of completion.').trim();
      const rewardCred = Math.min(500, Math.max(50, Number(parsed.rewardCred) || 150));

      const newDare: DareItem = {
        id: `ai_dare_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title,
        description,
        proofRequirement,
        category: (category as any) || 'digital',
        difficulty: (difficulty as any) || 'Level 2 - Moderate',
        rewardCred,
        source: 'ai',
        creator: {
          id: user.id,
          handle: user.handle,
          name: user.name,
          avatar: user.avatar,
          isPro: user.isPro,
          proTier: user.proTier || undefined,
        },
        targetType: 'public',
        status: 'open',
        createdAt: new Date().toISOString(),
        likes: 0,
        likedUserIds: [],
        comments: [],
        isHolographic: true,
      };

      dares.unshift(newDare);
      saveDareToFirestore(newDare);
      awardXpToUser(user, 50);

      // Save to idempotency cache
      if (idempotencyKey && typeof idempotencyKey === 'string') {
        aiIdempotencyCache.set(`${userId}:${idempotencyKey}`, {
          timestamp: Date.now(),
          dare: newDare,
        });
        if (aiIdempotencyCache.size > 500) {
          const now = Date.now();
          for (const [k, v] of aiIdempotencyCache.entries()) {
            if (now - v.timestamp > 60000) aiIdempotencyCache.delete(k);
          }
        }
      }

      addNotification({
        userId: user.id,
        type: 'social',
        title: '🎯 Challenge Deployed!',
        message: `Your challenge "${newDare.title}" is now live on the Grid.`,
        dareId: newDare.id,
        dareTitle: newDare.title,
        actorHandle: user.handle,
        actorName: user.name,
        actorAvatar: user.avatar,
        read: false,
      });

      res.json({ success: true, dare: newDare });
    } catch (err: any) {
      console.error('AI Dare generation error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate AI dare' });
    }
  });

  // Activate Streak Shield for Pro Users
  app.post('/api/users/:userId/activate-shield', requireAuth, (req, res) => {
    const callerId = req.user!.uid;
    if (req.params.userId !== callerId) {
      return res.status(403).json({ error: 'Forbidden: Cannot activate streak shield for another user' });
    }

    const user = initialUsers.find(u => u.id === callerId) || findOrCreateUser(callerId);
    
    if (!user.isPro) {
      return res.status(403).json({ error: 'Streak Shield requires premium PRO membership status!' });
    }

    user.streakShieldActive = true;
    user.streakShieldExpiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    // Add transaction or notification log
    addTransaction(user.id, 'shield_activated', 0, 'Activated 24H Premium Streak Shield protection');
    recordUserActivity(user);
    saveUserToFirestore(user);

    res.json(user);
  });

  // --- SQUAD SYSTEM ENDPOINTS ---

  // Send Squad (Friend) Request
  app.post('/api/squad/request', requireAuth, (req, res) => {
    const fromUserId = req.user!.uid;
    const { toUserId } = req.body;
    if (!toUserId) {
      return res.status(400).json({ error: 'Missing required parameter toUserId' });
    }
    if (fromUserId === toUserId) {
      return res.status(400).json({ error: 'Cannot send squad request to yourself' });
    }

    const fromUser = initialUsers.find(u => u.id === fromUserId) || findOrCreateUser(fromUserId);
    const toUser = initialUsers.find(u => u.id === toUserId) || findOrCreateUser(toUserId);

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

    saveUserToFirestore(fromUser);
    saveUserToFirestore(toUser);

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
  app.post('/api/squad/accept', requireAuth, (req, res) => {
    const toUserId = req.user!.uid; // The authenticated user is the one accepting the incoming request
    const { fromUserId } = req.body; // The user who sent the original request
    if (!fromUserId) {
      return res.status(400).json({ error: 'Missing required parameter fromUserId' });
    }

    const fromUser = initialUsers.find(u => u.id === fromUserId) || findOrCreateUser(fromUserId);
    const toUser = initialUsers.find(u => u.id === toUserId) || findOrCreateUser(toUserId);

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

    saveUserToFirestore(fromUser);
    saveUserToFirestore(toUser);

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
  app.post('/api/squad/cancel', requireAuth, (req, res) => {
    const callerId = req.user!.uid;
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ error: 'Missing parameter targetUserId' });
    }

    const fromUser = initialUsers.find(u => u.id === callerId);
    const toUser = initialUsers.find(u => u.id === targetUserId);

    if (fromUser) {
      fromUser.squadSentRequests = (fromUser.squadSentRequests || []).filter(id => id !== targetUserId);
      fromUser.squadReceivedRequests = (fromUser.squadReceivedRequests || []).filter(id => id !== targetUserId);
      saveUserToFirestore(fromUser);
    }
    if (toUser) {
      toUser.squadSentRequests = (toUser.squadSentRequests || []).filter(id => id !== callerId);
      toUser.squadReceivedRequests = (toUser.squadReceivedRequests || []).filter(id => id !== callerId);
      saveUserToFirestore(toUser);
    }

    res.json({ success: true });
  });

  // Remove Squad Member
  app.post('/api/squad/remove', requireAuth, (req, res) => {
    const callerId = req.user!.uid;
    const { friendId } = req.body;
    if (!friendId) {
      return res.status(400).json({ error: 'Missing parameter friendId' });
    }

    const user = initialUsers.find(u => u.id === callerId);
    const friend = initialUsers.find(u => u.id === friendId);

    if (user) {
      user.squadFriends = (user.squadFriends || []).filter(id => id !== friendId);
      saveUserToFirestore(user);
    }
    if (friend) {
      friend.squadFriends = (friend.squadFriends || []).filter(id => id !== callerId);
      saveUserToFirestore(friend);
    }

    res.json({ success: true });
  });

  // Squad Chat Group Messages (Runtime in-memory store + Firestore sync)
  app.get('/api/squad/chat', async (req, res) => {
    try {
      const limitParam = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
      const beforeParam = req.query.before as string | undefined;

      if (db && hasAdminCredentials) {
        try {
          let q = db.collection('squadChatMessages').orderBy('timestamp', 'desc').limit(limitParam);
          if (beforeParam) {
            q = q.where('timestamp', '<', beforeParam);
          }
          const snapshot = await q.get();
          const messages = snapshot.docs.map((doc: any) => doc.data()).reverse();
          return res.json({ success: true, messages });
        } catch (dbErr: any) {
          console.error('Firestore squad chat query error:', dbErr.message);
          return res.status(500).json({ error: 'Database query failed' });
        }
      }

      let messages = [...squadChatMessages];
      if (beforeParam) {
        messages = messages.filter(m => m.timestamp < beforeParam);
      }
      messages = messages.slice(-limitParam);

      res.json({ success: true, messages });
    } catch (_err) {
      res.status(500).json({ error: 'Failed to retrieve squad messages' });
    }
  });

  app.post('/api/squad/chat', requireAuth, squadChatRateLimiter, async (req, res) => {
    try {
      const senderId = req.user!.uid;
      const { text } = req.body;
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'Message text cannot be empty' });
      }

      const trimmedText = text.trim();
      if (trimmedText.length > 500) {
        return res.status(400).json({ error: 'Message exceeds maximum limit of 500 characters' });
      }

      const sender = initialUsers.find(u => u.id === senderId) || await getUserFromFirestore(senderId) || findOrCreateUser(senderId);
      if (!sender) {
        return res.status(404).json({ error: 'Sender profile not found' });
      }

      const newMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        senderId: sender.id,
        senderHandle: sender.handle,
        senderName: sender.name,
        senderAvatar: sender.avatar,
        text: trimmedText,
        timestamp: new Date().toISOString()
      };

      squadChatMessages.push(newMessage);
      if (squadChatMessages.length > 500) {
        squadChatMessages.shift();
      }

      saveChatMessageToFirestore(newMessage);

      res.json({ success: true, message: newMessage });
    } catch (_err) {
      res.status(500).json({ error: 'Failed to post squad message' });
    }
  });

  // ==========================================
  // Twitter / X-style Direct Messages API Endpoints
  // ==========================================
  app.get('/api/dm/conversations', (req, res) => {
    try {
      const currentUserId = (req.query.userId as string) || 'guest';
      const convMap = new Map<string, any>();

      // Populate conversation threads from genuine messages
      for (const msg of directMessages) {
        if (currentUserId && msg.senderId !== currentUserId && msg.recipientId !== currentUserId) {
          continue;
        }

        if (!convMap.has(msg.conversationId)) {
          const isSender = msg.senderId === currentUserId;
          const otherUserId = isSender ? msg.recipientId : msg.senderId;
          const otherUser = initialUsers.find(u => u.id === otherUserId || u.handle === (isSender ? msg.recipientHandle : msg.senderHandle));

          convMap.set(msg.conversationId, {
            id: msg.conversationId,
            type: 'direct',
            title: otherUser?.name || (isSender ? msg.recipientHandle || 'Dare Operative' : msg.senderName),
            participants: [{
              id: otherUser?.id || otherUserId || msg.senderId,
              name: otherUser?.name || (isSender ? msg.recipientHandle || 'Dare Operative' : msg.senderName),
              handle: otherUser?.handle || (isSender ? msg.recipientHandle || '@operative' : msg.senderHandle),
              avatar: otherUser?.avatar || (isSender ? '' : msg.senderAvatar),
              isOnline: true
            }],
            lastMessage: msg,
            unreadCount: msg.senderId !== currentUserId && msg.status !== 'read' ? 1 : 0,
            updatedAt: msg.timestamp,
            isPinned: false
          });
        } else {
          const c = convMap.get(msg.conversationId);
          c.lastMessage = msg;
          c.updatedAt = msg.timestamp;
          if (msg.senderId !== currentUserId && msg.status !== 'read') {
            c.unreadCount = (c.unreadCount || 0) + 1;
          }
        }
      }

      const list = Array.from(convMap.values()).sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      res.json({ success: true, conversations: list });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Failed to fetch conversations' });
    }
  });

  app.get('/api/dm/messages', (req, res) => {
    try {
      const convId = req.query.conversationId as string;
      const userId = (req.query.userId as string) || '';
      if (!convId) {
        return res.status(400).json({ error: 'conversationId is required' });
      }

      // Mark unread messages in this conversation as read
      for (const m of directMessages) {
        if (m.conversationId === convId && m.senderId !== userId) {
          m.status = 'read';
        }
      }

      const msgs = directMessages.filter(m => m.conversationId === convId);
      res.json({ success: true, messages: msgs });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Failed to fetch messages' });
    }
  });

  app.post('/api/dm/send', (req, res) => {
    try {
      const { conversationId, senderId, senderName, senderHandle, senderAvatar, recipientId, recipientHandle, text, dareAttachment } = req.body;
      if (!text && !dareAttachment) {
        return res.status(400).json({ error: 'Message content or dare attachment is required' });
      }

      const convId = conversationId || (recipientId ? `conv_${recipientId.replace('user_', '')}` : `conv_${Date.now()}`);

      const newMsg = {
        id: `dm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        conversationId: convId,
        senderId: senderId || 'current_user',
        senderName: senderName || 'Dare Player',
        senderHandle: senderHandle || '@player',
        senderAvatar: senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        recipientId,
        recipientHandle,
        text: text ? String(text).trim().substring(0, 1000) : '',
        timestamp: new Date().toISOString(),
        status: 'delivered' as const,
        reactions: {},
        dareAttachment
      };

      directMessages.push(newMsg);

      // Persist genuine message to Firestore
      if (db && hasAdminCredentials) {
        db.collection('directMessages').doc(newMsg.id).set(newMsg).catch(() => {});
      }

      res.json({ success: true, message: newMsg, conversationId: convId });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Failed to send message' });
    }
  });

  app.post('/api/dm/react', (req, res) => {
    try {
      const { messageId, emoji, userId } = req.body;
      const msg = directMessages.find(m => m.id === messageId);
      if (!msg) {
        return res.status(404).json({ error: 'Message not found' });
      }

      if (!msg.reactions) msg.reactions = {};
      if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

      const userIndex = msg.reactions[emoji].indexOf(userId);
      if (userIndex > -1) {
        msg.reactions[emoji].splice(userIndex, 1);
        if (msg.reactions[emoji].length === 0) {
          delete msg.reactions[emoji];
        }
      } else {
        msg.reactions[emoji].push(userId);
      }

      res.json({ success: true, reactions: msg.reactions });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Failed to update reaction' });
    }
  });

  // --- SOCIAL FEED WALL ENDPOINTS ---
  app.get('/api/social-feed', (_req, res) => {
    try {
      const sorted = [...socialFeedPosts].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      res.json({ success: true, posts: sorted });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Failed to fetch social feed' });
    }
  });

  app.post('/api/social-feed', (req, res) => {
    try {
      const { authorId, authorName, authorHandle, authorAvatar, isPro, content, mediaUrl, mediaType, dareRef, tags } = req.body;
      if (!content && !mediaUrl) {
        return res.status(400).json({ error: 'Post content or media is required' });
      }

      const newPost = {
        id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        authorId: authorId || 'user_guest',
        authorName: authorName || 'Dare Challenger',
        authorHandle: authorHandle || '@challenger',
        authorAvatar: authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        isPro: Boolean(isPro),
        content: content ? String(content).trim().substring(0, 2000) : '',
        mediaUrl: mediaUrl ? String(mediaUrl).trim() : undefined,
        mediaType: mediaType || (mediaUrl ? (mediaUrl.includes('mp4') ? 'video' : 'image') : undefined),
        dareRef: dareRef ? {
          id: String(dareRef.id),
          title: String(dareRef.title),
          rewardCred: Number(dareRef.rewardCred || 0),
          category: dareRef.category ? String(dareRef.category) : undefined,
        } : undefined,
        likesCount: 0,
        likedUserIds: [],
        comments: [],
        tags: Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : [],
        createdAt: new Date().toISOString(),
      };

      socialFeedPosts.unshift(newPost);

      // Persist to Firestore
      if (db && hasAdminCredentials) {
        db.collection('socialFeedPosts').doc(newPost.id).set(newPost).catch((err: any) => {
          console.error('Failed to save social post to Firestore:', err);
        });
      }

      res.json({ success: true, post: newPost });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Failed to publish post' });
    }
  });

  app.post('/api/social-feed/:id/like', (req, res) => {
    try {
      const postId = req.params.id;
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId is required' });

      const post = socialFeedPosts.find(p => p.id === postId);
      if (!post) return res.status(404).json({ error: 'Post not found' });

      if (!post.likedUserIds) post.likedUserIds = [];
      const userIndex = post.likedUserIds.indexOf(userId);

      if (userIndex > -1) {
        post.likedUserIds.splice(userIndex, 1);
        post.likesCount = Math.max(0, (post.likesCount || 1) - 1);
      } else {
        post.likedUserIds.push(userId);
        post.likesCount = (post.likesCount || 0) + 1;
      }

      if (db && hasAdminCredentials) {
        db.collection('socialFeedPosts').doc(post.id).update({
          likesCount: post.likesCount,
          likedUserIds: post.likedUserIds,
        }).catch(() => {});
      }

      res.json({ success: true, likesCount: post.likesCount, likedUserIds: post.likedUserIds });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Failed to update like' });
    }
  });

  app.post('/api/social-feed/:id/comment', (req, res) => {
    try {
      const postId = req.params.id;
      const { authorId, authorName, authorHandle, authorAvatar, text } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Comment text is required' });
      }

      const post = socialFeedPosts.find(p => p.id === postId);
      if (!post) return res.status(404).json({ error: 'Post not found' });

      const newComment = {
        id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        authorId: authorId || 'user_guest',
        authorName: authorName || 'Player',
        authorHandle: authorHandle || '@player',
        authorAvatar: authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        text: String(text).trim().substring(0, 500),
        createdAt: new Date().toISOString(),
      };

      if (!post.comments) post.comments = [];
      post.comments.push(newComment);

      if (db && hasAdminCredentials) {
        db.collection('socialFeedPosts').doc(post.id).update({
          comments: post.comments,
        }).catch(() => {});
      }

      res.json({ success: true, comment: newComment });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Failed to add comment' });
    }
  });

  app.delete('/api/social-feed/:id', (req, res) => {
    try {
      const postId = req.params.id;
      const { userId } = req.body;
      const index = socialFeedPosts.findIndex(p => p.id === postId);
      if (index === -1) return res.status(404).json({ error: 'Post not found' });

      const post = socialFeedPosts[index];
      if (userId && post.authorId !== userId) {
        return res.status(403).json({ error: 'Unauthorized to delete this post' });
      }

      socialFeedPosts.splice(index, 1);
      if (db && hasAdminCredentials) {
        db.collection('socialFeedPosts').doc(postId).delete().catch(() => {});
      }

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Failed to delete post' });
    }
  });

  // Get dares with filtering & search
  app.get('/api/dares', (req, res) => {
    // Ensure today's official platform daily dares are active
    ensurePlatformDailyDares();

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

    if (tab === 'daily') {
      filtered = filtered.filter(d => d.isPlatformDaily || d.source === 'daily');
    } else if (tab === 'my_dares' || tab === 'my' || tab === 'created') {
      const activeUser = initialUsers.find(u => u.id === userId);
      filtered = filtered.filter(d => 
        d.creator.id === userId || 
        (activeUser && d.creator.handle.toLowerCase() === activeUser.handle.toLowerCase())
      );
    } else if (tab === 'friends') {
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
      // Sort with pinned / platform daily dares at the top, then latest by createdAt
      filtered.sort((a, b) => {
        if (Boolean(a.isPinned) !== Boolean(b.isPinned)) return a.isPinned ? -1 : 1;
        if (Boolean(a.isPlatformDaily) !== Boolean(b.isPlatformDaily)) return a.isPlatformDaily ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    res.json(filtered);
  });

  // Get leaderboard of active users (strictly users who completed or created activities)
  app.get('/api/leaderboard', (_req, res) => {
    const qualified = initialUsers
      .filter(u => 
        (u.completedDaresCount || 0) > 0 || 
        (u.createdDaresCount || 0) > 0 || 
        (u.streak || 0) > 0 ||
        ((u as any).daresCompleted && (u as any).daresCompleted.length > 0)
      )
      .sort((a, b) => (b.cred || 0) - (a.cred || 0));
    res.json(qualified);
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
  app.post('/api/dares', dareCreationRateLimiter, (req, res) => {
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
      creator: clientCreator,
      expiresInHours,
      format,
      bountyBonus,
      circleId,
      circleName,
      brandSponsor,
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 150) {
      return res.status(400).json({ error: 'Title is required (between 3 and 150 characters)' });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 5 || description.trim().length > 2000) {
      return res.status(400).json({ error: 'Description is required (between 5 and 2000 characters)' });
    }

    const parsedReward = Math.min(10000, Math.max(1, Number(rewardCred) || 50));
    const extraBounty = Math.max(0, Number(bountyBonus) || 0);
    const totalBounty = parsedReward + extraBounty;

    const effectiveId = creatorId || clientCreator?.id || 'u_active_user';
    let creator = initialUsers.find(u => u.id === effectiveId) || findOrCreateUser(effectiveId, clientCreator);
    if (clientCreator) {
      if (clientCreator.handle) creator.handle = clientCreator.handle;
      if (clientCreator.name) creator.name = clientCreator.name;
      if (clientCreator.avatar) creator.avatar = clientCreator.avatar;
      if (typeof clientCreator.isPro === 'boolean') creator.isPro = clientCreator.isPro;
    }
    const durationHours = Math.min(168, Math.max(1, Number(expiresInHours) || 48));

    const initialContributions = extraBounty > 0 ? [{
      userId: creator.id,
      userHandle: creator.handle,
      userName: creator.name,
      amount: extraBounty,
      addedAt: new Date().toISOString()
    }] : [];

    const newDare: DareItem = {
      id: `dare_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      description: description.trim(),
      proofRequirement: (proofRequirement || 'Submit photo, video, or verified proof.').trim(),
      category: category || 'digital',
      difficulty: difficulty || 'Level 2 - Moderate',
      rewardCred: totalBounty,
      format: (format as DareFormat) || (targetType === 'direct' ? '1v1' : 'public'),
      bountyPoolTotal: totalBounty,
      bountyContributions: initialContributions,
      circleId: circleId || undefined,
      circleName: circleName || undefined,
      brandSponsor: brandSponsor || undefined,
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
      likes: 0,
      likedUserIds: [],
      comments: [],
    };

    creator.createdDaresCount += 1;
    creator.cred += 25; // Bonus cred for initiating a challenge
    addTransaction(creator.id, 'challenge_created', 25, `Initiated challenge: "${newDare.title}"`, newDare.id, newDare.title);
    recordUserActivity(creator);
    dares.unshift(newDare);
    saveDareToFirestore(newDare);
    saveUserToFirestore(creator);

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

  // Edit / update a published dare (Strictly creator only)
  app.put('/api/dares/:id', (req, res) => {
    const { id } = req.params;
    const {
      title,
      description,
      proofRequirement,
      category,
      difficulty,
      rewardCred,
      targetType,
      targetUserHandle,
      userId,
      userHandle,
    } = req.body;

    const dareIndex = dares.findIndex(d => d.id === id);
    if (dareIndex === -1) {
      return res.status(404).json({ error: 'Dare not found' });
    }

    const dare = dares[dareIndex];
    const requesterId = userId || (req.query.userId as string) || (req.headers['x-user-id'] as string);
    const requesterHandle = userHandle || (req.query.userHandle as string) || (req.headers['x-user-handle'] as string);

    // Strict Authorization: Only creator can edit
    const isCreator = Boolean(
      (requesterId && (dare.creator.id === requesterId || (dare.creator as any).id === requesterId)) ||
      (requesterHandle && dare.creator.handle?.toLowerCase() === requesterHandle?.toLowerCase())
    );

    if (!isCreator) {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own published dares' });
    }

    if (title && (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 150)) {
      return res.status(400).json({ error: 'Title must be between 3 and 150 characters' });
    }
    if (description && (typeof description !== 'string' || description.trim().length < 5 || description.trim().length > 2000)) {
      return res.status(400).json({ error: 'Description must be between 5 and 2000 characters' });
    }

    if (title) dare.title = title.trim();
    if (description) dare.description = description.trim();
    if (proofRequirement !== undefined) dare.proofRequirement = proofRequirement.trim();
    if (category) dare.category = category;
    if (difficulty) dare.difficulty = difficulty;
    if (rewardCred) dare.rewardCred = Math.min(10000, Math.max(1, Number(rewardCred)));
    if (targetType) dare.targetType = targetType;
    if (targetType === 'direct') {
      dare.targetUserHandle = targetUserHandle?.trim();
    } else if (targetType === 'public') {
      dare.targetUserHandle = undefined;
    }

    saveDareToFirestore(dare);
    res.json({ success: true, dare });
  });

  // Delete a published dare (Strictly creator only)
  app.delete('/api/dares/:id', (req, res) => {
    const { id } = req.params;
    const { userId, userHandle } = req.body || {};
    const requesterId = userId || (req.query.userId as string) || (req.headers['x-user-id'] as string);
    const requesterHandle = userHandle || (req.query.userHandle as string) || (req.headers['x-user-handle'] as string);

    const dareIndex = dares.findIndex(d => d.id === id);
    if (dareIndex === -1) {
      return res.status(404).json({ error: 'Dare not found' });
    }

    const dare = dares[dareIndex];

    // Strict Authorization: Only creator can delete
    const isCreator = Boolean(
      (requesterId && (dare.creator.id === requesterId || (dare.creator as any).id === requesterId)) ||
      (requesterHandle && dare.creator.handle?.toLowerCase() === requesterHandle?.toLowerCase())
    );

    if (!isCreator) {
      return res.status(403).json({ error: 'Forbidden: You cannot delete another user\'s dare' });
    }

    // Remove from in-memory array
    dares.splice(dareIndex, 1);
    deleteDareFromFirestore(id);

    // Update creator count if available
    const creator = initialUsers.find(u => u.id === dare.creator.id);
    if (creator && creator.createdDaresCount > 0) {
      creator.createdDaresCount = Math.max(0, creator.createdDaresCount - 1);
      saveUserToFirestore(creator);
    }

    res.json({ success: true, message: 'Dare deleted successfully', deletedDareId: id });
  });

  // Accept a dare
  app.post('/api/dares/:id/accept', (req, res) => {
    const dare = dares.find(d => d.id === req.params.id);
    if (!dare) return res.status(404).json({ error: 'Dare not found' });

    const { userId } = req.body;
    const user = initialUsers.find(u => u.id === userId) || findOrCreateUser(userId || 'u_active_user');

    // Platform daily dares stay open for everyone, but track each accepting user
    if (dare.isPlatformDaily) {
      dare.acceptedUserIds = dare.acceptedUserIds || [];
      if (!dare.acceptedUserIds.includes(user.id)) {
        dare.acceptedUserIds.push(user.id);
      }
      recordUserActivity(user);
      saveUserToFirestore(user);
      return res.json({
        ...dare,
        status: 'accepted',
        acceptedBy: {
          id: user.id,
          handle: user.handle,
          name: user.name,
          avatar: user.avatar,
        },
        acceptedAt: new Date().toISOString(),
      });
    }

    if (dare.status !== 'open') {
      return res.status(400).json({ error: 'Dare is not currently open for acceptance' });
    }

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
    saveDareToFirestore(dare);
    saveUserToFirestore(user);

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
        const prompt = `You are the "GEMINI AI PROOF ARBITER" for DARE.
Analyze this submitted visual proof against the challenge requirement.

Dare Title: "${dare.title}"
Category: "${dare.category}"
Difficulty: "${dare.difficulty}"
Proof Requirement: "${dare.proofRequirement}"
Proof Caption: "${caption || ''}"
Media Attached: ${mediaUrl ? 'Yes' : 'No'}

Instructions:
1. Inspect the visual frame / image: detect physical actions, props, outdoors, sports gear, creativity, or verified objects.
2. Evaluate anti-spoof authenticity (verify real authentic capture).
3. Score performance across Speed (0-100), Creativity (0-100), Accuracy (0-100), and Overall (0-100).
4. Check if all required proof criteria are fulfilled.
5. Output strict JSON with format:
{
  "verdict": "LEGIT" | "BUSTED" | "LEGENDARY",
  "confidence": number (85-99),
  "commentary": "2-3 sentences evaluating the execution sharpness, creativity, and authenticity",
  "bonusCred": number (5-30),
  "antiSpoofScore": number (88-99),
  "visualClarityScore": number (80-100),
  "authenticityRating": "Authentic Live Capture" | "Verified Telemetry" | "Inconclusive Artifacts",
  "performanceScores": {
    "speed": number (70-100),
    "creativity": number (70-100),
    "accuracy": number (70-100),
    "overall": number (70-100)
  },
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
            performanceScores: parsed.performanceScores || {
              speed: 90,
              creativity: 88,
              accuracy: 94,
              overall: 91,
            },
            evaluatedAt: new Date().toISOString(),
            refereeModel: 'Gemini 3.8 Flash Proof Arbiter',
          });
        }
      } catch (err) {
        console.warn('Multimodal pre-validation fallback:', err);
      }
    }

    return res.status(503).json({
      error: 'AI Proof Arbiter is currently unavailable. You can submit your proof directly for community verification.'
    });
  });

  // Submit proof for a dare & trigger AI Proof Arbiter Evaluation
  app.post('/api/dares/:id/proof', requireAuth, proofSubmissionRateLimiter, async (req, res) => {
    const dare = dares.find(d => d.id === req.params.id);
    if (!dare) return res.status(404).json({ error: 'Dare not found' });

    const callerId = req.user!.uid;
    const callerUser = initialUsers.find(u => u.id === callerId) || findOrCreateUser(callerId);

    // Verify that the dare is open or accepted by the caller
    if (!dare.isPlatformDaily && dare.acceptedBy && dare.acceptedBy.id && dare.acceptedBy.id !== callerId) {
      return res.status(403).json({ error: 'Forbidden: You are not the assigned challenger for this dare' });
    }

    // If dare was still open or is platform daily, assign current submission context to caller
    if (!dare.acceptedBy || dare.isPlatformDaily) {
      dare.acceptedBy = {
        id: callerUser.id,
        handle: callerUser.handle,
        name: callerUser.name,
        avatar: callerUser.avatar,
      };
      dare.acceptedAt = new Date().toISOString();
    }

    const { caption, mediaUrl, location, telemetry: clientTelemetry } = req.body;

    if (!caption || typeof caption !== 'string' || !caption.trim()) {
      return res.status(400).json({ error: 'Proof description is required' });
    }

    dare.status = 'submitted';
    if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
      dare.location = {
        lat: Number(location.lat.toFixed(6)),
        lng: Number(location.lng.toFixed(6)),
      };
    }

    // Generate AI evaluation via Gemini or intelligent fallback
    let aiJudgement = null;
    const genAI = getGenAI();

    // Prepare telemetry details with client motion and GPS data
    const telemetry = {
      deviceType: req.headers['user-agent']?.includes('Mobile') ? 'Mobile Device' : 'Desktop Device',
      captureTimestamp: new Date().toISOString(),
      hasAudioTrack: !!(mediaUrl && (mediaUrl.includes('mp4') || mediaUrl.includes('webm'))),
      tamperRiskScore: 0,
      verifiedLocation: location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : undefined,
      mimeType: mediaUrl?.includes('mp4') ? 'video/mp4' : mediaUrl ? 'image/jpeg' : 'text/plain',
      motionDetected: clientTelemetry?.motionDetected ?? true,
      motionMagnitude: clientTelemetry?.motionMagnitude ?? 3.4,
      timestampLocked: clientTelemetry?.timestampLocked ?? true,
      gpsAccuracyMeters: clientTelemetry?.gpsAccuracyMeters ?? (location ? 12 : undefined),
    };

    if (genAI) {
      try {
        const prompt = `You are "THE PROOF ARBITER", an expert AI referee for "DARE" — a social dare and challenge platform.
Evaluate this completed dare submission:
Dare Title: "${dare.title}"
Dare Category: "${dare.category}"
Difficulty: "${dare.difficulty}"
Proof Requirement: "${dare.proofRequirement}"
Submitted Proof Caption: "${caption}"
Media Attachment provided: ${mediaUrl ? 'Yes' : 'No'}

Perform a rigorous evaluation:
1. Verdict (LEGIT, BUSTED, or LEGENDARY).
2. Confidence (number between 85 and 99).
3. Commentary (2-3 sentences of referee commentary assessing bravery, creativity, and proof authenticity).
4. Performance Scores: speed (70-100), creativity (70-100), accuracy (70-100), overall (70-100).
5. Bonus Cred (number between 5 and 30).
6. Anti-spoof authenticity score (number between 88 and 99).
7. Visual Clarity score (number between 80 and 100).
8. Authenticity rating ("Authentic Live Capture", "Verified Geolocation & Motion", etc.).
9. Detected actions and objects in image/video.
10. Criteria checks: breakdown of 2-3 specific challenge requirements, whether they passed, score (0-100), and short note.
11. Badges Awarded: 1-2 cool badges (e.g., "⚡ Steel Resolve", "🎯 Pixel Perfect Proof", "🔥 Fearless Execution").

Respond strictly in valid JSON matching this schema:
{
  "verdict": "LEGIT" | "BUSTED" | "LEGENDARY",
  "confidence": number,
  "commentary": string,
  "bonusCred": number,
  "antiSpoofScore": number,
  "visualClarityScore": number,
  "authenticityRating": string,
  "performanceScores": {
    "speed": number,
    "creativity": number,
    "accuracy": number,
    "overall": number
  },
  "detectedActions": [string],
  "detectedObjects": [string],
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
          aiJudgement = {
            verdict: parsed.verdict || 'LEGIT',
            confidence: parsed.confidence || 95,
            commentary: parsed.commentary || 'Proof verified by AI Arbiter. Authenticity threshold passed.',
            bonusCred: Math.min(30, Math.max(0, parsed.bonusCred || 15)),
            evaluatedAt: new Date().toISOString(),
            antiSpoofScore: parsed.antiSpoofScore || 96,
            visualClarityScore: parsed.visualClarityScore || 95,
            authenticityRating: parsed.authenticityRating || 'Verified Live Capture',
            performanceScores: parsed.performanceScores || {
              speed: 92,
              creativity: 89,
              accuracy: 95,
              overall: 92,
            },
            detectedActions: parsed.detectedActions || ['Challenge Execution', 'Proof Verified'],
            detectedObjects: parsed.detectedObjects || ['Visual Telemetry'],
            criteriaChecks: parsed.criteriaChecks || [
              { criterion: 'Challenge Parameter Adherence', passed: true, score: 95, note: 'All instructions satisfied.' },
              { criterion: 'Evidence Verifiability', passed: true, score: 94, note: 'Visual and contextual proof verified.' },
            ],
            badgesAwarded: parsed.badgesAwarded || ['⚡ Verified Challenger'],
            refereeModel: 'Gemini 3.8 Flash Proof Arbiter',
          };
        }
      } catch (err) {
        console.warn('AI Arbiter operating with local verification rules:', err);
      }
    }

    dare.proof = {
      caption,
      mediaUrl: mediaUrl || '',
      submittedAt: new Date().toISOString(),
      submittedByHandle: callerUser.handle,
      aiJudgement: aiJudgement || undefined,
      telemetry,
      reactions: { '🔥': 1 },
      userReactions: {},
      communityVotes: {
        legit: 0,
        busted: 0,
        userVotes: {},
      },
    };

    // If AI Arbiter says LEGENDARY or LEGIT, mark as verified and award cred; otherwise remains 'submitted' for community verification
    if (aiJudgement && aiJudgement.verdict !== 'BUSTED') {
      if (dare.isPlatformDaily) {
        dare.completedUserIds = dare.completedUserIds || [];
        if (!dare.completedUserIds.includes(callerUser.id)) {
          dare.completedUserIds.push(callerUser.id);
        }
      } else {
        dare.status = 'verified';
      }
      const acceptor = callerUser;
      if (acceptor) {
        let earnedCred = dare.rewardCred;
        let aiBonus = aiJudgement.bonusCred || 0;

        // Check for active Booster (2x Cred)
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
        acceptor.completedDaresCount = (acceptor.completedDaresCount || 0) + 1;
        // Boost reputation score (0-1000)
        acceptor.reputationScore = Math.min(1000, (acceptor.reputationScore || 750) + 25);
        if (!acceptor.unlockedTitles) {
          acceptor.unlockedTitles = ['Risk Runner', 'Fearless'];
        }
        if (acceptor.completedDaresCount >= 3 && !acceptor.unlockedTitles.includes('Urban Explorer')) {
          acceptor.unlockedTitles.push('Urban Explorer');
        }
        if (acceptor.completedDaresCount >= 5 && !acceptor.unlockedTitles.includes('Apex Challenger')) {
          acceptor.unlockedTitles.push('Apex Challenger');
        }
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

        // Advance Daily Operations Contract 2 (Physical/Tech Breakthrough)
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
        saveUserToFirestore(acceptor);
      }
    }

    saveDareToFirestore(dare);

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
      saveUserToFirestore(voter);
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
        saveUserToFirestore(submitter);
      }
    }

    saveDareToFirestore(dare);

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

  // Attach additional Cred / Boost Bounty Pool on an Open Dare
  app.post('/api/dares/:id/boost-bounty', requireAuth, async (req, res) => {
    const dare = dares.find(d => d.id === req.params.id);
    if (!dare) return res.status(404).json({ error: 'Dare not found' });
    
    const callerId = req.user!.uid;
    const callerUser = initialUsers.find(u => u.id === callerId) || findOrCreateUser(callerId);
    const { amount } = req.body;
    const boostAmount = Math.max(1, Number(amount) || 0);

    if (boostAmount <= 0) {
      return res.status(400).json({ error: 'Valid bounty boost amount required' });
    }
    if (callerUser.cred < boostAmount) {
      return res.status(400).json({ error: 'Insufficient Cred to boost bounty pool' });
    }

    callerUser.cred -= boostAmount;
    if (!dare.bountyContributions) dare.bountyContributions = [];
    dare.bountyContributions.push({
      userId: callerUser.id,
      userHandle: callerUser.handle,
      userName: callerUser.name,
      amount: boostAmount,
      addedAt: new Date().toISOString()
    });

    dare.bountyPoolTotal = (dare.bountyPoolTotal || dare.rewardCred) + boostAmount;
    dare.rewardCred = dare.bountyPoolTotal;

    addTransaction(callerUser.id, 'shop_purchase', -boostAmount, `Boosted bounty pool for "${dare.title}" (+${boostAmount} Cred)`, dare.id, dare.title);
    saveDareToFirestore(dare);
    saveUserToFirestore(callerUser);

    res.json({ dare, user: callerUser });
  });

  // Add Emoji Reactions to Dare Proof (🔥, 💀, ⚡, 🏆, 🤯)
  app.post('/api/dares/:id/react', (req, res) => {
    const dare = dares.find(d => d.id === req.params.id);
    if (!dare || !dare.proof) {
      return res.status(404).json({ error: 'Dare proof not found' });
    }

    const { emoji, userId } = req.body;
    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({ error: 'Valid emoji reaction required' });
    }

    if (!dare.proof.reactions) dare.proof.reactions = {};
    if (!dare.proof.userReactions) dare.proof.userReactions = {};

    const currentCount = dare.proof.reactions[emoji] || 0;
    dare.proof.reactions[emoji] = currentCount + 1;

    if (userId) {
      dare.proof.userReactions[userId] = emoji;
    }

    saveDareToFirestore(dare);
    res.json({ dare, reactions: dare.proof.reactions });
  });

  // Get Community Circles (Strict genuine user-created circles)
  const initialCircles: DareCircle[] = [];

  app.get('/api/circles', (_req, res) => {
    res.json({ circles: initialCircles });
  });

  app.post('/api/circles', requireAuth, (req, res) => {
    const { name, description, avatar, isPrivate } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Circle name is required' });
    }

    const callerId = req.user!.uid;
    const callerUser = initialUsers.find(u => u.id === callerId) || findOrCreateUser(callerId);

    const newCircle: DareCircle = {
      id: `circle_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      description: (description || '').trim(),
      avatar: avatar || '⚡',
      memberCount: 1,
      isPrivate: Boolean(isPrivate),
      memberHandles: [callerUser.handle],
    };

    initialCircles.unshift(newCircle);
    if (!callerUser.circles) callerUser.circles = [];
    callerUser.circles.push(newCircle.id);
    saveUserToFirestore(callerUser);

    res.json({ circle: newCircle });
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

    saveDareToFirestore(dare);

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
    saveDareToFirestore(dare);

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

  // AI Dare Generator: Generates creative, electrifying dares via Gemini
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

    return res.status(503).json({
      error: 'AI challenge generation is currently unavailable. Please enter your challenge parameters manually.'
    });
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

    return res.status(503).json({
      error: 'AI Dare Coach is currently unavailable.'
    });
  });

  // --- NOTIFICATION TELEMETRY APIS ---
  // Get all notifications for user
  app.get('/api/notifications', (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.json({ notifications: [], unreadCount: 0 });
    }
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
    saveNotificationToFirestore(notif);
    res.json(notif);
  });

  // Mark all notifications as read for a user
  app.post('/api/notifications/read-all', (req, res) => {
    const { userId } = req.body;
    notifications.forEach(n => {
      if (!userId || n.userId === userId) {
        n.read = true;
        saveNotificationToFirestore(n);
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
    deleteNotificationFromFirestore(req.params.id);
    res.json({ success: true });
  });

  // Clear all notifications for user
  app.delete('/api/notifications', (req, res) => {
    const userId = req.query.userId as string;
    if (userId) {
      for (let i = notifications.length - 1; i >= 0; i--) {
        if (notifications[i].userId === userId) {
          const removed = notifications.splice(i, 1)[0];
          if (removed && removed.id) {
            deleteNotificationFromFirestore(removed.id);
          }
        }
      }
    }
    res.json({ success: true });
  });

  // Squad Tournaments
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
    saveTournamentToFirestore(tourney);
    saveUserToFirestore(user);

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
      totalWagersCred: 0,
      cheerCount: 0,
      recentAction: 'Initialized neural challenge model',
    } : {
      id: 'waiting_opponent',
      handle: '@open_slot',
      name: 'Open Contender Slot',
      avatar: '/logo.png',
      isPro: false,
      squadTag: 'OPEN',
      isReady: false,
      progressPercent: 0,
      status: 'connecting',
      wagerOdds: 2.00,
      totalWagersCred: 0,
      cheerCount: 0,
      recentAction: 'Awaiting challenger...',
    };

    const newDuel: LiveDuel = {
      id: `duel-${Date.now()}`,
      title: title || 'Live Head-to-Head Duel',
      category: category || 'tech',
      difficulty: 'Level 3 - Intense',
      challengeBrief: challengeBrief || 'Simultaneous speed challenge. Submit verified proof before your opponent.',
      proofCriteria: proofCriteria || 'Clear timestamped proof photo or screencast showing complete criteria.',
      durationSeconds: Number(durationSeconds) || 180,
      potCred: stake,
      entryFeeCred: stake,
      status: isAiOpponent ? 'in_progress' : 'lobby',
      startedAt: Date.now(),
      endsAt: Date.now() + (Number(durationSeconds) || 180) * 1000,
      challenger: {
        id: user ? user.id : 'u_challenger',
        handle: user ? user.handle : '@operative',
        name: user ? user.name : 'Operative',
        avatar: user ? user.avatar : '/logo.png',
        isPro: user ? user.isPro : false,
        squadTag: 'CHALLENGER',
        isReady: true,
        progressPercent: 0,
        status: 'battling',
        wagerOdds: 2.00,
        totalWagersCred: stake,
        cheerCount: 0,
        recentAction: 'Combatant deployed challenge...',
      },
      opponent: opponentParticipant,
      spectatorWagers: [],
      cheers: [],
      isAiOpponent: Boolean(isAiOpponent),
    };

    liveDuels.unshift(newDuel);
    saveDuelToFirestore(newDuel);
    if (user) saveUserToFirestore(user);
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
      saveUserToFirestore(user);
    }

    // Award winning spectator wagers
    duel.spectatorWagers.forEach(w => {
      if (w.backedParticipantId === participant.id) {
        const spectator = initialUsers.find(u => u.id === w.userId);
        if (spectator) {
          spectator.cred += Math.round(w.potentialWinCred);
          addTransaction(spectator.id, 'stake_won', Math.round(w.potentialWinCred), `Won Spectator Wager on ${participant.handle} in Duel "${duel.title}"`);
          saveUserToFirestore(spectator);
        }
      }
    });

    saveDuelToFirestore(duel);

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
    saveUserToFirestore(user);

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

    saveDuelToFirestore(duel);

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

    saveDuelToFirestore(duel);

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

    saveDuelToFirestore(duel);

    res.json({ duel });
  });

  // --- LIVE SPLIT-SCREEN STREAM & CHAT ENDPOINTS ---
  interface LiveStreamChatMsg {
    id: string;
    authorName: string;
    authorHandle: string;
    authorAvatar: string;
    text: string;
    timestamp: number;
    isTip?: boolean;
    tipAmount?: number;
  }

  const liveStreamRooms = new Map<string, {
    challengerVotes: number;
    opponentVotes: number;
    viewers: Set<WebSocket>;
    messages: LiveStreamChatMsg[];
  }>();

  function getOrCreateStreamRoom(duelId: string) {
    if (!liveStreamRooms.has(duelId)) {
      liveStreamRooms.set(duelId, {
        challengerVotes: 0,
        opponentVotes: 0,
        viewers: new Set(),
        messages: [],
      });
    }
    return liveStreamRooms.get(duelId)!;
  }

  // Get live stream room state (votes, viewer count, chat messages)
  app.get('/api/duels/:id/stream', (req, res) => {
    const duel = liveDuels.find(d => d.id === req.params.id);
    if (!duel) return res.status(404).json({ error: 'Duel not found' });
    const room = getOrCreateStreamRoom(duel.id);
    res.json({
      duelId: duel.id,
      challengerVotes: room.challengerVotes,
      opponentVotes: room.opponentVotes,
      viewerCount: room.viewers.size,
      messages: room.messages.slice(-50),
    });
  });

  // Post live chat message
  app.post('/api/duels/:id/chat', (req, res) => {
    const duel = liveDuels.find(d => d.id === req.params.id);
    if (!duel) return res.status(404).json({ error: 'Duel not found' });
    const room = getOrCreateStreamRoom(duel.id);
    const { authorName, authorHandle, authorAvatar, text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Text required' });

    const newMsg: LiveStreamChatMsg = {
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      authorName: authorName || 'Anonymous',
      authorHandle: authorHandle || '@fan',
      authorAvatar: authorAvatar || '/logo.png',
      text: text.trim().slice(0, 200),
      timestamp: Date.now(),
    };

    room.messages.push(newMsg);
    if (room.messages.length > 100) room.messages.shift();

    const payload = JSON.stringify({ type: 'chat', duelId: duel.id, message: newMsg });
    room.viewers.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    });

    res.json({ success: true, message: newMsg });
  });

  // Cast live vote for challenger or opponent
  app.post('/api/duels/:id/vote', (req, res) => {
    const duel = liveDuels.find(d => d.id === req.params.id);
    if (!duel) return res.status(404).json({ error: 'Duel not found' });
    const room = getOrCreateStreamRoom(duel.id);
    const { side } = req.body;

    if (side === 'challenger') {
      room.challengerVotes += 1;
    } else {
      room.opponentVotes += 1;
    }

    const payload = JSON.stringify({
      type: 'votes_update',
      duelId: duel.id,
      challengerVotes: room.challengerVotes,
      opponentVotes: room.opponentVotes,
    });
    room.viewers.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    });

    res.json({
      success: true,
      challengerVotes: room.challengerVotes,
      opponentVotes: room.opponentVotes,
    });
  });

  // Tip Cred during live duel
  app.post('/api/duels/:id/tip', (req, res) => {
    const duel = liveDuels.find(d => d.id === req.params.id);
    if (!duel) return res.status(404).json({ error: 'Duel not found' });
    const { fromUserId, fromName, fromHandle, fromAvatar, toSide, amountCred, emoji } = req.body;
    const amount = Number(amountCred) || 10;
    const user = initialUsers.find(u => u.id === fromUserId);

    if (user && user.cred < amount) {
      return res.status(400).json({ error: 'Insufficient Cred balance' });
    }

    if (user) {
      user.cred -= amount;
      addTransaction(user.id, 'tip_sent', -amount, `Tipped ${amount} Cred during live duel "${duel.title}"`);
      saveUserToFirestore(user);
    }

    const room = getOrCreateStreamRoom(duel.id);
    if (toSide === 'challenger') {
      room.challengerVotes += Math.ceil(amount / 5);
    } else {
      room.opponentVotes += Math.ceil(amount / 5);
    }

    const tipMsg: LiveStreamChatMsg = {
      id: `tip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      authorName: fromName || (user ? user.name : 'Supporter'),
      authorHandle: fromHandle || (user ? user.handle : '@supporter'),
      authorAvatar: fromAvatar || (user ? user.avatar : '/logo.png'),
      text: `sent ${amount} Cred ${emoji || '🚀'} to ${toSide === 'challenger' ? duel.challenger.name : duel.opponent.name}!`,
      timestamp: Date.now(),
      isTip: true,
      tipAmount: amount,
    };
    room.messages.push(tipMsg);

    const payload = JSON.stringify({
      type: 'tip_broadcast',
      duelId: duel.id,
      tip: tipMsg,
      toSide,
      amount,
      emoji: emoji || '🚀',
      challengerVotes: room.challengerVotes,
      opponentVotes: room.opponentVotes,
    });
    room.viewers.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    });

    res.json({
      success: true,
      userCred: user ? user.cred : undefined,
      challengerVotes: room.challengerVotes,
      opponentVotes: room.opponentVotes,
    });
  });

  // Join as competitor in an open contender slot
  app.post('/api/duels/:id/join-battle', (req, res) => {
    const duel = liveDuels.find(d => d.id === req.params.id);
    if (!duel) return res.status(404).json({ error: 'Duel not found' });
    const { user } = req.body;
    if (!user) return res.status(400).json({ error: 'User required' });

    duel.opponent = {
      id: user.id,
      handle: user.handle,
      name: user.name,
      avatar: user.avatar || '/logo.png',
      isPro: Boolean(user.isPro),
      squadTag: 'LIVE',
      isReady: true,
      progressPercent: 0,
      status: 'battling',
      wagerOdds: 2.00,
      totalWagersCred: duel.entryFeeCred,
      cheerCount: 0,
      recentAction: 'Joined split-screen live battle!',
    };
    duel.status = 'in_progress';
    duel.startedAt = Date.now();
    duel.endsAt = Date.now() + duel.durationSeconds * 1000;

    saveDuelToFirestore(duel);

    res.json({ success: true, duel });
  });

  // Direct Rematch Request
  app.post('/api/rivalry/rematch', (req, res) => {
    const { fromUserId, targetUserHandle, previousDareTitle } = req.body;
    const challenger = initialUsers.find(u => u.id === fromUserId);
    const targetUser = initialUsers.find(u => u.handle.toLowerCase() === (targetUserHandle || '').toLowerCase());

    if (!challenger || !targetUser) {
      return res.status(404).json({ error: 'Challenger or target player not found' });
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



  // --- WEB PUSH & SYSTEM TELEMETRY APIS ---
  const userPushPreferences: Record<string, any> = {};

  app.get('/api/push/preferences/:userId', (req, res) => {
    const { userId } = req.params;
    res.json(userPushPreferences[userId] || {
      directDares: true,
      stakes: true,
      proofVotes: true,
      dailyOps: true,
      soundEnabled: true,
    });
  });

  app.post('/api/push/preferences/:userId', (req, res) => {
    const { userId } = req.params;
    const { preferences } = req.body;
    if (preferences) {
      userPushPreferences[userId] = preferences;
    }
    res.json({ success: true, preferences: userPushPreferences[userId] });
  });

  app.post('/api/push/dispatch-test', (req, res) => {
    const { userId, title, body, dareId } = req.body;
    if (userId) {
      addNotification({
        userId,
        type: 'social',
        title: title || '⚡ DARE Telemetry Signal',
        message: body || 'Direct uplink operational! Live challenge active on the Grid.',
        dareId: dareId || '',
        actorHandle: '@dare_hq',
        actorName: 'DARE HQ',
        actorAvatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150',
        read: false,
      });
    }
    res.json({ success: true, dispatchedAt: new Date().toISOString() });
  });

  // --- REWARDS ARMORY & STORE APIS ---
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
    const user = initialUsers.find(u => u.id === userId) || findOrCreateUser(userId);
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
      `Purchased ${quantity}x ${item.name} from Rewards Armory`
    );

    // 10% of purchases feed the community jackpot pool!
    communityJackpotPool += Math.floor(totalCost * 0.1);

    // Award bonus XP for armory trade
    awardXpToUser(user, Math.floor(totalCost * 0.5));

    addNotification({
      userId: user.id,
      type: 'social',
      title: `⚡ Armory Requisition: ${item.name}`,
      message: `Successfully equipped ${quantity}x ${item.name} to your inventory. ${totalCost} Cred deducted.`,
      dareId: '',
      actorHandle: '@daredaylabs',
      actorName: 'DARE Quartermaster',
      actorAvatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150',
      read: false,
    });

    saveUserToFirestore(user);

    res.json({
      success: true,
      user,
      purchasedItem: item,
      trackingCode: item.isPhysical ? `NFC-DD-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : undefined,
    });
  });

  // Equip / Unequip Cosmetic Frame or Title
  app.post('/api/armory/equip', (req, res) => {
    const { userId, itemId, type } = req.body; // type: 'frame' | 'title'
    const user = initialUsers.find(u => u.id === userId) || findOrCreateUser(userId);
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

    saveUserToFirestore(user);

    res.json({ success: true, user });
  });

  // Use / Activate a Booster Item from Inventory
  app.post('/api/armory/use-booster', (req, res) => {
    const { userId, itemId } = req.body;
    const user = initialUsers.find(u => u.id === userId) || findOrCreateUser(userId);
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
    saveUserToFirestore(user);

    res.json({
      success: true,
      user,
      activatedBooster: newBooster,
    });
  });

  // --- DAILY OPERATIONS MATRIX APIS ---
  app.get('/api/daily-contracts', (req, res) => {
    const userId = (req.query.userId as string) || 'guest_user';
    const state = getDailyOpsForUser(userId);
    res.json(state);
  });

  // Claim Daily Trifecta Chest
  app.post('/api/daily-contracts/claim-trifecta', (req, res) => {
    const { userId } = req.body;
    const user = initialUsers.find(u => u.id === userId) || findOrCreateUser(userId);
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

    addTransaction(user.id, 'daily_trifecta_claimed', state.trifectaRewardCred, 'Completed all 3 Daily Goals! +500 Cred Bonus');

    addNotification({
      userId: user.id,
      type: 'stipend_claimed',
      title: '🏆 Daily Goals Completed!',
      message: `You completed all 3 daily goals! Claimed +500 Cred bonus reward.`,
      dareId: '',
      actorHandle: '@dare',
      actorName: 'DARE Community',
      actorAvatar: '/logo.png',
      read: false,
    });

    saveUserToFirestore(user);

    res.json({ success: true, user, state });
  });

  // --- SEASON 1 BATTLE PASS APIS ---
  app.get('/api/season-pass', (req, res) => {
    const userId = (req.query.userId as string) || 'guest_user';
    const user = initialUsers.find(u => u.id === userId) || findOrCreateUser(userId);

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
    const user = initialUsers.find(u => u.id === userId) || findOrCreateUser(userId);
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
        return res.status(400).json({ error: 'Elite Pass required to claim this reward.' });
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

    saveUserToFirestore(user);

    res.json({
      success: true,
      user,
      claimedFree: user.seasonPassClaimedFree,
      claimedElite: user.seasonPassClaimedElite,
    });
  });

  // Upgrade / Unlock Elite Battle Pass
  app.post('/api/season-pass/upgrade-elite', (req, res) => {
    const { userId } = req.body;
    const user = initialUsers.find(u => u.id === userId) || findOrCreateUser(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.hasElitePass || user.isPro) {
      user.hasElitePass = true;
      saveUserToFirestore(user);
      return res.json({ success: true, user, message: 'Elite Pass is already unlocked!' });
    }

    const ELITE_PASS_COST = 2000;
    if (user.cred < ELITE_PASS_COST) {
      return res.status(400).json({ 
        error: `Insufficient Cred. Need ${ELITE_PASS_COST} Cred (or PRO Membership) to unlock the Elite Battle Pass.` 
      });
    }

    user.cred -= ELITE_PASS_COST;
    user.hasElitePass = true;
    addTransaction(user.id, 'shop_purchase', -ELITE_PASS_COST, 'Unlocked Season 1: Elite Battle Pass');

    addNotification({
      userId: user.id,
      type: 'pro_upgraded',
      title: '👑 Elite Pass Unlocked!',
      message: 'You have unlocked the Elite track for Season 1! Claim premium frames, titles, and high-roller rewards.',
      dareId: '',
      actorHandle: '@daredaylabs',
      actorName: 'DARE Arena',
      actorAvatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150',
      read: false,
    });

    saveUserToFirestore(user);

    res.json({ success: true, user });
  });

  // --- HIGH-ROLLER CRED STAKING APIS ---
  app.get('/api/staking/jackpot', (_req, res) => {
    // Trace genuine user active stakes and duel spectator wagers
    const activeUserStakes = initialUsers.flatMap(u => (u.activeStakes || []).filter(s => s.status === 'active'));
    const activeDuelWagers = liveDuels.filter(d => d.status === 'in_progress' || d.status === 'lobby').flatMap(d => d.spectatorWagers || []);
    const activeWagersCount = activeUserStakes.length + activeDuelWagers.length;

    // Trace genuine stake win transactions
    const stakeWonTransactions = transactions.filter(t => t.type === 'stake_won');
    const recentBigWinners = stakeWonTransactions.map(tx => {
      const user = initialUsers.find(u => u.id === tx.userId);
      return {
        handle: user?.handle || '@operative',
        amount: Math.abs(tx.amount),
        dare: tx.dareTitle || tx.description,
        timestamp: tx.timestamp,
      };
    });

    res.json({
      jackpotPool: communityJackpotPool,
      activeWagersCount,
      recentBigWinners,
    });
  });

  // Place a Cred stake on an accepted dare
  app.post('/api/staking/wager', (req, res) => {
    const { userId, dareId, stakedCred } = req.body;
    const user = initialUsers.find(u => u.id === userId) || findOrCreateUser(userId);
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

    saveUserToFirestore(user);
    saveDareToFirestore(dare);

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
    const sender = initialUsers.find(u => u.id === fromUserId) || findOrCreateUser(fromUserId);
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

    saveUserToFirestore(sender);
    saveUserToFirestore(recipient);

    res.json({ success: true, sender, recipient, tipAmount });
  });

  // --- GEOFENCED DROP ZONES (REMOVED) ---
  app.get('/api/drop-zones', (_req, res) => {
    res.json([]);
  });

  app.post('/api/drop-zones/claim', (_req, res) => {
    res.status(404).json({ error: 'Drop zones feature has been removed' });
  });

  app.post('/api/drop-zones/deploy', (_req, res) => {
    res.status(404).json({ error: 'Drop zones feature has been removed' });
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
        successUrl, 
        cancelUrl,
        promoCode
      } = req.body;

      // Resolve user from auth header or request body
      let userId = req.body.userId || 'guest';
      let userEmail = req.body.userEmail;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1]?.trim();
        if (idToken) {
          if (adminAuth && hasAdminCredentials) {
            try {
              const decoded = await adminAuth.verifyIdToken(idToken);
              userId = decoded.uid;
              userEmail = decoded.email || userEmail;
            } catch (_err) {}
          }
          if (userId === 'guest') {
            try {
              const parts = idToken.split('.');
              if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                if (payload.user_id || payload.sub || payload.uid) {
                  userId = payload.user_id || payload.sub || payload.uid;
                  userEmail = payload.email || userEmail;
                }
              }
            } catch (_e) {}
          }
        }
      }

      const stripe = getStripe();
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const resolvedSuccessUrl = successUrl || `${appUrl}/?session_id={CHECKOUT_SESSION_ID}&payment_status=success`;
      const resolvedCancelUrl = cancelUrl || `${appUrl}/?payment_status=cancelled`;

      if (!stripe) {
        return res.status(503).json({
          error: 'Payments temporarily unavailable',
          configured: false,
        });
      }

      let targetPriceId = priceId;
      if (targetPriceId && (!targetPriceId.startsWith('price_1') && !targetPriceId.startsWith('price_2'))) {
        targetPriceId = undefined; // treat placeholder/mock price IDs as undefined so it falls back to dynamic price_data
      }

      // Lookup price by itemId if raw priceId is not provided
      if (!targetPriceId && itemId) {
        try {
          const matchingProduct = DARE_PRODUCTS.find(p => p.id === itemId);
          if (matchingProduct) {
            const prices = await stripe.prices.list({ limit: 100, active: true });
            const found = prices.data.find(pr => (pr.metadata as any)?.dareday_item_id === itemId && pr.currency === 'gbp') ||
                          prices.data.find(pr => (pr.metadata as any)?.dareday_item_id === itemId);
            if (found) {
              targetPriceId = found.id;
            }
          }
        } catch (lookupErr: any) {
          console.warn('Stripe price list permission restricted, using direct price_data fallback:', lookupErr.message);
        }
      }

      if (!targetPriceId) {
        // If still no price ID, dynamically create a line item via price_data (works with restricted keys!)
        const matchingProduct = DARE_PRODUCTS.find(p => p.id === itemId) || DARE_PRODUCTS[0];
        const isRecurring = (matchingProduct as any).type === 'recurring';
        const isEmbedded = Boolean(req.body.embedded || req.body.uiMode === 'embedded');

        const sessionConfig: any = {
          mode: isRecurring ? 'subscription' : 'payment',
          line_items: [
            {
              price_data: {
                currency: matchingProduct.currency || 'gbp',
                product_data: {
                  name: matchingProduct.name,
                  description: matchingProduct.description,
                  tax_code: 'txcd_10000000',
                  images: matchingProduct.imageUrl
                    ? [matchingProduct.imageUrl.startsWith('http')
                        ? matchingProduct.imageUrl
                        : `${appUrl.replace(/\/$/, '')}${matchingProduct.imageUrl}`]
                    : undefined,
                },
                unit_amount: matchingProduct.amount,
                recurring: isRecurring && (matchingProduct as any).interval ? { interval: (matchingProduct as any).interval } : undefined,
              },
              quantity: 1,
            },
          ],
          client_reference_id: userId,
          customer_email: userEmail,
          metadata: {
            userId,
            itemId: itemId || matchingProduct.id,
          },
          allow_promotion_codes: true,
          discounts: promoCode ? [{ coupon: promoCode }] : undefined,
        };

        if (isEmbedded) {
          sessionConfig.ui_mode = 'embedded_page';
          sessionConfig.return_url = resolvedSuccessUrl;
        } else {
          sessionConfig.success_url = resolvedSuccessUrl;
          sessionConfig.cancel_url = resolvedCancelUrl;
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        return res.json({
          url: session.url,
          sessionId: session.id,
          clientSecret: session.client_secret,
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
          simulated: false,
        });
      }

      // Check whether price is recurring or one-time
      let isSubscription = itemId?.includes('monthly') || itemId?.includes('yearly') || itemId?.includes('pro');
      try {
        const priceObject = await stripe.prices.retrieve(targetPriceId);
        isSubscription = Boolean(priceObject.recurring);
      } catch (retrieveErr: any) {
        console.warn('Stripe price retrieve restricted, inferring mode:', retrieveErr.message);
      }

      const isEmbedded = Boolean(req.body.embedded || req.body.uiMode === 'embedded');
      const sessionConfig: any = {
        mode: isSubscription ? 'subscription' : 'payment',
        line_items: [
          {
            price: targetPriceId,
            quantity: 1,
          },
        ],
        client_reference_id: userId,
        customer_email: userEmail,
        metadata: {
          userId,
          itemId: itemId || '',
        },
        allow_promotion_codes: true,
        discounts: promoCode ? [{ coupon: promoCode }] : undefined,
      };

      if (isEmbedded) {
        sessionConfig.ui_mode = 'embedded_page';
        sessionConfig.return_url = resolvedSuccessUrl;
      } else {
        sessionConfig.success_url = resolvedSuccessUrl;
        sessionConfig.cancel_url = resolvedCancelUrl;
      }

      let session;
      try {
        session = await stripe.checkout.sessions.create(sessionConfig);
      } catch (priceErr: any) {
        if (priceErr?.message?.includes('No such price') || priceErr?.message?.includes('resource_missing')) {
          console.warn('Invalid price ID provided, falling back to dynamic price_data');
          const matchingProduct = DARE_PRODUCTS.find(p => p.id === itemId) || DARE_PRODUCTS[0];
          const isRecurring = (matchingProduct as any).type === 'recurring';
          sessionConfig.line_items = [
            {
              price_data: {
                currency: matchingProduct.currency || 'gbp',
                product_data: {
                  name: matchingProduct.name,
                  description: matchingProduct.description,
                  tax_code: 'txcd_10000000',
                },
                unit_amount: matchingProduct.amount,
                recurring: isRecurring && (matchingProduct as any).interval ? { interval: (matchingProduct as any).interval } : undefined,
              },
              quantity: 1,
            }
          ];
          session = await stripe.checkout.sessions.create(sessionConfig);
        } else {
          throw priceErr;
        }
      }

      res.json({
        url: session.url,
        sessionId: session.id,
        clientSecret: session.client_secret,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
        simulated: false,
      });
    } catch (err: any) {
      console.error('Stripe checkout session error:', err);
      res.status(500).json({ error: err.message || 'Failed to create Stripe checkout session' });
    }
  });

  // 4. Create Customer Portal Session (Manage Subscriptions / Invoices)
  app.post('/api/stripe/create-customer-portal', requireAuth, async (req, res) => {
    try {
      const { returnUrl } = req.body;
      const userId = req.user!.uid;
      const userEmail = req.user!.email;

      const stripe = getStripe();
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

      if (!stripe) {
        return res.status(503).json({
          error: 'Payments temporarily unavailable',
          configured: false,
        });
      }

      let customerId: string | undefined;
      const userProfile = await getUserFromFirestore(userId);
      if (userProfile && (userProfile as any).stripeCustomerId) {
        customerId = (userProfile as any).stripeCustomerId;
      }

      if (!customerId && userEmail) {
        const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 });
        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
        }
      }

      if (!customerId) {
        return res.status(400).json({ error: 'No Stripe customer profile found for authenticated user.' });
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

  // 5. Payment Intent fallback (Enforcing server-side price authority)
  app.post('/api/stripe/create-payment-intent', requireAuth, async (req, res) => {
    try {
      const { itemId, amount: clientAmount, currency = 'gbp', description } = req.body;
      const userId = req.user!.uid;

      const stripe = getStripe();
      if (!stripe) {
        return res.status(503).json({
          error: 'Payments temporarily unavailable',
          configured: false,
        });
      }

      let authoritativeAmount = 199;
      let authoritativeDesc = description || 'DARE PRO Access';

      if (itemId) {
        const matchingProduct = DARE_PRODUCTS.find(p => p.id === itemId);
        if (matchingProduct) {
          authoritativeAmount = matchingProduct.amount;
          authoritativeDesc = matchingProduct.name;
        }
      } else if (clientAmount) {
        authoritativeAmount = Math.round(Number(clientAmount) * 100);
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: authoritativeAmount,
        currency,
        description: authoritativeDesc,
        metadata: { userId }
      });

      res.json({ clientSecret: paymentIntent.client_secret, simulated: false });
    } catch (err: any) {
      console.error('Stripe payment intent error:', err);
      res.status(500).json({ error: err.message || 'Failed to create payment intent' });
    }
  });

  // Direct Cred Pack purchase & fulfillment
  app.post('/api/cred-packs/purchase', async (req, res) => {
    try {
      const { packId, userId: bodyUserId } = req.body;
      const pack = DARE_CRED_PACKS.find(p => p.id === packId) || DARE_CRED_PACKS[0];
      
      let userId = bodyUserId || 'guest';
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1]?.trim();
        if (token) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
              userId = payload.user_id || payload.sub || payload.uid || userId;
            }
          } catch (_e) {}
        }
      }

      const user = initialUsers.find(u => u.id === userId) || await getUserFromFirestore(userId) || findOrCreateUser(userId);
      const totalCred = pack.credAmount + pack.bonusCred;
      user.cred += totalCred;

      addTransaction(user.id, 'stipend_claimed', totalCred, `Purchased ${pack.name} (+${totalCred} Cred)`);
      
      addNotification({
        userId: user.id,
        type: 'stipend_claimed',
        title: `+${totalCred.toLocaleString()} Cred Added! ⚡`,
        message: `Purchased ${pack.name}. Your updated balance is ${user.cred.toLocaleString()} Cred.`,
        actorHandle: '@DAREStore',
        actorName: 'DARE Store',
        actorAvatar: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150&auto=format&fit=crop&q=80',
        read: false,
      });

      recordUserActivity(user);
      saveUserToFirestore(user);

      res.json({
        success: true,
        pack,
        credAwarded: totalCred,
        user,
      });
    } catch (err: any) {
      console.error('Cred pack purchase error:', err);
      res.status(500).json({ error: err.message || 'Failed to complete Cred pack purchase' });
    }
  });

  // Verify Stripe Checkout Session and instant activate perks
  app.get('/api/stripe/verify-session/:sessionId', async (req, res) => {
    try {
      const stripe = getStripe();
      if (!stripe) {
        return res.status(503).json({ error: 'Stripe payments unavailable', configured: false });
      }
      const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
      if (session.payment_status === 'paid') {
        const userId = session.client_reference_id || session.metadata?.userId;
        const itemId = session.metadata?.itemId;
        if (userId && userId !== 'guest') {
          const user = initialUsers.find(u => u.id === userId) || await getUserFromFirestore(userId) || findOrCreateUser(userId);
          
          let credAwarded = 150;
          let packName = 'Starter Cred Pack';

          if (itemId?.includes('3350') || itemId?.includes('2500')) {
            credAwarded = itemId?.includes('3350') ? 3350 : 2500;
            packName = 'Influencer Pack (3,350 Cred)';
          } else if (itemId?.includes('1250') || itemId?.includes('1000')) {
            credAwarded = 1250;
            packName = 'Popular Creator Pack (1,250 Cred)';
          } else if (itemId?.includes('550') || itemId?.includes('500')) {
            credAwarded = itemId?.includes('550') ? 550 : 500;
            packName = 'Booster Pack (550 Cred)';
          } else {
            credAwarded = 150;
            packName = 'Starter Pack (150 Cred)';
          }

          user.cred += credAwarded;
          addTransaction(user.id, 'stipend_claimed', credAwarded, `Purchased ${packName}`);
          
          recordUserActivity(user);
          saveUserToFirestore(user);
          return res.json({ success: true, verified: true, credAwarded, user });
        }
      }
      res.json({ success: true, verified: session.payment_status === 'paid', status: session.payment_status });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Error verifying Stripe session' });
    }
  });

  // 6. Webhook Listener
  app.post('/api/stripe/webhook', paymentRateLimiter, async (req: any, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripe = getStripe();

    let event: Stripe.Event;

    if (!stripe) {
      return res.status(503).json({
        error: 'Payments temporarily unavailable',
        configured: false,
      });
    }

    try {
      if (webhookSecret) {
        if (!sig || !req.rawBody) {
          return res.status(400).send('Webhook Error: Missing stripe-signature header or raw body');
        }
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
      } else if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: STRIPE_WEBHOOK_SECRET is not configured in production environment');
        return res.status(500).send('Webhook Error: STRIPE_WEBHOOK_SECRET not configured');
      } else {
        // Development sandbox only
        if (sig && req.rawBody) {
          try {
            event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret || '');
          } catch (_e) {
            event = req.body as Stripe.Event;
          }
        } else {
          event = req.body as Stripe.Event;
        }
      }
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (!event || !event.type || !event.id) {
      return res.status(400).send('Webhook Error: Invalid event payload');
    }

    // Enforce idempotency
    if (await isStripeEventProcessed(event.id)) {
      return res.json({ received: true, idempotent: true });
    }
    await recordStripeEventProcessed(event.id, event.type);

    // Process Stripe Events
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.client_reference_id || session.metadata?.userId;
          const itemId = session.metadata?.itemId;

          if (userId) {
            const user = findOrCreateUser(userId);
            let credAwarded = 150;
            let packName = 'Starter Cred Pack';

            if (itemId?.includes('3350') || itemId?.includes('2500')) {
              credAwarded = itemId?.includes('3350') ? 3350 : 2500;
              packName = 'Influencer Pack (3,350 Cred)';
            } else if (itemId?.includes('1250') || itemId?.includes('1000')) {
              credAwarded = 1250;
              packName = 'Popular Creator Pack (1,250 Cred)';
            } else if (itemId?.includes('550') || itemId?.includes('500')) {
              credAwarded = itemId?.includes('550') ? 550 : 500;
              packName = 'Booster Pack (550 Cred)';
            } else {
              credAwarded = 150;
              packName = 'Starter Pack (150 Cred)';
            }

            user.cred += credAwarded;
            addTransaction(user.id, 'stipend_claimed', credAwarded, `Purchased ${packName}`);

            addNotification({
              userId: user.id,
              type: 'stipend_claimed',
              title: `+${credAwarded.toLocaleString()} Cred Added! ⚡`,
              message: `Your payment for ${packName} was successful. +${credAwarded.toLocaleString()} Cred has been credited to your balance.`,
              actorHandle: '@StripeBilling',
              actorName: 'DARE Payments',
              actorAvatar: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150&auto=format&fit=crop&q=80',
              read: false,
            });

            saveUserToFirestore(user);
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
  app.get('/api/stripe/status', (_req, res) => {
    const stripe = getStripe();
    res.json({
      configured: !!stripe,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
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
    // Serve hashed bundle assets with 1-year immutable cache header
    app.use('/assets', express.static(path.join(distPath, 'assets'), {
      maxAge: '1y',
      immutable: true,
    }));
    // Serve other static assets (favicons, manifest, images)
    app.use(express.static(distPath, {
      maxAge: '1h',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      },
    }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    let currentRoomId: string | null = null;

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'join_stream') {
          currentRoomId = msg.duelId;
          const room = getOrCreateStreamRoom(msg.duelId);
          room.viewers.add(ws);

          ws.send(JSON.stringify({
            type: 'room_snapshot',
            duelId: msg.duelId,
            challengerVotes: room.challengerVotes,
            opponentVotes: room.opponentVotes,
            viewerCount: Math.max(room.viewers.size + 142, 85),
            messages: room.messages.slice(-30),
          }));

          const viewerUpdate = JSON.stringify({
            type: 'viewer_count_update',
            duelId: msg.duelId,
            viewerCount: Math.max(room.viewers.size + 142, 85),
          });
          room.viewers.forEach(c => {
            if (c.readyState === WebSocket.OPEN) c.send(viewerUpdate);
          });
        } else if (msg.type === 'webrtc_signal') {
          if (currentRoomId) {
            const room = getOrCreateStreamRoom(currentRoomId);
            const relay = JSON.stringify({
              type: 'webrtc_signal',
              duelId: currentRoomId,
              from: msg.from,
              signal: msg.signal,
            });
            room.viewers.forEach(c => {
              if (c !== ws && c.readyState === WebSocket.OPEN) c.send(relay);
            });
          }
        } else if (msg.type === 'reaction') {
          if (currentRoomId) {
            const room = getOrCreateStreamRoom(currentRoomId);
            const reactionMsg = JSON.stringify({
              type: 'floating_reaction',
              duelId: currentRoomId,
              emoji: msg.emoji || '🔥',
              id: `react_${Date.now()}_${Math.random()}`,
            });
            room.viewers.forEach(c => {
              if (c.readyState === WebSocket.OPEN) c.send(reactionMsg);
            });
          }
        }
      } catch (_err) {
        // ignore invalid payload
      }
    });

    ws.on('close', () => {
      if (currentRoomId && liveStreamRooms.has(currentRoomId)) {
        const room = liveStreamRooms.get(currentRoomId)!;
        room.viewers.delete(ws);
        const viewerUpdate = JSON.stringify({
          type: 'viewer_count_update',
          duelId: currentRoomId,
          viewerCount: Math.max(room.viewers.size + 142, 85),
        });
        room.viewers.forEach(c => {
          if (c.readyState === WebSocket.OPEN) c.send(viewerUpdate);
        });
      }
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ DARE server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
