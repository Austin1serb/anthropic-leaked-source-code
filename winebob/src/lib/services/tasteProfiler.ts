/**
 * Taste Profile Generation Service
 *
 * Generates and updates a user's taste profile based on their wine ratings,
 * blind tasting results, and onboarding quiz answers.
 */

type OnboardingAnswers = {
  body: number; // 0-100 slider
  sweetness: number; // 0-100 slider
  grape: string[]; // selected grapes
  region: string[]; // selected regions
  adventure: number; // 0-100 slider
};

type TasteProfileData = {
  body: number; // 0-1
  tannin: number; // 0-1
  acidity: number; // 0-1
  sweetness: number; // 0-1
  fruitForward: number; // 0-1
  oakInfluence: number; // 0-1
  topGrapes: string[];
  topRegions: string[];
};

// Grape -> typical taste characteristics
const grapeProfiles: Record<
  string,
  Partial<Omit<TasteProfileData, "topGrapes" | "topRegions">>
> = {
  "Cabernet Sauvignon": {
    body: 0.9,
    tannin: 0.9,
    acidity: 0.6,
    fruitForward: 0.6,
    oakInfluence: 0.8,
  },
  "Pinot Noir": {
    body: 0.4,
    tannin: 0.3,
    acidity: 0.7,
    fruitForward: 0.8,
    oakInfluence: 0.4,
  },
  Merlot: {
    body: 0.7,
    tannin: 0.5,
    acidity: 0.5,
    fruitForward: 0.7,
    oakInfluence: 0.6,
  },
  "Syrah/Shiraz": {
    body: 0.85,
    tannin: 0.7,
    acidity: 0.5,
    fruitForward: 0.5,
    oakInfluence: 0.6,
  },
  Chardonnay: {
    body: 0.6,
    tannin: 0.1,
    acidity: 0.6,
    fruitForward: 0.6,
    oakInfluence: 0.7,
  },
  "Sauvignon Blanc": {
    body: 0.3,
    tannin: 0.05,
    acidity: 0.9,
    fruitForward: 0.7,
    oakInfluence: 0.1,
  },
  Riesling: {
    body: 0.3,
    tannin: 0.05,
    acidity: 0.85,
    sweetness: 0.5,
    fruitForward: 0.8,
    oakInfluence: 0.0,
  },
  Nebbiolo: {
    body: 0.7,
    tannin: 0.95,
    acidity: 0.85,
    fruitForward: 0.5,
    oakInfluence: 0.5,
  },
  Tempranillo: {
    body: 0.7,
    tannin: 0.6,
    acidity: 0.6,
    fruitForward: 0.5,
    oakInfluence: 0.7,
  },
  Gamay: {
    body: 0.3,
    tannin: 0.2,
    acidity: 0.7,
    fruitForward: 0.9,
    oakInfluence: 0.1,
  },
  Grenache: {
    body: 0.7,
    tannin: 0.4,
    acidity: 0.5,
    fruitForward: 0.7,
    oakInfluence: 0.4,
  },
  Sangiovese: {
    body: 0.6,
    tannin: 0.7,
    acidity: 0.8,
    fruitForward: 0.6,
    oakInfluence: 0.5,
  },
};

/**
 * Generate an initial taste profile from onboarding quiz answers.
 */
export function generateFromOnboarding(
  answers: OnboardingAnswers
): TasteProfileData {
  const selectedGrapes = answers.grape;
  const selectedRegions = answers.region;

  // Start with direct slider answers
  const bodyBase = answers.body / 100;
  const sweetnessBase = answers.sweetness / 100;

  // Average the grape profiles for selected grapes
  let tanninSum = 0;
  let aciditySum = 0;
  let fruitSum = 0;
  let oakSum = 0;
  let count = 0;

  for (const grape of selectedGrapes) {
    const profile = grapeProfiles[grape];
    if (profile) {
      tanninSum += profile.tannin ?? 0.5;
      aciditySum += profile.acidity ?? 0.5;
      fruitSum += profile.fruitForward ?? 0.5;
      oakSum += profile.oakInfluence ?? 0.5;
      count++;
    }
  }

  const avg = (sum: number) => (count > 0 ? sum / count : 0.5);

  return {
    body: clamp(bodyBase),
    tannin: clamp(avg(tanninSum)),
    acidity: clamp(avg(aciditySum)),
    sweetness: clamp(sweetnessBase),
    fruitForward: clamp(avg(fruitSum)),
    oakInfluence: clamp(avg(oakSum)),
    topGrapes: selectedGrapes.slice(0, 5),
    topRegions: selectedRegions.slice(0, 5),
  };
}

/**
 * Update taste profile with a new wine rating.
 * Uses exponential moving average to gradually shift the profile.
 */
export function updateWithRating(
  current: TasteProfileData,
  wineGrapes: string[],
  rating: number,
  _totalRatings: number
): TasteProfileData {
  // Higher ratings shift the profile more toward this wine's characteristics
  const influence = rating >= 4 ? 0.15 : rating >= 3 ? 0.05 : 0;

  if (influence === 0) return current;

  // Average the grape profiles of the rated wine
  let grapeProfile = {
    body: 0.5,
    tannin: 0.5,
    acidity: 0.5,
    fruitForward: 0.5,
    oakInfluence: 0.5,
  };
  let count = 0;

  for (const grape of wineGrapes) {
    const profile = grapeProfiles[grape];
    if (profile) {
      grapeProfile.body += profile.body ?? 0.5;
      grapeProfile.tannin += profile.tannin ?? 0.5;
      grapeProfile.acidity += profile.acidity ?? 0.5;
      grapeProfile.fruitForward += profile.fruitForward ?? 0.5;
      grapeProfile.oakInfluence += profile.oakInfluence ?? 0.5;
      count++;
    }
  }

  if (count > 0) {
    grapeProfile.body /= count;
    grapeProfile.tannin /= count;
    grapeProfile.acidity /= count;
    grapeProfile.fruitForward /= count;
    grapeProfile.oakInfluence /= count;
  }

  // EMA blend
  return {
    body: clamp(ema(current.body, grapeProfile.body, influence)),
    tannin: clamp(ema(current.tannin, grapeProfile.tannin, influence)),
    acidity: clamp(ema(current.acidity, grapeProfile.acidity, influence)),
    sweetness: current.sweetness, // Sweetness changes more slowly
    fruitForward: clamp(
      ema(current.fruitForward, grapeProfile.fruitForward, influence)
    ),
    oakInfluence: clamp(
      ema(current.oakInfluence, grapeProfile.oakInfluence, influence)
    ),
    topGrapes: current.topGrapes, // Updated separately via frequency analysis
    topRegions: current.topRegions,
  };
}

/**
 * Generate a simple profile vector for similarity matching.
 */
export function generateProfileVector(profile: TasteProfileData): number[] {
  return [
    profile.body,
    profile.tannin,
    profile.acidity,
    profile.sweetness,
    profile.fruitForward,
    profile.oakInfluence,
  ];
}

/**
 * Calculate cosine similarity between two profile vectors.
 */
export function profileSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

function ema(current: number, newValue: number, alpha: number): number {
  return current * (1 - alpha) + newValue * alpha;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}
