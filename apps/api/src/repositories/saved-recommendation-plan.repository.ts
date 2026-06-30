import { Injectable } from '@nestjs/common';
import { Prisma, type SavedRecommendationPlan } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

export interface SaveRecommendationPlanInput {
  userId: number;
  monthlyFinanceInputId: number;
  recommendationResultId: number;
  targetMonth: string;
  recommendedType: SavedRecommendationPlan['recommendedType'];
  recommendedSavingAmount: number;
  surplusAmount: number;
}

@Injectable()
export class SavedRecommendationPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(input: SaveRecommendationPlanInput): Promise<SavedRecommendationPlan> {
    const data: Prisma.SavedRecommendationPlanUncheckedCreateInput = {
      userId: input.userId,
      monthlyFinanceInputId: input.monthlyFinanceInputId,
      recommendationResultId: input.recommendationResultId,
      targetMonth: input.targetMonth,
      recommendedType: input.recommendedType,
      recommendedSavingAmount: input.recommendedSavingAmount,
      surplusAmount: input.surplusAmount,
    };

    return this.prisma.savedRecommendationPlan.upsert({
      where: {
        userId_monthlyFinanceInputId: {
          userId: input.userId,
          monthlyFinanceInputId: input.monthlyFinanceInputId,
        },
      },
      update: data,
      create: data,
    });
  }

  async findManyByUser(userId: number) {
    return this.prisma.savedRecommendationPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteByIdAndUser(id: number, userId: number) {
    return this.prisma.savedRecommendationPlan.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }

  async deleteManyByUser(userId: number) {
    return this.prisma.savedRecommendationPlan.deleteMany({
      where: { userId },
    });
  }
}
