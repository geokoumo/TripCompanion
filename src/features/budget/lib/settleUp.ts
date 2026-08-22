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

/** Rounds to cents to avoid floating point dust. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Computes each traveler's net balance in home currency: positive means
 * they are owed money, negative means they owe money.
 */
export function computeNetBalances(
  travelerIds: string[],
  expenses: SettleUpExpense[],
): Record<string, number> {
  const balances: Record<string, number> = Object.fromEntries(travelerIds.map((id) => [id, 0]));

  for (const expense of expenses) {
    const share = expense.amountHome / expense.splitAmong.length;
    balances[expense.paidBy] = (balances[expense.paidBy] ?? 0) + expense.amountHome;
    for (const debtor of expense.splitAmong) {
      balances[debtor] = (balances[debtor] ?? 0) - share;
    }
  }

  for (const id of Object.keys(balances)) {
    balances[id] = round2(balances[id]!);
  }
  return balances;
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
