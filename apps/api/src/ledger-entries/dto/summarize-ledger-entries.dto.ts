import { Matches } from 'class-validator';

export class SummarizeLedgerEntriesDto {
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'targetMonth must be in YYYY-MM format.',
  })
  targetMonth: string;
}
