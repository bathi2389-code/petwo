import { describe, it, expect } from 'vitest';

export function calculatePawRewards(spendingInPaisa: number): number {
  // 1 point for every ₹10 spent (1000 paisa)
  return Math.floor(spendingInPaisa / 1000);
}

export function determineTier(lifetimePoints: number): 'Silver' | 'Gold' | 'Platinum' {
  if (lifetimePoints >= 5000) return 'Platinum';
  if (lifetimePoints >= 1500) return 'Gold';
  return 'Silver';
}

export function validateVoucherRedemption(
  currentBalance: number,
  voucherCostPoints: number
): { valid: boolean; remainingBalance: number; error?: string } {
  if (currentBalance < voucherCostPoints) {
    return {
      valid: false,
      remainingBalance: currentBalance,
      error: 'Insufficient PawRewards points balance for redemption',
    };
  }
  return {
    valid: true,
    remainingBalance: currentBalance - voucherCostPoints,
  };
}

describe('PawRewards Loyalty Engine', () => {
  it('correctly calculates points earned from booking spending', () => {
    // ₹1,000 appointment = 100,000 paisa => 100 points
    expect(calculatePawRewards(100000)).toBe(100);

    // ₹2,450 full grooming = 245,000 paisa => 245 points
    expect(calculatePawRewards(245000)).toBe(245);

    // Below ₹10 (900 paisa) => 0 points
    expect(calculatePawRewards(900)).toBe(0);
  });

  it('determines customer tier accurately based on lifetime accumulated points', () => {
    expect(determineTier(500)).toBe('Silver');
    expect(determineTier(1499)).toBe('Silver');
    expect(determineTier(1500)).toBe('Gold');
    expect(determineTier(4999)).toBe('Gold');
    expect(determineTier(5000)).toBe('Platinum');
    expect(determineTier(12500)).toBe('Platinum');
  });

  it('validates voucher redemption against points balance', () => {
    // Sufficient balance
    const success = validateVoucherRedemption(1200, 500);
    expect(success.valid).toBe(true);
    expect(success.remainingBalance).toBe(700);
    expect(success.error).toBeUndefined();

    // Insufficient balance
    const failure = validateVoucherRedemption(350, 500);
    expect(failure.valid).toBe(false);
    expect(failure.remainingBalance).toBe(350);
    expect(failure.error).toBe('Insufficient PawRewards points balance for redemption');
  });
});
