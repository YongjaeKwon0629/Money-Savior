import { Injectable } from '@nestjs/common';
import { type LedgerEntry } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateLedgerEntryDto } from '../ledger-entries/dto/create-ledger-entry.dto';

@Injectable()
export class LedgerEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, input: CreateLedgerEntryDto): Promise<LedgerEntry> {
    return this.prisma.ledgerEntry.create({
      data: {
        userId,
        targetMonth: input.targetMonth,
        entryDate: new Date(input.entryDate),
        type: input.type,
        category: input.category,
        amount: input.amount,
        memo: input.memo ?? null,
        isFixed: input.isFixed,
      },
    });
  }

  async updateByIdAndUser(
    entryId: number,
    userId: number,
    input: CreateLedgerEntryDto,
  ): Promise<LedgerEntry> {
    return this.prisma.ledgerEntry.update({
      where: { id: entryId },
      data: {
        userId,
        targetMonth: input.targetMonth,
        entryDate: new Date(input.entryDate),
        type: input.type,
        category: input.category,
        amount: input.amount,
        memo: input.memo ?? null,
        isFixed: input.isFixed,
      },
    });
  }

  async findByIdAndUser(entryId: number, userId: number) {
    return this.prisma.ledgerEntry.findFirst({
      where: {
        id: entryId,
        userId,
      },
    });
  }

  async findManyByUser(userId: number, targetMonth?: string) {
    return this.prisma.ledgerEntry.findMany({
      where: {
        userId,
        ...(targetMonth ? { targetMonth } : {}),
      },
      orderBy: [{ entryDate: 'desc' }, { id: 'desc' }],
    });
  }

  async removeById(entryId: number) {
    await this.prisma.ledgerEntry.delete({
      where: { id: entryId },
    });
  }

  async summarizeByUserAndMonth(userId: number, targetMonth: string) {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: {
        userId,
        targetMonth,
      },
      orderBy: [{ entryDate: 'desc' }, { id: 'desc' }],
    });

    return {
      entries,
    };
  }
}
