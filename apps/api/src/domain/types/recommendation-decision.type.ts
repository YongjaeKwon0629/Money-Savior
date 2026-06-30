import type {
  SavingGoal,
  SavingPreference,
} from '../../common/types/financial-input.type';

export type SavingsCapacityLevel = 'DEFICIT' | 'LOW' | 'MID' | 'HIGH';
export type EmergencyFundStatus = 'NONE' | 'INSUFFICIENT' | 'SUFFICIENT';
export type RecommendationType =
  | 'EXPENSE_CONTROL'
  | 'LIQUIDITY_FIRST'
  | 'STABLE_SAVING'
  | 'BALANCED_SAVING'
  | 'DIVERSIFIED_ALLOCATION';

export interface RecommendationDecision {
  savingsCapacityLevel: SavingsCapacityLevel;
  emergencyFundStatus: EmergencyFundStatus;
  recommendedType: RecommendationType;
  parkingAccountAmount: number;
  installmentSavingsAmount: number;
  isaAmount: number;
  investmentAmount: number;
}

export interface RecommendationInput {
  monthlyIncome: number;
  savingGoal: SavingGoal;
  savingPreference: SavingPreference;
  surplusAmount: number;
  emergencyFundRatio: number;
  recommendedSavingAmount: number;
}
