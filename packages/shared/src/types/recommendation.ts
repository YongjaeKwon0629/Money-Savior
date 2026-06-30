export type RecommendationActionType =
  | 'SAVE_PLAN'
  | 'RETRY_DIAGNOSIS'
  | 'EDIT_INPUT';

export interface RecommendationAction {
  type: RecommendationActionType;
  label: string;
}

export interface RecommendationSummary {
  monthlyIncome: number;
  fixedExpense: number;
  variableExpense: number;
  surplusAmount: number;
  emergencyFundStatus: 'NONE' | 'INSUFFICIENT' | 'SUFFICIENT';
}

export interface RecommendationSavingAmounts {
  safe: number;
  recommended: number;
  challenge: number;
}

export interface RecommendationAllocation {
  type:
    | 'EXPENSE_CONTROL'
    | 'LIQUIDITY_FIRST'
    | 'STABLE_SAVING'
    | 'BALANCED_SAVING'
    | 'DIVERSIFIED_ALLOCATION';
  parkingAccountAmount: number;
  installmentSavingsAmount: number;
  isaAmount: number;
  investmentAmount: number;
}

export interface RecommendationResponseData {
  inputId: number;
  recommendationId: number;
  targetMonth: string;
  summary: RecommendationSummary;
  savingAmounts: RecommendationSavingAmounts;
  recommendation: RecommendationAllocation;
  reasons: string[];
  cautions: string[];
  actions: RecommendationAction[];
}
