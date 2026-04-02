/**
 * Blind Tasting Scoring Service
 *
 * Calculates scores for blind tasting guesses.
 * Scoring weights (friendly & encouraging):
 *   - Country: 15 pts
 *   - Region: 25 pts
 *   - Grape: 30 pts
 *   - Vintage (within 2 years): 20 pts
 *   - Producer (exact match): 10 pts bonus
 *   - Total possible: 100 pts per wine
 */

type Wine = {
  grapes: string[];
  region: string;
  country: string;
  vintage: number | null;
  producer: string;
};

type Guess = {
  guessedGrape?: string | null;
  guessedRegion?: string | null;
  guessedCountry?: string | null;
  guessedVintage?: number | null;
  guessedProducer?: string | null;
};

type ScoreBreakdown = {
  total: number;
  country: number;
  region: number;
  grape: number;
  vintage: number;
  producer: number;
  feedback: string;
};

const POINTS = {
  country: 15,
  region: 25,
  grape: 30,
  vintage: 20,
  producer: 10,
} as const;

export function scoreGuess(wine: Wine, guess: Guess): ScoreBreakdown {
  let countryScore = 0;
  let regionScore = 0;
  let grapeScore = 0;
  let vintageScore = 0;
  let producerScore = 0;

  // Country (case-insensitive)
  if (
    guess.guessedCountry &&
    normalize(guess.guessedCountry) === normalize(wine.country)
  ) {
    countryScore = POINTS.country;
  }

  // Region (case-insensitive, partial matching)
  if (guess.guessedRegion) {
    const guessedRegion = normalize(guess.guessedRegion);
    const actualRegion = normalize(wine.region);
    if (guessedRegion === actualRegion) {
      regionScore = POINTS.region;
    } else if (
      actualRegion.includes(guessedRegion) ||
      guessedRegion.includes(actualRegion)
    ) {
      regionScore = Math.round(POINTS.region * 0.5); // Partial credit
    }
  }

  // Grape (check if guessed grape is in wine's grape list)
  if (guess.guessedGrape) {
    const guessedGrape = normalize(guess.guessedGrape);
    const matchedGrape = wine.grapes.some(
      (g) =>
        normalize(g) === guessedGrape ||
        normalize(g).includes(guessedGrape) ||
        guessedGrape.includes(normalize(g))
    );
    if (matchedGrape) {
      grapeScore = POINTS.grape;
    }
  }

  // Vintage (within 2 years gets partial credit)
  if (guess.guessedVintage && wine.vintage) {
    const diff = Math.abs(guess.guessedVintage - wine.vintage);
    if (diff === 0) {
      vintageScore = POINTS.vintage;
    } else if (diff <= 2) {
      vintageScore = Math.round(POINTS.vintage * 0.5);
    }
  }

  // Producer (exact-ish match, bonus points)
  if (guess.guessedProducer) {
    if (
      normalize(guess.guessedProducer) === normalize(wine.producer) ||
      normalize(wine.producer).includes(normalize(guess.guessedProducer))
    ) {
      producerScore = POINTS.producer;
    }
  }

  const total =
    countryScore + regionScore + grapeScore + vintageScore + producerScore;

  return {
    total,
    country: countryScore,
    region: regionScore,
    grape: grapeScore,
    vintage: vintageScore,
    producer: producerScore,
    feedback: generateFeedback(total),
  };
}

function generateFeedback(total: number): string {
  if (total >= 90) return "Incredible! You have an extraordinary palate! 🏆";
  if (total >= 70) return "Impressive! Your nose knows its stuff! 🎯";
  if (total >= 50) return "Great job! You're developing a real talent! 👏";
  if (total >= 30) return "Nice effort! Every tasting makes you better! 🌱";
  return "Keep exploring! The journey is the best part! 🍷";
}

/**
 * Calculate XP earned from a blind tasting event.
 */
export function calculateXP(
  scores: number[],
  difficulty: string
): { xp: number; bonusReason?: string } {
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Base XP from difficulty
  const difficultyMultiplier: Record<string, number> = {
    beginner: 1,
    intermediate: 1.5,
    advanced: 2,
    master: 3,
  };
  const multiplier = difficultyMultiplier[difficulty] ?? 1;

  // Participation XP (everyone gets something!)
  const participationXP = 25;

  // Performance XP
  const performanceXP = Math.round(avgScore * 0.5 * multiplier);

  const xp = participationXP + performanceXP;

  // Bonus for perfect scores
  if (avgScore >= 90) {
    return { xp: xp + 50, bonusReason: "Perfect palate bonus! +50 XP" };
  }

  return { xp };
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
}
