import { Injectable } from '@nestjs/common';
import type {
  SavingGoal,
  SavingPreference,
} from '../../common/types/financial-input.type';
import type { RecommendationAction } from '../../common/types/recommendation-response.type';
import type {
  RecommendationContentInput,
  RecommendationContentResult,
} from '../types/recommendation-content.type';
import type {
  EmergencyFundStatus,
  RecommendationType,
  SavingsCapacityLevel,
} from '../types/recommendation-decision.type';

@Injectable()
export class RecommendationActionFactory {
  create(input: RecommendationContentInput): RecommendationContentResult {
    const reasons = [
      this.getSavingsCapacityReason(
        input.recommendationDecision.savingsCapacityLevel,
      ),
      this.getEmergencyFundReason(
        input.recommendationDecision.emergencyFundStatus,
      ),
      this.getPreferenceReason(
        input.savingGoal,
        input.savingPreference,
        input.recommendationDecision.recommendedType,
      ),
    ];

    return {
      reasons,
      actions: this.getActions(
        input.recommendationDecision.recommendedType,
        input.exceptionCode,
      ),
    };
  }

  private getSavingsCapacityReason(level: SavingsCapacityLevel): string {
    switch (level) {
      case 'DEFICIT':
        return '현재는 잉여자금이 부족해 신규 저축보다 지출 구조 조정이 우선입니다.';
      case 'LOW':
        return '월 잉여자금이 크지 않아 무리하지 않는 범위에서 저축하는 편이 적절합니다.';
      case 'MID':
        return '월 잉여자금이 안정적으로 확보되어 계획형 저축 운영이 가능합니다.';
      case 'HIGH':
        return '월 잉여자금 여력이 충분해 분산형 저축 운영까지 검토할 수 있습니다.';
    }
  }

  private getEmergencyFundReason(status: EmergencyFundStatus): string {
    switch (status) {
      case 'NONE':
        return '현재 비상금이 없어 바로 쓸 수 있는 유동성 확보가 가장 우선입니다.';
      case 'INSUFFICIENT':
        return '비상금이 아직 목표 수준에 도달하지 않아 유동성 확보를 병행해야 합니다.';
      case 'SUFFICIENT':
        return '비상금이 일정 수준 확보되어 다음 단계 저축 운영으로 확장할 수 있습니다.';
    }
  }

  private getPreferenceReason(
    goal: SavingGoal,
    preference: SavingPreference,
    type: RecommendationType,
  ): string {
    if (type === 'EXPENSE_CONTROL') {
      return '이번 달은 저축 확대보다 현금흐름 회복과 지출 재정비가 더 중요합니다.';
    }

    if (type === 'LIQUIDITY_FIRST') {
      return '현재는 바로 사용할 수 있는 자금을 먼저 확보하는 방향이 더 적절합니다.';
    }

    if (goal === 'EMERGENCY_FUND') {
      return '비상금 확보 목표를 반영해 단기 유동성을 우선하는 방식으로 추천합니다.';
    }

    if (goal === 'LIFE_STABILITY') {
      return '생활 안정 목표를 반영해 안정 저축과 분산 운용을 균형 있게 배분합니다.';
    }

    if (goal === 'TRAVEL') {
      return '여행 같은 중기 목표에는 계획적으로 모아가는 저축 구조가 잘 맞습니다.';
    }

    if (goal === 'HOUSING_MARRIAGE') {
      return '주거 또는 결혼 준비에는 목적 자금을 꾸준히 쌓는 안정적 구조가 적절합니다.';
    }

    if (goal === 'INVESTMENT_PREP') {
      return preference === 'AGGRESSIVE'
        ? '투자 준비 목표와 공격형 성향을 반영해 성장 가능성도 고려한 구조를 제안합니다.'
        : '투자 준비 목표를 반영하되 변동성이 과도하지 않도록 조정한 구조를 추천합니다.';
    }

    return '입력한 목표와 성향, 현재 현금흐름에 맞는 저축 방식을 추천합니다.';
  }

  private getActions(
    type: RecommendationType,
    exceptionCode: string | null,
  ): RecommendationAction[] {
    if (type === 'EXPENSE_CONTROL' || exceptionCode === 'EX-01') {
      return [
        { type: 'EDIT_INPUT', label: '지출 다시 점검하기' },
        { type: 'RETRY_DIAGNOSIS', label: '다시 진단하기' },
      ];
    }

    return [
      { type: 'SAVE_PLAN', label: '추천 계획 저장하기' },
      { type: 'RETRY_DIAGNOSIS', label: '다시 진단하기' },
    ];
  }
}
