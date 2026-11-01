import { describe, it, expect } from 'vitest';

export interface BookingSlot {
  start: Date;
  end: Date;
}

export function hasSlotConflict(newSlot: BookingSlot, existingSlots: BookingSlot[]): boolean {
  const newStart = newSlot.start.getTime();
  const newEnd = newSlot.end.getTime();

  return existingSlots.some(existing => {
    const existStart = existing.start.getTime();
    const existEnd = existing.end.getTime();
    // Overlap condition: start < otherEnd && end > otherStart
    return newStart < existEnd && newEnd > existStart;
  });
}

export function computeCancellationRefund(
  totalPaidPaisa: number,
  scheduledStartTime: Date,
  cancellationTime: Date,
  freeCancellationHours = 2
): { refundPaisa: number; penaltyPaisa: number; policyApplied: string } {
  const hoursUntilAppointment =
    (scheduledStartTime.getTime() - cancellationTime.getTime()) / (1000 * 60 * 60);

  if (hoursUntilAppointment >= freeCancellationHours) {
    // 100% refund
    return {
      refundPaisa: totalPaidPaisa,
      penaltyPaisa: 0,
      policyApplied: 'Free Cancellation (Full Refund)',
    };
  }

  // Late cancellation: 30% retained as provider reservation fee, 70% refunded
  const penaltyPaisa = Math.round(totalPaidPaisa * 0.3);
  const refundPaisa = totalPaidPaisa - penaltyPaisa;

  return {
    refundPaisa,
    penaltyPaisa,
    policyApplied: 'Late Cancellation Window (70% Refund)',
  };
}

describe('Booking Conflict & Cancellation Policy Engine', () => {
  describe('Double-Booking Prevention', () => {
    const existingAppointments: BookingSlot[] = [
      {
        start: new Date('2026-11-03T10:00:00Z'),
        end: new Date('2026-11-03T10:30:00Z'),
      },
      {
        start: new Date('2026-11-03T11:00:00Z'),
        end: new Date('2026-11-03T11:45:00Z'),
      },
    ];

    it('detects direct slot conflict', () => {
      const conflictingSlot: BookingSlot = {
        start: new Date('2026-11-03T10:15:00Z'),
        end: new Date('2026-11-03T10:45:00Z'),
      };
      expect(hasSlotConflict(conflictingSlot, existingAppointments)).toBe(true);
    });

    it('detects slot that completely engulfs an existing appointment', () => {
      const engulfingSlot: BookingSlot = {
        start: new Date('2026-11-03T09:50:00Z'),
        end: new Date('2026-11-03T10:40:00Z'),
      };
      expect(hasSlotConflict(engulfingSlot, existingAppointments)).toBe(true);
    });

    it('allows clean non-overlapping slot', () => {
      const freeSlot: BookingSlot = {
        start: new Date('2026-11-03T10:30:00Z'),
        end: new Date('2026-11-03T11:00:00Z'),
      };
      expect(hasSlotConflict(freeSlot, existingAppointments)).toBe(false);
    });
  });

  describe('Cancellation Refund Calculations', () => {
    const appointmentTime = new Date('2026-11-03T14:00:00Z');
    const totalPaid = 150000; // ₹1,500

    it('issues 100% refund when cancelled >2 hours prior to scheduled visit', () => {
      const earlyCancelTime = new Date('2026-11-03T10:00:00Z'); // 4 hours before
      const result = computeCancellationRefund(totalPaid, appointmentTime, earlyCancelTime);

      expect(result.refundPaisa).toBe(150000);
      expect(result.penaltyPaisa).toBe(0);
      expect(result.policyApplied).toContain('Full Refund');
    });

    it('deducts 30% provider reservation fee for late cancellations within 2 hours', () => {
      const lateCancelTime = new Date('2026-11-03T13:00:00Z'); // 1 hour before
      const result = computeCancellationRefund(totalPaid, appointmentTime, lateCancelTime);

      expect(result.penaltyPaisa).toBe(45000); // 30% of ₹1,500 = ₹450
      expect(result.refundPaisa).toBe(105000); // 70% of ₹1,500 = ₹1,050
      expect(result.policyApplied).toContain('Late Cancellation Window');
    });
  });
});
