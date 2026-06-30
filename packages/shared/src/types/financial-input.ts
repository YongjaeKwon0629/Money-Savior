import type { SavingGoal } from '../enums/saving-goal';
import type { SavingPreference } from '../enums/saving-preference';

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
