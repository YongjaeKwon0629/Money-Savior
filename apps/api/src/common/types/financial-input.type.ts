import type {
  SAVING_GOALS,
  SAVING_PREFERENCES,
} from '../constants/finance.constants';

export type SavingGoal = (typeof SAVING_GOALS)[keyof typeof SAVING_GOALS];
export type SavingPreference =
  (typeof SAVING_PREFERENCES)[keyof typeof SAVING_PREFERENCES];

export interface CreateFinancialInputRequest {
  targetMonth: string;
  monthlyIncome: number;
  paydayDay: number;
  fixedExpense: number;
  variableExpense: number;
  emergencyFundAmount: number;
  savingGoal: SavingGoal;
  savingPreference: SavingPreference;
}
