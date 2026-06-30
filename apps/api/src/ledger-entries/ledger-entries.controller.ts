import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { FindLedgerEntriesDto } from './dto/find-ledger-entries.dto';
import { LedgerEntriesService } from './ledger-entries.service';
import { SummarizeLedgerEntriesDto } from './dto/summarize-ledger-entries.dto';

@UseGuards(JwtAuthGuard)
@Controller('ledger-entries')
export class LedgerEntriesController {
  constructor(private readonly ledgerEntriesService: LedgerEntriesService) {}

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateLedgerEntryDto,
  ) {
    return {
      success: true,
      data: await this.ledgerEntriesService.create(user.sub, body),
      message: '가계부 항목이 저장되었습니다.',
    };
  }

  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: FindLedgerEntriesDto,
  ) {
    return {
      success: true,
      data: await this.ledgerEntriesService.findAll(user.sub, query.targetMonth),
      message: null,
    };
  }

  @Get('summary')
  async summarize(
    @CurrentUser() user: JwtPayload,
    @Query() query: SummarizeLedgerEntriesDto,
  ) {
    return {
      success: true,
      data: await this.ledgerEntriesService.summarize(user.sub, query.targetMonth),
      message: null,
    };
  }

  @Put(':entryId')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('entryId', ParseIntPipe) entryId: number,
    @Body() body: CreateLedgerEntryDto,
  ) {
    return {
      success: true,
      data: await this.ledgerEntriesService.update(user.sub, entryId, body),
      message: '가계부 항목이 수정되었습니다.',
    };
  }

  @Delete(':entryId')
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('entryId', ParseIntPipe) entryId: number,
  ) {
    await this.ledgerEntriesService.remove(user.sub, entryId);

    return {
      success: true,
      data: null,
      message: '가계부 항목이 삭제되었습니다.',
    };
  }
}
