import { describe, it, expect } from 'vitest';

export interface DynamicPricingRule {
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  startHour: number; // 0-23
  endHour: number;   // 0-23
  adjustmentPercent: number; // e.g. -20 for 20% discount, +15 for 15% surge
}

export function computeDynamicPrice(
  basePricePaisa: number,
  targetDate: Date,
  rules: DynamicPricingRule[],
  floorPricePaisa?: number,
  ceilingPricePaisa?: number
): { finalPricePaisa: number; appliedAdjustmentPercent: number; tag: string } {
  const day = targetDate.getDay();
  const hour = targetDate.getHours();

  const matchingRule = rules.find(
    r => r.dayOfWeek === day && hour >= r.startHour && hour < r.endHour
  );

  if (!matchingRule) {
    return {
      finalPricePaisa: basePricePaisa,
      appliedAdjustmentPercent: 0,
      tag: 'Standard Base Price',
    };
  }

  const multiplier = 1 + matchingRule.adjustmentPercent / 100;
  let computed = Math.round(basePricePaisa * multiplier);

  if (floorPricePaisa !== undefined && computed < floorPricePaisa) {
    computed = floorPricePaisa;
  }
  if (ceilingPricePaisa !== undefined && computed > ceilingPricePaisa) {
    computed = ceilingPricePaisa;
  }

  const tag =
    matchingRule.adjustmentPercent < 0
      ? `Off-Peak Saver (${Math.abs(matchingRule.adjustmentPercent)}% Off)`
      : `Peak Demand (+${matchingRule.adjustmentPercent}%)`;

  return {
    finalPricePaisa: computed,
    appliedAdjustmentPercent: matchingRule.adjustmentPercent,
    tag,
  };
}

describe('Dynamic Yield Pricing Engine', () => {
  const sampleRules: DynamicPricingRule[] = [
    { dayOfWeek: 2, startHour: 13, endHour: 16, adjustmentPercent: -20 }, // Tue 1-4 PM 20% Off
    { dayOfWeek: 0, startHour: 10, endHour: 14, adjustmentPercent: 15 },  // Sun 10AM-2PM 15% Surge
  ];

  it('applies standard price during normal non-matching hours', () => {
    // Wednesday 11:00 AM
    const wednesdayDate = new Date('2026-11-04T11:00:00');
    const result = computeDynamicPrice(100000, wednesdayDate, sampleRules);

    expect(result.finalPricePaisa).toBe(100000);
    expect(result.appliedAdjustmentPercent).toBe(0);
    expect(result.tag).toBe('Standard Base Price');
  });

  it('applies 20% off-peak discount on Tuesday 2:00 PM', () => {
    // Tuesday 2:00 PM
    const tuesdayDate = new Date('2026-11-03T14:00:00');
    const result = computeDynamicPrice(150000, tuesdayDate, sampleRules); // base ₹1,500

    expect(result.finalPricePaisa).toBe(120000); // ₹1,200 (20% off)
    expect(result.appliedAdjustmentPercent).toBe(-20);
    expect(result.tag).toContain('20% Off');
  });

  it('applies 15% surge pricing on Sunday peak hours', () => {
    // Sunday 11:30 AM
    const sundayDate = new Date('2026-11-08T11:30:00');
    const result = computeDynamicPrice(200000, sundayDate, sampleRules); // base ₹2,000

    expect(result.finalPricePaisa).toBe(230000); // ₹2,300 (+15%)
    expect(result.appliedAdjustmentPercent).toBe(15);
    expect(result.tag).toContain('+15%');
  });

  it('respects floor price boundaries during aggressive discounts', () => {
    const aggressiveRule: DynamicPricingRule[] = [
      { dayOfWeek: 1, startHour: 9, endHour: 12, adjustmentPercent: -50 }, // 50% off
    ];
    const mondayDate = new Date('2026-11-02T10:00:00');
    const floor = 80000; // minimum ₹800

    const result = computeDynamicPrice(100000, mondayDate, aggressiveRule, floor);
    expect(result.finalPricePaisa).toBe(80000); // Clamped to floor rather than ₹500
  });
});
