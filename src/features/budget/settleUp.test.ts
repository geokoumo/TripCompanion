import { describe, expect, it } from 'vitest';
import { computeNetBalances, computeSettleUp, minimizePayments } from './lib/settleUp';

describe('settleUp', () => {
  it('handles a simple 2-person case', () => {
    const balances = computeNetBalances(['A', 'B'], [
      { amountHome: 100, paidBy: 'A', splitAmong: ['A', 'B'] },
    ]);
    expect(balances).toEqual({ A: 50, B: -50 });
    const payments = minimizePayments(balances);
    expect(payments).toEqual([{ from: 'B', to: 'A', amount: 50 }]);
  });

  it('handles a 3+ person case with a minimal payment plan', () => {
    // A pays 90 split among A,B,C (30 each). B pays 30 split among A,B,C (10 each).
    const expenses = [
      { amountHome: 90, paidBy: 'A', splitAmong: ['A', 'B', 'C'] },
      { amountHome: 30, paidBy: 'B', splitAmong: ['A', 'B', 'C'] },
    ];
    const { balances, payments } = computeSettleUp(['A', 'B', 'C'], expenses);
    // A paid 90, owes 40 total (30+10) => net +50
    // B paid 30, owes 40 total (30+10) => net -10
    // C paid 0, owes 40 total (30+10) => net -40
    expect(balances).toEqual({ A: 50, B: -10, C: -40 });
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    expect(total).toBe(50);
    expect(payments.length).toBeLessThanOrEqual(2);
  });

  it('handles uneven splits correctly', () => {
    const balances = computeNetBalances(['A', 'B', 'C'], [
      { amountHome: 100, paidBy: 'A', splitAmong: ['B', 'C'] },
    ]);
    expect(balances).toEqual({ A: 100, B: -50, C: -50 });
  });

  it('produces no payments when everyone is already settled', () => {
    const balances = computeNetBalances(['A', 'B'], [
      { amountHome: 50, paidBy: 'A', splitAmong: ['A', 'B'] },
      { amountHome: 50, paidBy: 'B', splitAmong: ['A', 'B'] },
    ]);
    expect(balances).toEqual({ A: 0, B: 0 });
    expect(minimizePayments(balances)).toEqual([]);
  });

  it('does not lose a cent to rounding drift on a 3-way split that does not divide evenly', () => {
    // €100 / 3 = €33.3333... — rounding each balance independently gives
    // {A: 66.67, B: -33.33, C: -33.33}, which sums to €100.01, not €100,
    // leaving A one cent short of what the payments actually cover.
    const { balances, payments } = computeSettleUp(['A', 'B', 'C'], [
      { amountHome: 100, paidBy: 'A', splitAmong: ['A', 'B', 'C'] },
    ]);

    const balanceSum = Object.values(balances).reduce((sum, b) => sum + b, 0);
    expect(balanceSum).toBeCloseTo(0, 9);

    const remainingBalanceById: Record<string, number> = {};
    let remainingTotal = 0;
    for (const [id, balance] of Object.entries(balances)) {
      const paid = payments.filter((p) => p.from === id).reduce((s, p) => s + p.amount, 0);
      const received = payments.filter((p) => p.to === id).reduce((s, p) => s + p.amount, 0);
      const remaining = balance + paid - received;
      remainingBalanceById[id] = remaining;
      remainingTotal += remaining;
    }

    // Nobody is left owing or being owed a stray fraction of a cent.
    for (const remaining of Object.values(remainingBalanceById)) {
      expect(remaining).toBeCloseTo(0, 9);
    }
    expect(remainingTotal).toBeCloseTo(0, 9);

    // A fronted the whole €100 and is owed back everyone else's share
    // (€66.67). The payments plus whatever's left outstanding must add up
    // to exactly that — not €66.66, which is where the old per-balance
    // rounding silently left A one cent short.
    const paymentsToA = payments.filter((p) => p.to === 'A').reduce((sum, p) => sum + p.amount, 0);
    expect(paymentsToA + remainingBalanceById.A!).toBeCloseTo(balances.A!, 9);
    expect(balances.A).toBe(66.67);

    // And the original €100 is fully accounted for: A's own share
    // (never needs to move) plus what the payments move back to A.
    const aOwnShare = 100 - balances.A!;
    expect(aOwnShare + paymentsToA + remainingTotal).toBeCloseTo(100, 9);
  });
});
