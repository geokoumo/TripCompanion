import { z } from 'zod';
import { CATEGORY_COLORS } from '../../config/constants';
import { nullableOptional } from '../../shared/lib/zodHelpers';

export const BudgetCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  color: z.enum(CATEGORY_COLORS),
});

export type BudgetCategory = z.infer<typeof BudgetCategorySchema>;

export const ExpenseSchema = z
  .object({
    id: z.string(),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().min(1),
    exchangeRateToHome: nullableOptional(z.number().positive()),
    categoryId: z.string().min(1, 'Category is required'),
    date: z.string().min(1, 'Date is required'),
    note: nullableOptional(z.string()),
    link: nullableOptional(z.string()),
    paidBy: z.string().min(1, 'Payer is required'),
    splitAmong: z.array(z.string()).min(1, 'Select at least one traveler'),
  });

export type Expense = z.infer<typeof ExpenseSchema>;
