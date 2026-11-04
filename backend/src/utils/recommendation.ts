/**
 * Recommendation & Ranking Engine for PETWO Platform
 *
 * Implements:
 * 1. Bayesian Average Confidence-Adjusted Rating
 * 2. Provider Reliability Scoring (based on completion & cancellation history)
 * 3. New Provider Fairness & Cold-Start Exploration Bonus
 * 4. Multi-factor Composite Recommendation Ranking
 */

export interface RecommendationConfig {
  /** Minimum review threshold for statistical significance (m) */
  minReviewsThreshold: number;
  /** Platform-wide baseline average rating (C) */
  platformAverageRating: number;
  /** Weight assigned to Bayesian rating in recommendation score (0–1) */
  weightBayesian: number;
  /** Weight assigned to reliability score in recommendation score (0–1) */
  weightReliability: number;
  /** Weight assigned to verification status in recommendation score (0–1) */
  weightVerification: number;
  /** Weight assigned to distance proximity in recommendation score (0–1) */
  weightDistance: number;
  /** Maximum distance in km beyond which distance factor decays to 0 */
  maxDistanceDecayKm: number;
  /** Boost added to newly verified providers to ensure fair discovery */
  newProviderBoost: number;
}

export const DEFAULT_RECOMMENDATION_CONFIG: RecommendationConfig = {
  minReviewsThreshold: 10,
  platformAverageRating: 4.0,
  weightBayesian: 0.50,
  weightReliability: 0.25,
  weightVerification: 0.15,
  weightDistance: 0.10,
  maxDistanceDecayKm: 50,
  newProviderBoost: 0.08, // ~8% boost for newly verified providers
};

/**
 * Calculates the Bayesian Average Rating:
 * Weighted Rating = (v / (v + m)) * R + (m / (v + m)) * C
 *
 * @param averageRating R: The provider's arithmetic average rating (1–5)
 * @param reviewCount v: Total count of verified published reviews
 * @param platformAverage C: Platform average baseline (default 4.0)
 * @param minThreshold m: Minimum reviews threshold (default 10)
 * @returns Weighted rating between 1.0 and 5.0, rounded to 2 decimal places
 */
export function calculateBayesianRating(
  averageRating: number,
  reviewCount: number,
  platformAverage: number = DEFAULT_RECOMMENDATION_CONFIG.platformAverageRating,
  minThreshold: number = DEFAULT_RECOMMENDATION_CONFIG.minReviewsThreshold,
): number {
  const v = Math.max(0, reviewCount);
  const m = Math.max(1, minThreshold);
  const C = Math.max(1, Math.min(5, platformAverage));

  if (v === 0) {
    // Zero reviews returns platform baseline C, preventing unfair 0-star penalty
    return C;
  }

  const R = Math.max(1, Math.min(5, averageRating));
  const weighted = (v / (v + m)) * R + (m / (v + m)) * C;

  return Math.round(weighted * 100) / 100;
}

/**
 * Calculates provider reliability score based on completed bookings vs cancellations.
 *
 * @param completed Number of successfully completed bookings
 * @param cancelledByProvider Number of bookings cancelled by provider or no-shows
 * @param total Total bookings attempted
 * @returns Reliability score between 0 and 100
 */
export function calculateReliabilityScore(
  completed = 0,
  cancelledByProvider = 0,
  total = 0,
): number {
  if (total <= 0) {
    // New providers start with 95% default trust baseline
    return 95;
  }

  const validCompleted = Math.max(0, completed);
  const validTotal = Math.max(validCompleted, total);

  // Severe penalty for provider cancellations
  const cancellationPenalty = Math.min(50, cancelledByProvider * 5);
  const completionRatio = (validCompleted / validTotal) * 100;

  const score = Math.max(0, Math.min(100, completionRatio - cancellationPenalty));
  return Math.round(score * 10) / 10;
}

/**
 * Computes proximity factor [0.0, 1.0] from straight-line distance in km.
 * Closer providers receive higher proximity factors.
 * If distance is null (customer denied location), returns a neutral 0.5.
 */
export function calculateDistanceFactor(
  distanceKm: number | null | undefined,
  maxDecayKm: number = DEFAULT_RECOMMENDATION_CONFIG.maxDistanceDecayKm,
): number {
  if (distanceKm == null || !Number.isFinite(distanceKm)) {
    return 0.5; // Neutral midpoint when location is unknown
  }

  if (distanceKm <= 0) return 1.0;
  if (distanceKm >= maxDecayKm) return 0.05; // Base floor

  // Linear decay: 0 km -> 1.0, 25 km -> 0.5, 50 km -> 0.05
  const factor = 1 - (distanceKm / maxDecayKm) * 0.95;
  return Math.max(0.05, Math.min(1.0, factor));
}

/**
 * Determines whether a provider qualifies as "Newly Verified" for fair discovery boost.
 * Criteria: Approved verification status and fewer than 10 reviews.
 */
export function isNewlyVerifiedProvider(
  verificationStatus: string,
  reviewCount = 0,
  createdAt?: string,
): boolean {
  if (verificationStatus !== 'approved') return false;
  if (reviewCount >= 10) return false;

  // If createdAt is available, check if verified/created within the last 60 days
  if (createdAt) {
    const createdDate = new Date(createdAt);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    return createdDate >= sixtyDaysAgo;
  }

  return true;
}

/**
 * Computes a holistic multi-factor Recommendation Score (0–100) for ranking:
 * - 50% Bayesian Rating (Quality & Feedback volume)
 * - 25% Reliability Score (Fulfillments vs cancellations)
 * - 15% Verification (Credentials & licensure)
 * - 10% Distance Factor (Convenience & proximity)
 * + Fair New-Provider Exploration Boost (up to +8 points for newly verified practices)
 */
export function calculateRecommendationScore(params: {
  averageRating: number;
  reviewCount: number;
  verificationStatus: string;
  reliabilityScore?: number;
  distanceKm?: number | null;
  createdAt?: string;
  config?: Partial<RecommendationConfig>;
}): {
  recommendationScore: number;
  weightedRating: number;
  reliabilityScore: number;
  isNewProvider: boolean;
} {
  const cfg = { ...DEFAULT_RECOMMENDATION_CONFIG, ...params.config };

  const weightedRating = calculateBayesianRating(
    params.averageRating,
    params.reviewCount,
    cfg.platformAverageRating,
    cfg.minReviewsThreshold,
  );

  const reliability =
    params.reliabilityScore != null
      ? params.reliabilityScore
      : calculateReliabilityScore(params.reviewCount, 0, params.reviewCount);

  const isVerified = params.verificationStatus === 'approved';
  const verificationScore = isVerified ? 1.0 : 0.0;

  const distanceFactor = calculateDistanceFactor(params.distanceKm, cfg.maxDistanceDecayKm);

  const isNew = isNewlyVerifiedProvider(
    params.verificationStatus,
    params.reviewCount,
    params.createdAt,
  );

  // Normalized score components [0, 1]
  const ratingNorm = weightedRating / 5.0;
  const reliabilityNorm = reliability / 100.0;
  const newBoost = isNew ? cfg.newProviderBoost : 0;

  const rawScore =
    cfg.weightBayesian * ratingNorm +
    cfg.weightReliability * reliabilityNorm +
    cfg.weightVerification * verificationScore +
    cfg.weightDistance * distanceFactor +
    newBoost;

  // Clamp and format to 0–100 scale
  const finalScore = Math.round(Math.min(100, Math.max(0, rawScore * 100)) * 10) / 10;

  return {
    recommendationScore: finalScore,
    weightedRating,
    reliabilityScore: reliability,
    isNewProvider: isNew,
  };
}
