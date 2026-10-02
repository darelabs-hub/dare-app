export type DareCategory = 'digital' | 'physical' | 'social' | 'creative' | 'tech' | 'absurd';

export type DareDifficulty = 
  | 'Level 1 - Starter' 
  | 'Level 2 - Moderate' 
  | 'Level 3 - Intense' 
  | 'Level 4 - Elite';

export type DareFormat = 'solo' | '1v1' | 'group' | 'public';

export interface PerformanceScores {
  speed: number;       // 0-100
  creativity: number;  // 0-100
  accuracy: number;    // 0-100
  overall: number;     // 0-100
}

export interface BrandSponsor {
  brandName: string;
  brandLogo: string;
  perkDescription: string;
  sponsorDiscountCode?: string;
  bonusCred: number;
}

export interface DareBountyContribution {
  userId: string;
  userHandle: string;
  userName: string;
  amount: number;
  addedAt: string;
}

export interface DareCircle {
  id: string;
  name: string;
  description: string;
  avatar: string;
  memberCount: number;
  isPrivate: boolean;
  memberHandles: string[];
}

export type DareStatus = 
  | 'open' 
  | 'accepted' 
  | 'submitted' 
  | 'verified' 
  | 'rejected' 
  | 'forfeited';

export type ProTier = 'lite' | 'runner' | 'elite' | 'overlord' | 'ultra';

export type ArmoryCategory = 'booster' | 'cosmetic' | 'title' | 'perk';
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ArmoryItem {
  id: string;
  name: string;
  description: string;
  category: ArmoryCategory;
  rarity: ItemRarity;
  priceCred: number;
  icon: string;
  effectKey: string;
  effectValue?: number;
  durationHours?: number;
  badgeCode?: string;
  frameCss?: string;
  stock?: number;
  isPhysical?: boolean;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  category: ArmoryCategory;
  rarity: ItemRarity;
  icon: string;
  quantity: number;
  acquiredAt: string;
  effectKey: string;
  effectValue?: number;
  isEquipped?: boolean;
}

export interface ActiveBooster {
  id: string;
  type: '2x_cred' | 'streak_freeze' | 'oracle_reroll' | 'bounty_amp' | 'spotlight_beacon' | 'fast_pass';
  name: string;
  icon: string;
  multiplier?: number;
  usesRemaining?: number;
  expiresAt: string;
  activatedAt: string;
}

export interface StakeWager {
  id: string;
  dareId: string;
  dareTitle: string;
  stakedCred: number;
  potentialPayout: number;
  multiplier: number;
  placedAt: string;
  expiresAt: string;
  status: 'active' | 'won' | 'lost';
}

export interface DailyContract {
  id: string;
  title: string;
  description: string;
  tier: string;
  targetCount: number;
  currentCount: number;
  rewardCred: number;
  rewardXp: number;
  icon: string;
  completed: boolean;
  dareCategory?: DareCategory;
}

export interface DailyOpsState {
  date: string;
  contracts: DailyContract[];
  trifectaClaimed: boolean;
  trifectaRewardCred: number;
  trifectaRewardXp: number;
  resetTimeRemainingMs: number;
}

export interface BattlePassTier {
  level: number;
  requiredXp: number;
  freeReward: {
    name: string;
    type: 'cred' | 'booster' | 'badge' | 'cosmetic' | 'title';
    amount?: number;
    icon: string;
    description: string;
  };
  eliteReward: {
    name: string;
    type: 'cred' | 'booster' | 'badge' | 'cosmetic' | 'title';
    amount?: number;
    icon: string;
    description: string;
  };
}

export interface UserProfile {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  cred: number;
  rank: string;
  xp?: number;
  level?: number;
  completedDaresCount: number;
  createdDaresCount: number;
  badges: string[];
  streak?: number;
  lastActiveDate?: string;
  isPro?: boolean;
  isGuest?: boolean;
  email?: string;
  referralCode?: string;
  referralCount?: number;
  proTier?: ProTier | null;
  proExpiresAt?: string;
  proBadge?: string;
  stipendClaimedAt?: string;
  streakShieldActive?: boolean;
  streakShieldExpiresAt?: string;
  stripeConnected?: boolean;
  stripeAccountId?: string;
  squadFriends?: string[];
  squadSentRequests?: string[];
  squadReceivedRequests?: string[];
  disableHelpBubbles?: boolean;
  // Economy & Gamification Additions
  inventory?: InventoryItem[];
  activeBoosters?: ActiveBooster[];
  equippedFrame?: string;
  equippedTitle?: string;
  reputationScore?: number; // 0-1000 authenticity trust score
  unlockedTitles?: string[]; // e.g. ["Risk Runner", "Urban Explorer", "Fearless", "Daredevil", "Apex Challenger"]
  circles?: string[];
  activeStakes?: StakeWager[];
  totalCredWonInStakes?: number;
  hasElitePass?: boolean;
  seasonPassLevel?: number;
  seasonPassXp?: number;
  seasonPassClaimedFree?: number[];
  seasonPassClaimedElite?: number[];
  dailyOps?: DailyOpsState;
}

export interface ProofCriteriaCheck {
  criterion: string;
  passed: boolean;
  score: number; // 0 to 100
  note?: string;
}

export interface ProofTelemetry {
  deviceType?: string;
  captureTimestamp?: string;
  hasAudioTrack?: boolean;
  tamperRiskScore?: number; // 0 to 100 (lower is more authentic)
  verifiedLocation?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  motionDetected?: boolean;
  motionMagnitude?: number;
  timestampLocked?: boolean;
  gpsAccuracyMeters?: number;
}

export interface AiJudgement {
  verdict: 'LEGIT' | 'BUSTED' | 'LEGENDARY';
  confidence: number;
  commentary: string;
  bonusCred: number;
  evaluatedAt: string;
  criteriaChecks?: ProofCriteriaCheck[];
  antiSpoofScore?: number; // 0-100 authenticity rating
  badgesAwarded?: string[];
  refereeModel?: string;
  detectedActions?: string[];
  detectedObjects?: string[];
  visualClarityScore?: number;
  authenticityRating?: string;
  performanceScores?: PerformanceScores;
}

export interface DareProof {
  mediaUrl?: string;
  caption: string;
  submittedAt: string;
  submittedByHandle: string;
  aiJudgement?: AiJudgement;
  telemetry?: ProofTelemetry;
  reactions?: Record<string, number>;
  userReactions?: Record<string, string>;
  communityVotes: {
    legit: number;
    busted: number;
    userVotes: Record<string, 'legit' | 'busted'>;
  };
}

export interface DareComment {
  id: string;
  userHandle: string;
  userName: string;
  avatar: string;
  text: string;
  timestamp: string;
  isVoiceNote?: boolean;
  voiceDuration?: number;
}

export interface DareItem {
  id: string;
  title: string;
  description: string;
  proofRequirement: string;
  category: DareCategory;
  difficulty: DareDifficulty;
  rewardCred: number;
  source?: 'direct' | 'daily' | 'ai' | 'community';
  format?: DareFormat;
  bountyPoolTotal?: number;
  bountyContributions?: DareBountyContribution[];
  brandSponsor?: BrandSponsor;
  circleId?: string;
  circleName?: string;
  creator: {
    id: string;
    handle: string;
    name: string;
    avatar: string;
    isPro?: boolean;
    proTier?: ProTier;
  };
  targetType: 'public' | 'direct';
  targetUserHandle?: string;
  status: DareStatus;
  acceptedBy?: {
    id: string;
    handle: string;
    name: string;
    avatar: string;
    isPro?: boolean;
    proTier?: ProTier;
  };
  acceptedAt?: string;
  expiresAt?: string;
  createdAt: string;
  proof?: DareProof;
  likes: number;
  likedUserIds: string[];
  comments: DareComment[];
  isVipExclusive?: boolean;
  isPinned?: boolean;
  isHolographic?: boolean;
  location?: {
    lat: number;
    lng: number;
  };
}

export type NotificationType = 
  | 'dare_accepted'
  | 'proof_voted'
  | 'comment_received'
  | 'dare_targeted'
  | 'proof_submitted'
  | 'pro_upgraded'
  | 'stipend_claimed'
  | 'rematch_requested'
  | 'tournament_wager'
  | 'social';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  dareId?: string;
  dareTitle?: string;
  actorHandle: string;
  actorName: string;
  actorAvatar: string;
  voteType?: 'legit' | 'busted';
  commentText?: string;
  read: boolean;
  createdAt: string;
}

export type CredTransactionType = 
  | 'dare_completed' 
  | 'vote_received' 
  | 'challenge_created' 
  | 'dare_accepted'
  | 'ai_bonus'
  | 'bonus_claimed'
  | 'stipend_claimed'
  | 'shield_activated'
  | 'pro_upgrade'
  | 'shop_purchase'
  | 'booster_activated'
  | 'stake_placed'
  | 'stake_won'
  | 'stake_lost'
  | 'daily_contract_completed'
  | 'daily_trifecta_claimed'
  | 'season_pass_reward'
  | 'tip_sent'
  | 'tip_received'
  | 'drop_zone_claimed'
  | 'drop_zone_deployed';

export interface CredTransaction {
  id: string;
  userId: string;
  type: CredTransactionType;
  amount: number; // Positive for gains, negative for losses
  dareId?: string;
  dareTitle?: string;
  description: string;
  timestamp: string;
}

export interface DareCoachAdvice {
  coachPersona: string;
  summary: string;
  difficultyAssessment: string;
  preparation: string[];
  stepByStepTips: string[];
  safetyGuidance: string[];
  proofAdvice: string;
  estimatedTimeMinutes?: number;
}

export interface DailyMission {
  id: string;
  dareId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface SquadTournament {
  id: string;
  title: string;
  badge: string;
  description: string;
  targetBountyTitle: string;
  potCred: number;
  entryFeeCred: number;
  startsAt: string;
  endsAt: string;
  status: 'active' | 'upcoming' | 'concluded';
  squadA: {
    name: string;
    tag: string;
    avatar: string;
    members: string[]; // User handles
    score: number; // Verified proofs submitted
    wageredCred: number;
  };
  squadB: {
    name: string;
    tag: string;
    avatar: string;
    members: string[];
    score: number;
    wageredCred: number;
  };
  winnerSquadTag?: string;
}

export interface LiveDuelParticipant {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  isPro?: boolean;
  squadTag?: string;
  isReady: boolean;
  progressPercent: number; // 0 to 100
  status: 'connecting' | 'battling' | 'submitted' | 'verified' | 'forfeited';
  submissionTimeSeconds?: number;
  proofMediaUrl?: string;
  proofNote?: string;
  wagerOdds: number;
  totalWagersCred: number;
  cheerCount: number;
  recentAction?: string;
}

export interface LiveDuelSpectatorWager {
  userId: string;
  userHandle: string;
  backedParticipantId: string;
  amountCred: number;
  potentialWinCred: number;
  timestamp: string;
}

export interface LiveDuelCheer {
  id: string;
  userId: string;
  userHandle: string;
  targetParticipantId: string;
  emoji: string;
  label: string;
  timestamp: number;
}

export interface LiveDuel {
  id: string;
  title: string;
  category: DareCategory;
  difficulty: DareDifficulty;
  challengeBrief: string;
  proofCriteria: string;
  durationSeconds: number; // e.g. 180 (3m) or 300 (5m)
  potCred: number;
  entryFeeCred: number;
  status: 'lobby' | 'countdown' | 'in_progress' | 'review' | 'concluded';
  startedAt?: number;
  endsAt?: number;
  challenger: LiveDuelParticipant;
  opponent: LiveDuelParticipant;
  spectatorWagers: LiveDuelSpectatorWager[];
  cheers: LiveDuelCheer[];
  winnerId?: string;
  winnerDeclaredReason?: string;
  isAiOpponent?: boolean;
}

export interface SocialComment {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
}

export interface SocialFeedPost {
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
  comments: SocialComment[];
  tags?: string[];
  createdAt: string;
}

export interface StoryItem {
  id: string;
  user: UserProfile;
  type?: 'text' | 'image' | 'video';
  mediaUrl?: string;
  text?: string;
  bgGradient?: string;
  fontStyle?: string;
  sticker?: string;
  caption?: string;
  filter?: string;
  createdAt: string;
  expiresAt?: string;
}




