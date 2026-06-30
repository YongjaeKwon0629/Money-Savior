import { Injectable } from '@nestjs/common';
import { Prisma, type RecommendationResult } from '@prisma/client';
import type { CalculationResult } from '../domain/types/calculation-result.type';
import type { ExceptionPolicyResult } from '../domain/types/exception-policy.type';
import type {
  RecommendationContentResult,
} from '../domain/types/recommendation-content.type';
import type { RecommendationDecision } from '../domain/types/recommendation-decision.type';
import { PrismaService } from '../database/prisma.service';

export interface SaveRecommendationResultInput {
  monthlyFinanceInputId: number;
  calculationResult: CalculationResult;
  recommendationDecision: RecommendationDecision;
  exceptionPolicyResult: ExceptionPolicyResult;
  recommendationContent: RecommendationContentResult;
}

@Injectable()
export class RecommendationResultRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertByInputId(
    input: SaveRecommendationResultInput,
  ): Promise<RecommendationResult> {
    const {
      monthlyFinanceInputId,
      calculationResult,
      recommendationDecision,
      exceptionPolicyResult,
      recommendationContent,
    } = input;

    const data: Prisma.RecommendationResultUncheckedCreateInput = {
      monthlyFinanceInputId,
      surplusAmount: calculationResult.surplusAmount,
      fixedExpenseRatio: new Prisma.Decimal(calculationResult.fixedExpenseRatio),
      livingCostBase: calculationResult.livingCostBase,
      emergencyFundTarget: calculationResult.emergencyFundTarget,
      emergencyFundRatio: new Prisma.Decimal(
        calculationResult.emergencyFundRatio,
      ),
      savingsCapacityLevel: recommendationDecision.savingsCapacityLevel,
      emergencyFundStatus: recommendationDecision.emergencyFundStatus,
      recommendedType: recommendationDecision.recommendedType,
      safeSavingAmount: calculationResult.safeSavingAmount,
      recommendedSavingAmount: calculationResult.recommendedSavingAmount,
      challengeSavingAmount: calculationResult.challengeSavingAmount,
      parkingAccountAmount:
        exceptionPolicyResult.adjustedRecommendation.parkingAccountAmount,
      installmentSavingsAmount:
        exceptionPolicyResult.adjustedRecommendation.installmentSavingsAmount,
      isaAmount: exceptionPolicyResult.adjustedRecommendation.isaAmount,
      investmentAmount:
        exceptionPolicyResult.adjustedRecommendation.investmentAmount,
      recommendationReason1: recommendationContent.reasons[0] ?? null,
      recommendationReason2: recommendationContent.reasons[1] ?? null,
      recommendationReason3: recommendationContent.reasons[2] ?? null,
      cautionMessage1: exceptionPolicyResult.cautionMessages[0] ?? null,
      cautionMessage2: exceptionPolicyResult.cautionMessages[1] ?? null,
      exceptionCode: exceptionPolicyResult.exceptionCode,
    };

    return this.prisma.recommendationResult.upsert({
      where: { monthlyFinanceInputId },
      update: data,
      create: data,
    });
  }

  async findByInputId(monthlyFinanceInputId: number) {
    return this.prisma.recommendationResult.findUnique({
      where: { monthlyFinanceInputId },
    });
  }

  async findByInputIdAndUser(monthlyFinanceInputId: number, userId: number) {
    return this.prisma.recommendationResult.findFirst({
      where: {
        monthlyFinanceInputId,
        monthlyFinanceInput: {
          userId,
        },
      },
    });
  }
}
