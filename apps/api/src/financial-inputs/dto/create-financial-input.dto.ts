import { IsIn, IsInt, IsString, Matches, Max, Min } from 'class-validator';
import {
  SAVING_GOALS,
  SAVING_PREFERENCES,
} from '../../common/constants/finance.constants';
import type { CreateFinancialInputRequest } from '../../common/types/financial-input.type';

export class CreateFinancialInputDto implements CreateFinancialInputRequest {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  targetMonth: string;

  @IsInt()
  @Min(1)
  monthlyIncome: number;

  @IsInt()
  @Min(1)
  @Max(31)
  paydayDay: number;

  @IsInt()
  @Min(0)
  fixedExpense: number;

  @IsInt()
  @Min(0)
  variableExpense: number;

  @IsInt()
  @Min(0)
  emergencyFundAmount: number;

  @IsString()
  @IsIn(Object.values(SAVING_GOALS))
  savingGoal: CreateFinancialInputRequest['savingGoal'];

  @IsString()
  @IsIn(Object.values(SAVING_PREFERENCES))
  savingPreference: CreateFinancialInputRequest['savingPreference'];
}
