import { Injectable, NotFoundException } from '@nestjs/common';
import { LedgerEntryType } from '@prisma/client';
import type {
  LedgerEntryResponseData,
  LedgerSummaryResponseData,
} from '../common/types/ledger-entry-response.type';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { LedgerEntryRepository } from '../repositories/ledger-entry.repository';

@Injectable()
export class LedgerEntriesService {
  constructor(
    private readonly ledgerEntryRepository: LedgerEntryRepository,
  ) {}

  async create(
    userId: number,
    input: CreateLedgerEntryDto,
  ): Promise<LedgerEntryResponseData> {
    const entry = await this.ledgerEntryRepository.create(userId, input);

    return this.toResponse(entry);
  }

  async findAll(
    userId: number,
    targetMonth?: string,
  ): Promise<LedgerEntryResponseData[]> {
    const entries = await this.ledgerEntryRepository.findManyByUser(
      userId,
      targetMonth,
    );

    return entries.map((entry) => this.toResponse(entry));
  }

  async update(
    userId: number,
    entryId: number,
    input: CreateLedgerEntryDto,
  ): Promise<LedgerEntryResponseData> {
    const existingEntry = await this.ledgerEntryRepository.findByIdAndUser(
      entryId,
      userId,
    );

    if (!existingEntry) {
      throw new NotFoundException('Ledger entry not found.');
    }

    const updatedEntry = await this.ledgerEntryRepository.updateByIdAndUser(
      entryId,
      userId,
      input,
    );

    return this.toResponse(updatedEntry);
  }

  async remove(userId: number, entryId: number): Promise<void> {
    const existingEntry = await this.ledgerEntryRepository.findByIdAndUser(
      entryId,
      userId,
    );

    if (!existingEntry) {
      throw new NotFoundException('Ledger entry not found.');
    }

    await this.ledgerEntryRepository.removeById(entryId);
  }

  async summarize(
    userId: number,
    targetMonth: string,
  ): Promise<LedgerSummaryResponseData> {
    const { entries } = await this.ledgerEntryRepository.summarizeByUserAndMonth(
      userId,
      targetMonth,
    );

    const income = entries
      .filter((entry) => entry.type === LedgerEntryType.INCOME)
      .reduce((sum, entry) => sum + entry.amount, 0);

    const expenseEntries = entries.filter(
      (entry) => entry.type === LedgerEntryType.EXPENSE,
    );
    const expense = expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const fixedExpense = expenseEntries
      .filter((entry) => entry.isFixed)
      .reduce((sum, entry) => sum + entry.amount, 0);
    const variableExpense = expense - fixedExpense;

    const categoryMap = new Map<string, number>();

    for (const entry of expenseEntries) {
      categoryMap.set(
        entry.category,
        (categoryMap.get(entry.category) ?? 0) + entry.amount,
      );
    }

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: expense > 0 ? Math.round((amount / expense) * 100) : 0,
      }))
      .sort((left, right) => right.amount - left.amount);

    return {
      targetMonth,
      totals: {
        income,
        expense,
        fixedExpense,
        variableExpense,
        balance: income - expense,
      },
      categoryBreakdown,
      entryCount: entries.length,
    };
  }

  private toResponse(entry: {
    id: number;
    targetMonth: string;
    entryDate: Date;
    type: LedgerEntryType;
    category: string;
    amount: number;
    memo: string | null;
    isFixed: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): LedgerEntryResponseData {
    return {
      entryId: entry.id,
      targetMonth: entry.targetMonth,
      entryDate: entry.entryDate.toISOString(),
      type: entry.type,
      category: entry.category,
      amount: entry.amount,
      memo: entry.memo,
      isFixed: entry.isFixed,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    };
  }
}
