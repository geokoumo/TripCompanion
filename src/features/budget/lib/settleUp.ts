export interface SettleUpExpense {
  amountHome: number; // already converted to home currency
  paidBy: string;
  splitAmong: string[];
}

export interface Payment {
  from: string;
  to: string;
  amount: number;
}

/** Rounds to cents to avoid floating point dust. Normalizes -0 to 0 so equality checks behave. */
function round2(n: number): number {
  return Math.round(n * 100) / 100 || 0;
}

/**
 * Rounds every balance to cents while keeping the whole set summing to
 * exactly zero. Rounding each balance independently can otherwise leave a
 * sub-cent shortfall or surplus — e.g. a 3-way split of €100 gives raw
 * balances of +66.6̄/-33.3̄/-33.3̄, which round independently to
 * 66.67/-33.33/-33.33 (sums to €100.01, not €100). Instead, every balance
 * but the last is rounded normally; the last traveler absorbs whatever
 * sub-cent remainder is left, so the rounded set always sums to zero and no
 * money is created or lost.
 */
function roundBalancesPreservingTotal(raw: Record<string, number>, order: string[]): Record<string, number> {
  const rounded: Record<string, number> = {};
  if (order.length === 0) return rounded;
  if (order.length === 1) {
    rounded[order[0]!] = round2(raw[order[0]!] ?? 0);
    return rounded;
  }

  let runningTotal = 0;
  for (let i = 0; i < order.length - 1; i++) {
    const id = order[i]!;
    const value = round2(raw[id] ?? 0);
    rounded[id] = value;
    runningTotal += value;
  }
  const lastId = order[order.length - 1]!;
  rounded[lastId] = round2(-runningTotal);
  return rounded;
}

/**
 * Computes each traveler's net balance in home currency: positive means
 * they are owed money, negative means they owe money. Rounding happens once,
 * here, at the point balances are finalized — never per-item while
 * accumulating — so the set of balances always sums to exactly zero.
 */
export function computeNetBalances(
  travelerIds: string[],
  expenses: SettleUpExpense[],
): Record<string, number> {
  const raw: Record<string, number> = Object.fromEntries(travelerIds.map((id) => [id, 0]));

  for (const expense of expenses) {
    const share = expense.amountHome / expense.splitAmong.length;
    raw[expense.paidBy] = (raw[expense.paidBy] ?? 0) + expense.amountHome;
    for (const debtor of expense.splitAmong) {
      raw[debtor] = (raw[debtor] ?? 0) - share;
    }
  }

  return roundBalancesPreservingTotal(raw, travelerIds);
}

/**
 * Debt-simplification: given net balances, computes the minimum set of
 * payments that settles everyone up. Greedily matches the largest creditor
 * with the largest debtor until all balances are (near) zero.
 */
export function minimizePayments(balances: Record<string, number>): Payment[] {
  const EPSILON = 0.005;
  const creditors = Object.entries(balances)
    .filter(([, amount]) => amount > EPSILON)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = Object.entries(balances)
    .filter(([, amount]) => amount < -EPSILON)
    .map(([id, amount]) => ({ id, amount: -amount }))
    .sort((a, b) => b.amount - a.amount);

  const payments: Payment[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]!;
    const creditor = creditors[j]!;
    const amount = round2(Math.min(debtor.amount, creditor.amount));

    if (amount > EPSILON) {
      payments.push({ from: debtor.id, to: creditor.id, amount });
    }

    debtor.amount = round2(debtor.amount - amount);
    creditor.amount = round2(creditor.amount - amount);

    if (debtor.amount <= EPSILON) i++;
    if (creditor.amount <= EPSILON) j++;
  }

  return payments;
}

export function computeSettleUp(travelerIds: string[], expenses: SettleUpExpense[]) {
  const balances = computeNetBalances(travelerIds, expenses);
  const payments = minimizePayments(balances);
  return { balances, payments };
}
