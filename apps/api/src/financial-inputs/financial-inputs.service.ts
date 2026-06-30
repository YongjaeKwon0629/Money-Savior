import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateFinancialInputRequest } from '../common/types/financial-input.type';
import type { RecommendationResponseData } from '../common/types/recommendation-response.type';
import { FinanceCalculator } from '../domain/calculators/finance-calculator';
import { RecommendationActionFactory } from '../domain/factories/recommendation-action.factory';
import { ExceptionPolicyEngine } from '../domain/policies/exception-policy-engine';
import { RecommendationEngine } from '../domain/recommenders/recommendation-engine';
import type { ExceptionCode } from '../domain/types/exception-policy.type';
import { MonthlyFinanceInputRepository } from '../repositories/monthly-finance-input.repository';
import { RecommendationResultRepository } from '../repositories/recommendation-result.repository';

@Injectable()
export class FinancialInputsService {
  constructor(
    private readonly monthlyFinanceInputRepository: MonthlyFinanceInputRepository,
    private readonly recommendationResultRepository: RecommendationResultRepository,
    private readonly financeCalculator: FinanceCalculator,
    private readonly recommendationEngine: RecommendationEngine,
    private readonly exceptionPolicyEngine: ExceptionPolicyEngine,
    private readonly recommendationActionFactory: RecommendationActionFactory,
  ) {}

  async create(
    userId: number,
    input: CreateFinancialInputRequest,
  ): Promise<RecommendationResponseData> {
    const monthlyFinanceInput =
      await this.monthlyFinanceInputRepository.upsertByUserAndMonth(userId, input);

    return this.buildRecommendationResponse(monthlyFinanceInput.id, input, {
      id: monthlyFinanceInput.id,
      targetMonth: monthlyFinanceInput.targetMonth,
      monthlyIncome: monthlyFinanceInput.monthlyIncome,
      fixedExpense: monthlyFinanceInput.fixedExpense,
      variableExpense: monthlyFinanceInput.variableExpense,
    });
  }

  async update(
    userId: number,
    inputId: number,
    input: CreateFinancialInputRequest,
  ): Promise<RecommendationResponseData> {
    const existingInput = await this.monthlyFinanceInputRepository.findByIdAndUser(
      inputId,
      userId,
    );

    if (!existingInput) {
      throw new NotFoundException('Input not found.');
    }

    const updatedInput = await this.monthlyFinanceInputRepository.updateByIdAndUser(
      inputId,
      userId,
      input,
    );

    return this.buildRecommendationResponse(updatedInput.id, input, {
      id: updatedInput.id,
      targetMonth: updatedInput.targetMonth,
      monthlyIncome: updatedInput.monthlyIncome,
      fixedExpense: updatedInput.fixedExpense,
      variableExpense: updatedInput.variableExpense,
    });
  }

  async findInputById(userId: number, inputId: number) {
    const input = await this.monthlyFinanceInputRepository.findByIdAndUser(
      inputId,
      userId,
    );

    if (!input) {
      throw new NotFoundException('Input not found.');
    }

    return input;
  }

  async findInputByMonth(userId: number, targetMonth: string) {
    const input = await this.monthlyFinanceInputRepository.findByMonthAndUser(
      targetMonth,
      userId,
    );

    if (!input) {
      return null;
    }

    const recommendation =
      await this.recommendationResultRepository.findByInputIdAndUser(
        input.id,
        userId,
      );

    return {
      inputId: input.id,
      targetMonth: input.targetMonth,
      recommendationId: recommendation?.id ?? null,
      hasRecommendation: Boolean(recommendation),
      summary: recommendation
        ? {
            monthlyIncome: input.monthlyIncome,
            fixedExpense: input.fixedExpense,
            variableExpense: input.variableExpense,
            surplusAmount: recommendation.surplusAmount,
          }
        : null,
      recommendation: recommendation
        ? {
            recommendedType: recommendation.recommendedType,
            recommendedSavingAmount: recommendation.recommendedSavingAmount,
          }
        : null,
    };
  }

  async findRecommendationByInputId(
    userId: number,
    inputId: number,
  ): Promise<RecommendationResponseData> {
    const input = await this.monthlyFinanceInputRepository.findByIdAndUser(
      inputId,
      userId,
    );

    if (!input) {
      throw new NotFoundException('Input not found.');
    }

    const recommendation =
      await this.recommendationResultRepository.findByInputIdAndUser(
        input.id,
        userId,
      );

    if (!recommendation) {
      throw new NotFoundException('Recommendation not found.');
    }

    const reasons = [
      recommendation.recommendationReason1,
      recommendation.recommendationReason2,
      recommendation.recommendationReason3,
    ].filter((value): value is string => Boolean(value));

    const cautions = [
      recommendation.cautionMessage1,
      recommendation.cautionMessage2,
    ].filter((value): value is string => Boolean(value));

    const actions = this.recommendationActionFactory.create({
      savingGoal: input.savingGoal,
      savingPreference: input.savingPreference,
      calculationResult: {
        surplusAmount: recommendation.surplusAmount,
        fixedExpenseRatio: Number(recommendation.fixedExpenseRatio),
        livingCostBase: recommendation.livingCostBase,
        emergencyFundTarget: recommendation.emergencyFundTarget,
        emergencyFundRatio: Number(recommendation.emergencyFundRatio),
        safeSavingAmount: recommendation.safeSavingAmount,
        recommendedSavingAmount: recommendation.recommendedSavingAmount,
        challengeSavingAmount: recommendation.challengeSavingAmount,
      },
      recommendationDecision: {
        savingsCapacityLevel: recommendation.savingsCapacityLevel,
        emergencyFundStatus: recommendation.emergencyFundStatus,
        recommendedType: recommendation.recommendedType,
        parkingAccountAmount: recommendation.parkingAccountAmount,
        installmentSavingsAmount: recommendation.installmentSavingsAmount,
        isaAmount: recommendation.isaAmount,
        investmentAmount: recommendation.investmentAmount,
      },
      exceptionCode: recommendation.exceptionCode as ExceptionCode | null,
    }).actions;

    return {
      inputId: input.id,
      recommendationId: recommendation.id,
      targetMonth: input.targetMonth,
      summary: {
        monthlyIncome: input.monthlyIncome,
        fixedExpense: input.fixedExpense,
        variableExpense: input.variableExpense,
        surplusAmount: recommendation.surplusAmount,
        emergencyFundStatus: recommendation.emergencyFundStatus,
      },
      savingAmounts: {
        safe: recommendation.safeSavingAmount,
        recommended: recommendation.recommendedSavingAmount,
        challenge: recommendation.challengeSavingAmount,
      },
      recommendation: {
        type: recommendation.recommendedType,
        parkingAccountAmount: recommendation.parkingAccountAmount,
        installmentSavingsAmount: recommendation.installmentSavingsAmount,
        isaAmount: recommendation.isaAmount,
        investmentAmount: recommendation.investmentAmount,
      },
      reasons,
      cautions,
      actions,
    };
  }

  private async buildRecommendationResponse(
    monthlyFinanceInputId: number,
    input: CreateFinancialInputRequest,
    summaryBase: {
      id: number;
      targetMonth: string;
      monthlyIncome: number;
      fixedExpense: number;
      variableExpense: number;
    },
  ): Promise<RecommendationResponseData> {
    const calculationResult = this.financeCalculator.calculate({
      monthlyIncome: input.monthlyIncome,
      fixedExpense: input.fixedExpense,
      variableExpense: input.variableExpense,
      emergencyFundAmount: input.emergencyFundAmount,
    });

    const recommendationDecision = this.recommendationEngine.recommend({
      monthlyIncome: input.monthlyIncome,
      savingGoal: input.savingGoal,
      savingPreference: input.savingPreference,
      surplusAmount: calculationResult.surplusAmount,
      emergencyFundRatio: calculationResult.emergencyFundRatio,
      recommendedSavingAmount: calculationResult.recommendedSavingAmount,
    });

    const exceptionPolicyResult = this.exceptionPolicyEngine.apply({
      savingPreference: input.savingPreference,
      calculationResult,
      recommendationDecision,
    });

    const recommendationContent = this.recommendationActionFactory.create({
      savingGoal: input.savingGoal,
      savingPreference: input.savingPreference,
      calculationResult,
      recommendationDecision: exceptionPolicyResult.adjustedRecommendation,
      exceptionCode: exceptionPolicyResult.exceptionCode,
    });

    const savedRecommendation =
      await this.recommendationResultRepository.upsertByInputId({
        monthlyFinanceInputId,
        calculationResult,
        recommendationDecision,
        exceptionPolicyResult,
        recommendationContent,
      });

    return {
      inputId: summaryBase.id,
      recommendationId: savedRecommendation.id,
      targetMonth: summaryBase.targetMonth,
      summary: {
        monthlyIncome: summaryBase.monthlyIncome,
        fixedExpense: summaryBase.fixedExpense,
        variableExpense: summaryBase.variableExpense,
        surplusAmount: calculationResult.surplusAmount,
        emergencyFundStatus:
          exceptionPolicyResult.adjustedRecommendation.emergencyFundStatus,
      },
      savingAmounts: {
        safe: calculationResult.safeSavingAmount,
        recommended: calculationResult.recommendedSavingAmount,
        challenge: calculationResult.challengeSavingAmount,
      },
      recommendation: {
        type: exceptionPolicyResult.adjustedRecommendation.recommendedType,
        parkingAccountAmount:
          exceptionPolicyResult.adjustedRecommendation.parkingAccountAmount,
        installmentSavingsAmount:
          exceptionPolicyResult.adjustedRecommendation.installmentSavingsAmount,
        isaAmount: exceptionPolicyResult.adjustedRecommendation.isaAmount,
        investmentAmount:
          exceptionPolicyResult.adjustedRecommendation.investmentAmount,
      },
      reasons: recommendationContent.reasons,
      cautions: exceptionPolicyResult.cautionMessages,
      actions: recommendationContent.actions,
    };
  }
}
