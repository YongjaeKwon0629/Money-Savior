import { Injectable } from '@nestjs/common';
import { Prisma, type MonthlyFinanceInput } from '@prisma/client';
import type { CreateFinancialInputRequest } from '../common/types/financial-input.type';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MonthlyFinanceInputRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertByUserAndMonth(
    userId: number,
    input: CreateFinancialInputRequest,
  ): Promise<MonthlyFinanceInput> {
    const data: Prisma.MonthlyFinanceInputUncheckedCreateInput = {
      userId,
      targetMonth: input.targetMonth,
      monthlyIncome: input.monthlyIncome,
      paydayDay: input.paydayDay,
      fixedExpense: input.fixedExpense,
      variableExpense: input.variableExpense,
      emergencyFundAmount: input.emergencyFundAmount,
      savingGoal: input.savingGoal,
      savingPreference: input.savingPreference,
    };

    return this.prisma.monthlyFinanceInput.upsert({
      where: {
        userId_targetMonth: {
          userId,
          targetMonth: input.targetMonth,
        },
      },
      update: data,
      create: data,
    });
  }

  async updateByIdAndUser(
    id: number,
    userId: number,
    input: CreateFinancialInputRequest,
  ): Promise<MonthlyFinanceInput> {
    return this.prisma.monthlyFinanceInput.update({
      where: { id },
      data: {
        userId,
        targetMonth: input.targetMonth,
        monthlyIncome: input.monthlyIncome,
        paydayDay: input.paydayDay,
        fixedExpense: input.fixedExpense,
        variableExpense: input.variableExpense,
        emergencyFundAmount: input.emergencyFundAmount,
        savingGoal: input.savingGoal,
        savingPreference: input.savingPreference,
      },
    });
  }

  async findById(id: number) {
    return this.prisma.monthlyFinanceInput.findUnique({
      where: { id },
    });
  }

  async findByIdAndUser(id: number, userId: number) {
    return this.prisma.monthlyFinanceInput.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async findByMonthAndUser(targetMonth: string, userId: number) {
    return this.prisma.monthlyFinanceInput.findFirst({
      where: {
        targetMonth,
        userId,
      },
    });
  }
}
