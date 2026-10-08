/** Expense API: /api/expenses */
import { createRecordService } from './createRecordService';

export const expenseService = createRecordService('/expenses');
