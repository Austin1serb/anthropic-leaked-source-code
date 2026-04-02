/**
 * Wine Recommendation Engine
 *
 * Uses taste profile similarity + collaborative filtering to recommend wines.
 * Strategy:
 *   1. Find wines matching user's taste profile (content-based)
 *   2. Find wines loved by users with similar taste profiles (collaborative)
 *   3. Blend and rank recommendations
 */

import { profileSimilarity } from "./tasteProfiler";

type WineForRecommendation = {
  id: string;
  grapes: string[];
  region: string;
  country: string;
  type: string;
  avgRating: number;
  totalRatings: number;
};

type UserProfile = {
  profileVector: number[];
  topGrapes: string[];
  topRegions: string[];
  ratedWineIds: string[];
};

type Recommendation = {
  wineId: string;
  score: number;
  reason: string;
};

// Grape characteristics vectors (body, tannin, acidity, sweetness, fruit, oak)
const grapeVectors: Record<string, number[]> = {
  "Cabernet Sauvignon": [0.9, 0.9, 0.6, 0.1, 0.6, 0.8],
  "Pinot Noir": [0.4, 0.3, 0.7, 0.1, 0.8, 0.4],
  Merlot: [0.7, 0.5, 0.5, 0.1, 0.7, 0.6],
  "Syrah/Shiraz": [0.85, 0.7, 0.5, 0.1, 0.5, 0.6],
  Chardonnay: [0.6, 0.1, 0.6, 0.15, 0.6, 0.7],
  "Sauvignon Blanc": [0.3, 0.05, 0.9, 0.1, 0.7, 0.1],
  Riesling: [0.3, 0.05, 0.85, 0.5, 0.8, 0.0],
  Nebbiolo: [0.7, 0.95, 0.85, 0.1, 0.5, 0.5],
  Tempranillo: [0.7, 0.6, 0.6, 0.1, 0.5, 0.7],
  Gamay: [0.3, 0.2, 0.7, 0.1, 0.9, 0.1],
  Grenache: [0.7, 0.4, 0.5, 0.1, 0.7, 0.4],
  Sangiovese: [0.6, 0.7, 0.8, 0.1, 0.6, 0.5],
};

/**
 * Get personalized wine recommendations for a user.
 */
export function getRecommendations(
  userProfile: UserProfile,
  allWines: WineForRecommendation[],
  similarUsersRatedWines?: Map<string, number>, // wineId -> avg rating from similar users
  limit = 10
): Recommendation[] {
  const scored: Recommendation[] = [];

  for (const wine of allWines) {
    // Skip already-rated wines
    if (userProfile.ratedWineIds.includes(wine.id)) continue;

    let score = 0;
    const reasons: string[] = [];

    // 1. Content-based: wine grape profile vs user taste profile
    const wineVector = computeWineVector(wine.grapes);
    if (wineVector) {
      const similarity = profileSimilarity(
        userProfile.profileVector,
        wineVector
      );
      score += similarity * 40; // Max 40 points from taste match
      if (similarity > 0.85) {
        reasons.push("Matches your taste profile perfectly");
      }
    }

    // 2. Grape match bonus
    const matchedGrapes = wine.grapes.filter((g) =>
      userProfile.topGrapes.includes(g)
    );
    if (matchedGrapes.length > 0) {
      score += matchedGrapes.length * 10;
      reasons.push(`You love ${matchedGrapes[0]}`);
    }

    // 3. Region match bonus
    if (userProfile.topRegions.includes(wine.region)) {
      score += 15;
      reasons.push(`From ${wine.region}, one of your favorites`);
    }

    // 4. Community rating boost
    if (wine.avgRating >= 4 && wine.totalRatings >= 5) {
      score += wine.avgRating * 3;
      reasons.push("Highly rated by the community");
    }

    // 5. Collaborative filtering: similar users liked this
    const collaborativeRating = similarUsersRatedWines?.get(wine.id);
    if (collaborativeRating && collaborativeRating >= 4) {
      score += collaborativeRating * 5;
      reasons.push("Loved by wine lovers with similar taste");
    }

    if (score > 0) {
      scored.push({
        wineId: wine.id,
        score,
        reason: reasons[0] ?? "Recommended for you",
      });
    }
  }

  // Sort by score descending, take top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

function computeWineVector(grapes: string[]): number[] | null {
  const vectors = grapes
    .map((g) => grapeVectors[g])
    .filter((v): v is number[] => v !== undefined);

  if (vectors.length === 0) return null;

  // Average all grape vectors
  const result = new Array(6).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < 6; i++) {
      result[i] += v[i];
    }
  }
  for (let i = 0; i < 6; i++) {
    result[i] /= vectors.length;
  }
  return result;
}
