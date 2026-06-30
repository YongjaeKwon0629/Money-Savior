import type {
  SavingGoal,
  SavingPreference,
} from '../../common/types/financial-input.type';
import type { RecommendationAction } from '../../common/types/recommendation-response.type';
import type { CalculationResult } from './calculation-result.type';
import type { ExceptionCode } from './exception-policy.type';
import type { RecommendationDecision } from './recommendation-decision.type';

export interface RecommendationContentInput {
  savingGoal: SavingGoal;
  savingPreference: SavingPreference;
  calculationResult: CalculationResult;
  recommendationDecision: RecommendationDecision;
  exceptionCode: ExceptionCode | null;
}

export interface RecommendationContentResult {
  reasons: string[];
  actions: RecommendationAction[];
}
