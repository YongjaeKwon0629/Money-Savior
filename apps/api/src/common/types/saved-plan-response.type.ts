export interface SavedPlanResponseData {
  planId: number;
  inputId: number;
  recommendationId: number;
  targetMonth: string;
  recommendedType:
    | 'EXPENSE_CONTROL'
    | 'LIQUIDITY_FIRST'
    | 'STABLE_SAVING'
    | 'BALANCED_SAVING'
    | 'DIVERSIFIED_ALLOCATION';
  recommendedSavingAmount: number;
  surplusAmount: number;
  savedAt: string;
}
