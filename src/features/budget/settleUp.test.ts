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
});
