import { AvatarChip } from '../../../shared/components/AvatarChip';
import type { Trip } from '../../trips/types';
import { expenseAmountInHome } from '../lib/currency';
import { computeSettleUp } from '../lib/settleUp';
import styles from './SettleUpView.module.css';

export function SettleUpView({ trip }: { trip: Trip }) {
  const travelerIds = trip.travelers.map((t) => t.id);
  const expenses = trip.expenses.map((e) => ({
    amountHome: expenseAmountInHome(e, trip.homeCurrency),
    paidBy: e.paidBy,
    splitAmong: e.splitAmong,
  }));

  const { balances, payments } = computeSettleUp(travelerIds, expenses);

  if (trip.travelers.length === 0) {
    return <p style={{ color: 'var(--color-text-faint)', padding: '16px 0' }}>Πρόσθεσε ταξιδιώτες για να δεις την εξόφληση.</p>;
  }

  return (
    <div>
      {trip.travelers.map((traveler) => {
        const balance = balances[traveler.id] ?? 0;
        const sign = balance > 0.005 ? 'positive' : balance < -0.005 ? 'negative' : 'zero';
        return (
          <div key={traveler.id} className={styles.row}>
            <span className={styles.left}>
              <AvatarChip name={traveler.name} color={traveler.avatarColor} />
              {traveler.name}
            </span>
            <span>
              <span className={styles.balance} data-sign={sign}>
                {balance > 0 ? '+' : ''}
                {balance.toFixed(2)} {trip.homeCurrency}
              </span>
              <div className={styles.balanceNote}>{sign === 'positive' ? 'του χρωστάνε' : sign === 'negative' ? 'χρωστάει' : 'είναι στα ίσα'}</div>
            </span>
          </div>
        );
      })}

      {payments.length > 0 && (
        <>
          <div className={styles.sectionTitle}>Προτεινόμενες πληρωμές</div>
          {payments.map((payment, i) => {
            const from = trip.travelers.find((t) => t.id === payment.from);
            const to = trip.travelers.find((t) => t.id === payment.to);
            return (
              <div key={i} className={styles.paymentRow}>
                <span>
                  {from?.name} → {to?.name}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {payment.amount.toFixed(2)} {trip.homeCurrency}
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
