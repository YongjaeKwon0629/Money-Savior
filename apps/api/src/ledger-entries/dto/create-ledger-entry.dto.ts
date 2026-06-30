import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { LedgerEntryType } from '@prisma/client';

export class CreateLedgerEntryDto {
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'targetMonth must be in YYYY-MM format.',
  })
  targetMonth: string;

  @IsDateString()
  entryDate: string;

  @IsEnum(LedgerEntryType)
  type: LedgerEntryType;

  @IsString()
  @MaxLength(50)
  category: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  memo?: string;

  @Type(() => Boolean)
  @IsBoolean()
  isFixed: boolean;
}
