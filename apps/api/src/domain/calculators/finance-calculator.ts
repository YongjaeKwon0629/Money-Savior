import { Injectable } from '@nestjs/common';
import { CalculationResult } from '../types/calculation-result.type';

export interface FinanceCalculationInput {
  monthlyIncome: number;
  fixedExpense: number;
  variableExpense: number;
  emergencyFundAmount: number;
}

@Injectable()
export class FinanceCalculator {
  calculate(input: FinanceCalculationInput): CalculationResult {
    const surplusAmount =
      input.monthlyIncome - input.fixedExpense - input.variableExpense;
    const fixedExpenseRatio = this.toFixedRatio(
      input.monthlyIncome === 0 ? 0 : (input.fixedExpense / input.monthlyIncome) * 100,
    );
    const livingCostBase = input.fixedExpense + input.variableExpense;
    const emergencyFundTarget = livingCostBase * 3;
    const emergencyFundRatio = this.toFixedRatio(
      emergencyFundTarget === 0
        ? 0
        : (input.emergencyFundAmount / emergencyFundTarget) * 100,
    );

    const normalizedSurplus = Math.max(surplusAmount, 0);

    return {
      surplusAmount,
      fixedExpenseRatio,
      livingCostBase,
      emergencyFundTarget,
      emergencyFundRatio,
      safeSavingAmount: Math.floor(normalizedSurplus * 0.5),
      recommendedSavingAmount: Math.floor(normalizedSurplus * 0.7),
      challengeSavingAmount: Math.floor(normalizedSurplus * 0.9),
    };
  }

  private toFixedRatio(value: number): number {
    return Number(value.toFixed(2));
  }
}
