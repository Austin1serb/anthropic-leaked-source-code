/**
 * Reputation & Gamification Service
 *
 * Manages XP, levels, reputation tokens, ranks, and badges.
 * Friendly & encouraging: everyone earns, no one loses.
 */

// XP thresholds for each level
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000,
];

// Rank thresholds
const RANKS = [
  { name: "cork", minLevel: 1, label: "Cork" },
  { name: "sommelier", minLevel: 4, label: "Sommelier" },
  { name: "cellar_master", minLevel: 7, label: "Cellar Master" },
  { name: "grand_cru", minLevel: 10, label: "Grand Cru" },
] as const;

type XPSource =
  | "wine_rating"
  | "blind_tasting"
  | "daily_challenge"
  | "check_in"
  | "prediction_correct"
  | "streak_bonus"
  | "event_hosted"
  | "event_joined"
  | "first_review"
  | "badge_earned";

// XP rewards per action
const XP_REWARDS: Record<XPSource, number> = {
  wine_rating: 10,
  blind_tasting: 25, // Base, multiplied by difficulty
  daily_challenge: 15,
  check_in: 5,
  prediction_correct: 20,
  streak_bonus: 10, // Per streak day milestone
  event_hosted: 30,
  event_joined: 15,
  first_review: 25,
  badge_earned: 50,
};

// Reputation token rewards
const REPUTATION_REWARDS: Partial<Record<XPSource, number>> = {
  daily_challenge: 10,
  blind_tasting: 15,
  prediction_correct: 25,
  event_hosted: 20,
  streak_bonus: 5,
};

export function awardXP(
  currentXP: number,
  source: XPSource,
  multiplier = 1
): {
  newXP: number;
  awarded: number;
  leveledUp: boolean;
  newLevel: number;
  newRank: string;
} {
  const awarded = Math.round(XP_REWARDS[source] * multiplier);
  const newXP = currentXP + awarded;
  const newLevel = calculateLevel(newXP);
  const oldLevel = calculateLevel(currentXP);
  const newRank = calculateRank(newLevel);

  return {
    newXP,
    awarded,
    leveledUp: newLevel > oldLevel,
    newLevel,
    newRank,
  };
}

export function awardReputation(
  currentRep: number,
  source: XPSource
): { newRep: number; awarded: number } {
  const awarded = REPUTATION_REWARDS[source] ?? 0;
  return {
    newRep: currentRep + awarded,
    awarded,
  };
}

export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function calculateRank(level: number): string {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (level >= RANKS[i].minLevel) return RANKS[i].name;
  }
  return "cork";
}

export function xpToNextLevel(currentXP: number): {
  current: number;
  needed: number;
  progress: number;
} {
  const level = calculateLevel(currentXP);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

  const current = currentXP - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  const progress = needed > 0 ? current / needed : 1;

  return { current, needed, progress };
}

/**
 * Check streak milestones and award bonus XP/reputation.
 */
export function checkStreakMilestones(
  streakDays: number
): { milestone: boolean; bonusXP: number; bonusRep: number; message: string } | null {
  const milestones = [3, 7, 14, 30, 60, 100, 365];
  if (milestones.includes(streakDays)) {
    const multiplier = Math.min(streakDays / 7, 5);
    return {
      milestone: true,
      bonusXP: Math.round(XP_REWARDS.streak_bonus * multiplier),
      bonusRep: Math.round((REPUTATION_REWARDS.streak_bonus ?? 5) * multiplier),
      message: `${streakDays}-day streak! 🔥 You're on fire!`,
    };
  }
  return null;
}

// Badge definitions
export const BADGE_DEFINITIONS = [
  // Cellar badges
  { id: "first_sip", name: "First Sip", description: "Rate your first wine", category: "cellar", tier: "bronze", condition: { type: "wines_rated", count: 1 } },
  { id: "wine_explorer_10", name: "Wine Explorer", description: "Rate 10 different wines", category: "cellar", tier: "bronze", condition: { type: "wines_rated", count: 10 } },
  { id: "grape_explorer", name: "Grape Explorer", description: "Try wines from 10 different grape varieties", category: "cellar", tier: "silver", condition: { type: "unique_grapes", count: 10 } },
  { id: "globe_trotter", name: "Globe Trotter", description: "Try wines from 5 different countries", category: "cellar", tier: "silver", condition: { type: "unique_countries", count: 5 } },

  // Arena badges
  { id: "first_guess", name: "First Guess", description: "Complete your first blind tasting", category: "arena", tier: "bronze", condition: { type: "blind_tastings", count: 1 } },
  { id: "sharp_nose", name: "Sharp Nose", description: "Score 80+ on a blind tasting", category: "arena", tier: "silver", condition: { type: "blind_score", min: 80 } },
  { id: "arena_champ", name: "Arena Champion", description: "Win 5 blind tasting events", category: "arena", tier: "gold", condition: { type: "events_won", count: 5 } },

  // Trail badges
  { id: "streak_7", name: "Week Warrior", description: "7-day tasting streak", category: "trail", tier: "bronze", condition: { type: "streak", count: 7 } },
  { id: "streak_30", name: "Monthly Maven", description: "30-day tasting streak", category: "trail", tier: "silver", condition: { type: "streak", count: 30 } },
  { id: "social_sipper", name: "Social Sipper", description: "Attend 5 tasting events", category: "trail", tier: "bronze", condition: { type: "events_attended", count: 5 } },

  // Futures badges
  { id: "oracle", name: "Oracle", description: "Get 5 predictions correct", category: "futures", tier: "bronze", condition: { type: "predictions_correct", count: 5 } },
  { id: "crystal_ball", name: "Crystal Ball", description: "Maintain 70%+ prediction accuracy", category: "futures", tier: "gold", condition: { type: "prediction_accuracy", min: 0.7 } },
] as const;
