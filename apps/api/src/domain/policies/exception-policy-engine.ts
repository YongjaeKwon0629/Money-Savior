import { Injectable } from '@nestjs/common';
import {
  ExceptionPolicyInput,
  ExceptionPolicyResult,
} from '../types/exception-policy.type';
import { RecommendationDecision } from '../types/recommendation-decision.type';

@Injectable()
export class ExceptionPolicyEngine {
  apply(input: ExceptionPolicyInput): ExceptionPolicyResult {
    const { calculationResult, recommendationDecision, savingPreference } = input;

    if (calculationResult.surplusAmount <= 0) {
      return {
        exceptionCode: 'EX-01',
        cautionMessages: [
          '현재는 신규 저축 확대보다 지출 구조 조정이 우선입니다.',
          '이번 달은 고정비와 생활비를 먼저 점검한 후 저축 계획을 다시 설정하는 것이 적절합니다.',
        ],
        adjustedRecommendation: {
          ...recommendationDecision,
          recommendedType: 'EXPENSE_CONTROL',
          parkingAccountAmount: 0,
          installmentSavingsAmount: 0,
          isaAmount: 0,
          investmentAmount: 0,
        },
      };
    }

    if (calculationResult.emergencyFundRatio <= 0) {
      return {
        exceptionCode: 'EX-03',
        cautionMessages: [
          '현재는 비상 상황에 대응할 수 있는 자금이 없어 유동성 확보가 가장 중요합니다.',
          '단기 운용보다 먼저 바로 쓸 수 있는 비상금을 마련하는 것이 적절합니다.',
        ],
        adjustedRecommendation: {
          ...recommendationDecision,
          recommendedType: 'LIQUIDITY_FIRST',
          parkingAccountAmount: recommendationDecision.parkingAccountAmount +
            recommendationDecision.installmentSavingsAmount +
            recommendationDecision.isaAmount +
            recommendationDecision.investmentAmount,
          installmentSavingsAmount: 0,
          isaAmount: 0,
          investmentAmount: 0,
        },
      };
    }

    if (calculationResult.fixedExpenseRatio >= 50) {
      return {
        exceptionCode: 'EX-02',
        cautionMessages: [
          '고정비 비중이 높아 저축 여력이 제한되고 있습니다.',
          '반복 지출을 먼저 조정하면 더 안정적인 저축 구조를 만들 수 있습니다.',
        ],
        adjustedRecommendation: this.toStableAllocation(recommendationDecision),
      };
    }

    if (calculationResult.emergencyFundRatio < 100) {
      return {
        exceptionCode: 'EX-04',
        cautionMessages: [
          '비상금이 아직 목표 수준에 도달하지 않았습니다.',
          '현재는 저축과 함께 유동성 확보를 병행하는 구조가 적절합니다.',
        ],
        adjustedRecommendation: recommendationDecision.recommendedType ===
          'DIVERSIFIED_ALLOCATION'
          ? this.toBalancedAllocation(recommendationDecision)
          : recommendationDecision,
      };
    }

    if (
      savingPreference === 'AGGRESSIVE' &&
      (recommendationDecision.savingsCapacityLevel === 'LOW' ||
        recommendationDecision.emergencyFundStatus !== 'SUFFICIENT')
    ) {
      return {
        exceptionCode: 'EX-06',
        cautionMessages: [
          '현재 성향은 적극형이지만, 현금흐름과 비상금 상태를 고려하면 보수적 운영이 더 적절합니다.',
          '자금 여력이 안정되면 점진적으로 운용 비중을 확대할 수 있습니다.',
        ],
        adjustedRecommendation: this.toBalancedAllocation(recommendationDecision),
      };
    }

    return {
      exceptionCode: null,
      cautionMessages: [],
      adjustedRecommendation: recommendationDecision,
    };
  }

  private toStableAllocation(
    decision: RecommendationDecision,
  ): RecommendationDecision {
    const total =
      decision.parkingAccountAmount +
      decision.installmentSavingsAmount +
      decision.isaAmount +
      decision.investmentAmount;

    return {
      ...decision,
      recommendedType: 'STABLE_SAVING',
      parkingAccountAmount: Math.floor(total * 0.3),
      installmentSavingsAmount: total - Math.floor(total * 0.3),
      isaAmount: 0,
      investmentAmount: 0,
    };
  }

  private toBalancedAllocation(
    decision: RecommendationDecision,
  ): RecommendationDecision {
    const total =
      decision.parkingAccountAmount +
      decision.installmentSavingsAmount +
      decision.isaAmount +
      decision.investmentAmount;
    const parkingAccountAmount = Math.floor(total * 0.2);
    const isaAmount = Math.floor(total * 0.3);

    return {
      ...decision,
      recommendedType: 'BALANCED_SAVING',
      parkingAccountAmount,
      installmentSavingsAmount: total - parkingAccountAmount - isaAmount,
      isaAmount,
      investmentAmount: 0,
    };
  }
}
