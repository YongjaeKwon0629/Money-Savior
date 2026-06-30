import { Injectable, NotFoundException } from '@nestjs/common';
import type { SavedPlanResponseData } from '../common/types/saved-plan-response.type';
import { MonthlyFinanceInputRepository } from '../repositories/monthly-finance-input.repository';
import { RecommendationResultRepository } from '../repositories/recommendation-result.repository';
import { SavedRecommendationPlanRepository } from '../repositories/saved-recommendation-plan.repository';

@Injectable()
export class SavedPlansService {
  constructor(
    private readonly monthlyFinanceInputRepository: MonthlyFinanceInputRepository,
    private readonly recommendationResultRepository: RecommendationResultRepository,
    private readonly savedRecommendationPlanRepository: SavedRecommendationPlanRepository,
  ) {}

  async save(userId: number, inputId: number): Promise<SavedPlanResponseData> {
    const input = await this.monthlyFinanceInputRepository.findByIdAndUser(
      inputId,
      userId,
    );

    if (!input) {
      throw new NotFoundException('Input not found.');
    }

    const recommendation =
      await this.recommendationResultRepository.findByInputIdAndUser(inputId, userId);

    if (!recommendation) {
      throw new NotFoundException('Recommendation not found.');
    }

    const savedPlan = await this.savedRecommendationPlanRepository.upsert({
      userId,
      monthlyFinanceInputId: input.id,
      recommendationResultId: recommendation.id,
      targetMonth: input.targetMonth,
      recommendedType: recommendation.recommendedType,
      recommendedSavingAmount: recommendation.recommendedSavingAmount,
      surplusAmount: recommendation.surplusAmount,
    });

    return {
      planId: savedPlan.id,
      inputId: input.id,
      recommendationId: recommendation.id,
      targetMonth: savedPlan.targetMonth,
      recommendedType: savedPlan.recommendedType,
      recommendedSavingAmount: savedPlan.recommendedSavingAmount,
      surplusAmount: savedPlan.surplusAmount,
      savedAt: savedPlan.createdAt.toISOString(),
    };
  }

  async findAll(userId: number): Promise<SavedPlanResponseData[]> {
    const plans = await this.savedRecommendationPlanRepository.findManyByUser(userId);

    return plans.map((plan) => ({
      planId: plan.id,
      inputId: plan.monthlyFinanceInputId,
      recommendationId: plan.recommendationResultId,
      targetMonth: plan.targetMonth,
      recommendedType: plan.recommendedType,
      recommendedSavingAmount: plan.recommendedSavingAmount,
      surplusAmount: plan.surplusAmount,
      savedAt: plan.createdAt.toISOString(),
    }));
  }

  async remove(userId: number, planId: number): Promise<void> {
    const result = await this.savedRecommendationPlanRepository.deleteByIdAndUser(
      planId,
      userId,
    );

    if (result.count === 0) {
      throw new NotFoundException('Saved plan not found.');
    }
  }

  async clear(userId: number): Promise<void> {
    await this.savedRecommendationPlanRepository.deleteManyByUser(userId);
  }
}
