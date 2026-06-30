import { Injectable } from '@nestjs/common';
import {
  EmergencyFundStatus,
  RecommendationDecision,
  RecommendationInput,
  RecommendationType,
  SavingsCapacityLevel,
} from '../types/recommendation-decision.type';

@Injectable()
export class RecommendationEngine {
  recommend(input: RecommendationInput): RecommendationDecision {
    const savingsCapacityLevel = this.resolveSavingsCapacityLevel(
      input.surplusAmount,
      input.monthlyIncome,
    );
    const emergencyFundStatus = this.resolveEmergencyFundStatus(
      input.emergencyFundRatio,
    );
    const recommendedType = this.resolveRecommendationType(
      savingsCapacityLevel,
      emergencyFundStatus,
      input.savingPreference,
    );

    return {
      savingsCapacityLevel,
      emergencyFundStatus,
      recommendedType,
      ...this.allocateAmounts(
        recommendedType,
        input.recommendedSavingAmount,
        input.savingGoal,
      ),
    };
  }

  private resolveSavingsCapacityLevel(
    surplusAmount: number,
    monthlyIncome: number,
  ): SavingsCapacityLevel {
    if (surplusAmount <= 0) {
      return 'DEFICIT';
    }

    const ratio = monthlyIncome === 0 ? 0 : (surplusAmount / monthlyIncome) * 100;

    if (ratio < 10) {
      return 'LOW';
    }

    if (ratio < 25) {
      return 'MID';
    }

    return 'HIGH';
  }

  private resolveEmergencyFundStatus(
    emergencyFundRatio: number,
  ): EmergencyFundStatus {
    if (emergencyFundRatio <= 0) {
      return 'NONE';
    }

    if (emergencyFundRatio < 100) {
      return 'INSUFFICIENT';
    }

    return 'SUFFICIENT';
  }

  private resolveRecommendationType(
    savingsCapacityLevel: SavingsCapacityLevel,
    emergencyFundStatus: EmergencyFundStatus,
    savingPreference: RecommendationInput['savingPreference'],
  ): RecommendationType {
    if (savingsCapacityLevel === 'DEFICIT') {
      return 'EXPENSE_CONTROL';
    }

    if (emergencyFundStatus === 'NONE') {
      return 'LIQUIDITY_FIRST';
    }

    if (savingsCapacityLevel === 'LOW') {
      return emergencyFundStatus === 'SUFFICIENT' && savingPreference !== 'STABLE'
        ? 'BALANCED_SAVING'
        : 'STABLE_SAVING';
    }

    if (savingsCapacityLevel === 'MID') {
      if (emergencyFundStatus === 'SUFFICIENT') {
        return savingPreference === 'AGGRESSIVE'
          ? 'DIVERSIFIED_ALLOCATION'
          : savingPreference === 'BALANCED'
            ? 'BALANCED_SAVING'
            : 'STABLE_SAVING';
      }

      return savingPreference === 'STABLE'
        ? 'STABLE_SAVING'
        : 'BALANCED_SAVING';
    }

    if (emergencyFundStatus === 'SUFFICIENT') {
      return savingPreference === 'STABLE'
        ? 'STABLE_SAVING'
        : 'DIVERSIFIED_ALLOCATION';
    }

    return savingPreference === 'STABLE'
      ? 'STABLE_SAVING'
      : 'BALANCED_SAVING';
  }

  private allocateAmounts(
    recommendedType: RecommendationType,
    recommendedSavingAmount: number,
    savingGoal: RecommendationInput['savingGoal'],
  ) {
    const total = Math.max(recommendedSavingAmount, 0);

    switch (recommendedType) {
      case 'EXPENSE_CONTROL':
        return {
          parkingAccountAmount: 0,
          installmentSavingsAmount: 0,
          isaAmount: 0,
          investmentAmount: 0,
        };
      case 'LIQUIDITY_FIRST':
        return {
          parkingAccountAmount: total,
          installmentSavingsAmount: 0,
          isaAmount: 0,
          investmentAmount: 0,
        };
      case 'STABLE_SAVING': {
        const parkingRatio = savingGoal === 'EMERGENCY_FUND' ? 0.4 : 0.3;
        const parkingAccountAmount = Math.floor(total * parkingRatio);
        const installmentSavingsAmount = total - parkingAccountAmount;

        return {
          parkingAccountAmount,
          installmentSavingsAmount,
          isaAmount: 0,
          investmentAmount: 0,
        };
      }
      case 'BALANCED_SAVING': {
        const parkingRatio = savingGoal === 'EMERGENCY_FUND' ? 0.3 : 0.2;
        const isaRatio =
          savingGoal === 'LIFE_STABILITY' || savingGoal === 'TRAVEL' ? 0.2 : 0.3;
        const parkingAccountAmount = Math.floor(total * parkingRatio);
        const isaAmount = Math.floor(total * isaRatio);
        const installmentSavingsAmount =
          total - parkingAccountAmount - isaAmount;

        return {
          parkingAccountAmount,
          installmentSavingsAmount,
          isaAmount,
          investmentAmount: 0,
        };
      }
      case 'DIVERSIFIED_ALLOCATION': {
        const parkingRatio = savingGoal === 'EMERGENCY_FUND' ? 0.2 : 0.1;
        const isaRatio = savingGoal === 'INVESTMENT_PREP' ? 0.35 : 0.3;
        const investmentRatio = 0.3;
        const parkingAccountAmount = Math.floor(total * parkingRatio);
        const isaAmount = Math.floor(total * isaRatio);
        const investmentAmount = Math.floor(total * investmentRatio);
        const installmentSavingsAmount =
          total - parkingAccountAmount - isaAmount - investmentAmount;

        return {
          parkingAccountAmount,
          installmentSavingsAmount,
          isaAmount,
          investmentAmount,
        };
      }
    }
  }
}
