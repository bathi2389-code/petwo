import { describe, expect, it } from 'vitest';
import {
  calculateBayesianRating,
  calculateDistanceFactor,
  calculateRecommendationScore,
} from './recommendation';

describe('Provider recommendation scoring', () => {
  it('uses the platform baseline when there are no published reviews', () => {
    expect(calculateBayesianRating(0, 0)).toBe(4);
  });

  it('confidence-adjusts a small number of reviews toward the platform baseline', () => {
    expect(calculateBayesianRating(5, 1)).toBe(4.09);
    expect(calculateBayesianRating(5, 100)).toBe(4.91);
  });

  it('does not treat review count as completed-booking reliability evidence', () => {
    const result = calculateRecommendationScore({
      averageRating: 4.8,
      reviewCount: 42,
      verificationStatus: 'approved',
    });
    expect(result.reliabilityScore).toBe(50);
  });

  it('uses verified reliability data when available and clamps it to 0..100', () => {
    const result = calculateRecommendationScore({
      averageRating: 4.5,
      reviewCount: 12,
      verificationStatus: 'approved',
      reliabilityScore: 120,
    });
    expect(result.reliabilityScore).toBe(100);
  });

  it('uses neutral proximity when customer location is unavailable', () => {
    expect(calculateDistanceFactor(null)).toBe(0.5);
  });

  it('keeps recommendation scores within the documented range', () => {
    const result = calculateRecommendationScore({
      averageRating: 5,
      reviewCount: 1000,
      verificationStatus: 'approved',
      reliabilityScore: 100,
      distanceKm: 0,
      config: { newProviderBoost: 100 },
    });
    expect(result.recommendationScore).toBeLessThanOrEqual(100);
    expect(result.recommendationScore).toBeGreaterThanOrEqual(0);
  });
});
