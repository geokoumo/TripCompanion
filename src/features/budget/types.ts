import { z } from 'zod';
import { CATEGORY_COLORS } from '../../config/constants';
import { nullableOptional } from '../../shared/lib/zodHelpers';

export const BudgetCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Το όνομα είναι υποχρεωτικό'),
  color: z.enum(CATEGORY_COLORS),
});

export type BudgetCategory = z.infer<typeof BudgetCategorySchema>;

export const ExpenseSchema = z
  .object({
    id: z.string(),
    amount: z.number().positive('Το ποσό πρέπει να είναι θετικό'),
    currency: z.string().min(1),
    exchangeRateToHome: nullableOptional(z.number().positive()),
    categoryId: z.string().min(1, 'Η κατηγορία είναι υποχρεωτική'),
    date: z.string().min(1, 'Η ημερομηνία είναι υποχρεωτική'),
    note: nullableOptional(z.string()),
    link: nullableOptional(z.string()),
    paidBy: z.string().min(1, 'Ο πληρωτής είναι υποχρεωτικός'),
    splitAmong: z.array(z.string()).min(1, 'Επίλεξε τουλάχιστον έναν ταξιδιώτη'),
  });

export type Expense = z.infer<typeof ExpenseSchema>;
