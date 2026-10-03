import { DareItem, DareCategory, DareDifficulty } from '../types';

interface PlatformDareTemplate {
  title: string;
  description: string;
  proofRequirement: string;
  category: DareCategory;
  difficulty: DareDifficulty;
  rewardCred: number;
}

export const PLATFORM_DARE_TEMPLATES: PlatformDareTemplate[] = [
  // 1. Fitness / Physical Surge
  {
    title: 'Morning Power Circuit: 35 Pushups & 50 Air Squats',
    description: 'Kickstart your day with an explosive bodyweight blast. Complete 35 clean pushups and 50 deep squats in under 8 minutes.',
    proofRequirement: 'Submit a short time-lapse video or photo of your workout session with heart rate/timer confirmation.',
    category: 'physical',
    difficulty: 'Level 2 - Moderate',
    rewardCred: 150,
  },
  {
    title: 'The 2-Minute Cold Finish Reset',
    description: 'Conquer your comfort zone. Turn your standard shower to full cold for the final 2 continuous minutes. Zero hesitation.',
    proofRequirement: 'Submit a photo or short clip showing the timer / frost dial and your post-shower victory reaction.',
    category: 'physical',
    difficulty: 'Level 2 - Moderate',
    rewardCred: 125,
  },
  {
    title: 'Fast Mile Challenge: 1-Mile Outdoor Dash',
    description: 'Lace up your running shoes and sprint or briskly run 1 continuous mile outdoors. Log your effort and conquer your pace.',
    proofRequirement: 'Submit a screenshot of your GPS running app (Strava, Nike, Apple Fitness) or outdoor path photo.',
    category: 'physical',
    difficulty: 'Level 2 - Moderate',
    rewardCred: 175,
  },
  {
    title: 'Core Steel: 3-Minute Accumulative Plank',
    description: 'Build indestructible core fortitude. Hold a total of 3 minutes in plank position across maximum 2 sets.',
    proofRequirement: 'Submit a photo of your workout timer and plank station.',
    category: 'physical',
    difficulty: 'Level 2 - Moderate',
    rewardCred: 130,
  },
  {
    title: 'Stairway Sprint: Climb 10 Flights of Stairs',
    description: 'Skip the elevator completely. Find a multi-floor building, stadium, or park hill and power up 10 flights.',
    proofRequirement: 'Submit a photo from the top floor looking down or your smartwatch stair count.',
    category: 'physical',
    difficulty: 'Level 2 - Moderate',
    rewardCred: 140,
  },

  // 2. Creative / Perspective / Art
  {
    title: 'Architectural Negative Space Photography',
    description: 'Frame an extraordinary photo of an everyday building, bridge, or skyline utilizing dramatic negative space and geometry.',
    proofRequirement: 'Upload your original high-contrast photo showcasing clear intentional framing.',
    category: 'creative',
    difficulty: 'Level 1 - Starter',
    rewardCred: 120,
  },
  {
    title: 'Flash Micro-Story: 6 Words on Paper',
    description: 'Write a profound, humorous, or intense 6-word story handwritten with pen on a clean piece of paper or notebook.',
    proofRequirement: 'Photograph your handwritten 6-word story in sharp natural lighting.',
    category: 'creative',
    difficulty: 'Level 1 - Starter',
    rewardCred: 110,
  },
  {
    title: 'Color Hunt: 5 Distinct Yellow Objects in the Wild',
    description: 'Sharpen your observation. Go outdoors and photograph 5 completely different vibrant yellow objects in your town or neighborhood.',
    proofRequirement: 'Upload a collage or photo containing all 5 unique yellow objects found in public.',
    category: 'creative',
    difficulty: 'Level 1 - Starter',
    rewardCred: 125,
  },
  {
    title: 'Blind Contour Sketch: 90 Seconds No Peeking',
    description: 'Place an interesting object in front of you. Draw its contour lines in 90 seconds without looking down at your paper or lifting the pen.',
    proofRequirement: 'Upload a photo of your spontaneous blind contour sketch next to the referenced object.',
    category: 'creative',
    difficulty: 'Level 2 - Moderate',
    rewardCred: 135,
  },
  {
    title: 'Cinematic Shadows: High Noon Silhouette',
    description: 'Capture a dramatic shadow pattern cast by a street lamp, fence, foliage, or bicycle during peak contrast light.',
    proofRequirement: 'Upload your high-contrast shadow photograph with sharp silhouette lines.',
    category: 'creative',
    difficulty: 'Level 1 - Starter',
    rewardCred: 115,
  },

  // 3. Social & Real-World Impact
  {
    title: 'The Secret Encourager: Hidden Uplifting Note',
    description: 'Write a genuine, uplifting sentence on a sticky note ("You are doing better than you realize") and leave it in a library, bus stop, or cafe.',
    proofRequirement: 'Upload a photo of your handwritten note in its public resting spot before walking away.',
    category: 'social',
    difficulty: 'Level 1 - Starter',
    rewardCred: 150,
  },
  {
    title: 'Old Bridge: Rekindle a Lost Connection',
    description: 'Send a thoughtful voice note or text message to a friend, mentor, or family member you haven’t spoken to in over 6 months.',
    proofRequirement: 'Submit a screenshot of the sent message with personal names blurred.',
    category: 'social',
    difficulty: 'Level 2 - Moderate',
    rewardCred: 160,
  },
  {
    title: 'Sincere Barista / Cashier Recognition',
    description: 'Give a heartfelt, specific verbal compliment or generous tip to a service worker (barista, cashier, driver) acknowledging their work.',
    proofRequirement: 'Submit a short text summary or photo of your receipt/coffee acknowledging their prompt service.',
    category: 'social',
    difficulty: 'Level 1 - Starter',
    rewardCred: 140,
  },
  {
    title: 'Trash Tag Quick Sweep: Clean Up 5 Public Items',
    description: 'Leave your world better than you found it. Pick up 5 pieces of discarded litter in a local park or sidewalk and recycle them properly.',
    proofRequirement: 'Upload before and after photo of the cleaned spot or the collected items safely in the bin.',
    category: 'social',
    difficulty: 'Level 1 - Starter',
    rewardCred: 145,
  },

  // 4. Skills, Tech & Mindset
  {
    title: 'Digital Blackout: 60 Minutes Zero Screens',
    description: 'Step away from all screens (phone, laptop, TV, tablet) for 1 full uninterrupted hour. Read a physical book, journal, or stretch.',
    proofRequirement: 'Photograph your analog station (book, notebook, tea) with a physical clock showing time elapsed.',
    category: 'tech',
    difficulty: 'Level 2 - Moderate',
    rewardCred: 150,
  },
  {
    title: 'Keyboard Speed Run: 80+ WPM on MonkeyType',
    description: 'Test your digital reflex. Achieve 80+ WPM (or beat your personal best by 10 WPM) on a 60-second typing test.',
    proofRequirement: 'Upload a screenshot of your verified typing test result with timestamp and accuracy score.',
    category: 'tech',
    difficulty: 'Level 2 - Moderate',
    rewardCred: 140,
  },
  {
    title: 'Pocket Knowledge: Read One Longform Essay or Whitepaper',
    description: 'Feed your mind with high-density thinking. Read a comprehensive scientific paper, tech essay, or historical article from start to finish.',
    proofRequirement: 'Submit a 3-bullet takeaway summary note written in your own words.',
    category: 'tech',
    difficulty: 'Level 1 - Starter',
    rewardCred: 130,
  },
  {
    title: 'Wildcard: Memorize 20 Digits of Pi or a Poem',
    description: 'Test your raw human memory. Memorize a famous sonnet, verse, or the first 20 digits of Pi and recite it without pauses.',
    proofRequirement: 'Submit a brief video clip of your recitation looking directly at the camera with eyes closed.',
    category: 'absurd',
    difficulty: 'Level 2 - Moderate',
    rewardCred: 160,
  }
];

/**
 * Deterministically generates today's 3 platform daily dares based on the date string (YYYY-MM-DD).
 * Ensures all players see the exact same synchronized challenges on any given day.
 */
export function getDailyPlatformDares(dateStr?: string): DareItem[] {
  const dateKey = dateStr || new Date().toISOString().split('T')[0];
  
  // Calculate deterministic numeric seed from date string
  let seed = 0;
  for (let i = 0; i < dateKey.length; i++) {
    seed = (seed * 31 + dateKey.charCodeAt(i)) >>> 0;
  }

  const templatesCount = PLATFORM_DARE_TEMPLATES.length;
  // Pick 3 non-overlapping daily templates
  const idx1 = seed % templatesCount;
  const idx2 = (seed + 5) % templatesCount;
  const idx3 = (seed + 11) % templatesCount;

  const selectedTemplates = [
    PLATFORM_DARE_TEMPLATES[idx1],
    PLATFORM_DARE_TEMPLATES[idx2],
    PLATFORM_DARE_TEMPLATES[idx3],
  ];

  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

  return selectedTemplates.map((template, index) => {
    return {
      id: `daily_${dateKey}_${index + 1}`,
      title: template.title,
      description: template.description,
      proofRequirement: template.proofRequirement,
      category: template.category,
      difficulty: template.difficulty,
      rewardCred: template.rewardCred,
      source: 'daily',
      format: 'public',
      targetType: 'public',
      status: 'open',
      isPlatformDaily: true,
      isDailyMission: true,
      isPinned: index === 0, // Top daily dare is pinned
      likes: 0,
      likedUserIds: [],
      comments: [],
      creator: {
        id: 'platform_system',
        name: 'DARE Official',
        handle: '@dare',
        avatar: '/logo.png',
        isPro: true,
        proTier: 'ultra',
      },
      createdAt: `${dateKey}T00:00:00.000Z`,
      expiresAt: endOfDay,
    };
  });
}
