import { z } from 'zod';
import { CATEGORY_COLORS } from '../../config/constants';

export const BudgetCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Το όνομα είναι υποχρεωτικό'),
  color: z.enum(CATEGORY_COLORS),
  limit: z.number().nonnegative().optional(),
});

export type BudgetCategory = z.infer<typeof BudgetCategorySchema>;

export const ExpenseSchema = z
  .object({
    id: z.string(),
    amount: z.number().positive('Το ποσό πρέπει να είναι θετικό'),
    currency: z.string().min(1),
    exchangeRateToHome: z.number().positive().optional(),
    categoryId: z.string().min(1, 'Η κατηγορία είναι υποχρεωτική'),
    date: z.string().min(1, 'Η ημερομηνία είναι υποχρεωτική'),
    note: z.string().optional(),
    link: z.string().optional(),
    paidBy: z.string().min(1, 'Ο πληρωτής είναι υποχρεωτικός'),
    splitAmong: z.array(z.string()).min(1, 'Επίλεξε τουλάχιστον έναν ταξιδιώτη'),
  });

export type Expense = z.infer<typeof ExpenseSchema>;
