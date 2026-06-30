import type { LedgerEntryType } from '@prisma/client';

export type LedgerEntryResponseData = {
  entryId: number;
  targetMonth: string;
  entryDate: string;
  type: LedgerEntryType;
  category: string;
  amount: number;
  memo: string | null;
  isFixed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LedgerSummaryResponseData = {
  targetMonth: string;
  totals: {
    income: number;
    expense: number;
    fixedExpense: number;
    variableExpense: number;
    balance: number;
  };
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  entryCount: number;
};
