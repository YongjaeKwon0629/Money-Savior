import type { SavingPreference } from '../../common/types/financial-input.type';
import type { CalculationResult } from '../types/calculation-result.type';
import type { RecommendationDecision } from '../types/recommendation-decision.type';

export type ExceptionCode =
  | 'EX-01'
  | 'EX-02'
  | 'EX-03'
  | 'EX-04'
  | 'EX-06';

export interface ExceptionPolicyInput {
  savingPreference: SavingPreference;
  calculationResult: CalculationResult;
  recommendationDecision: RecommendationDecision;
}

export interface ExceptionPolicyResult {
  exceptionCode: ExceptionCode | null;
  cautionMessages: string[];
  adjustedRecommendation: RecommendationDecision;
}
