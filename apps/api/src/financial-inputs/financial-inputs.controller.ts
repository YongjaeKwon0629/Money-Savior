import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';
import { CreateFinancialInputDto } from './dto/create-financial-input.dto';
import { FinancialInputsService } from './financial-inputs.service';

@UseGuards(JwtAuthGuard)
@Controller('financial-inputs')
export class FinancialInputsController {
  constructor(private readonly financialInputsService: FinancialInputsService) {}

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateFinancialInputDto,
  ) {
    return {
      success: true,
      data: await this.financialInputsService.create(user.sub, body),
      message: null,
    };
  }

  @Get('month/:targetMonth')
  async findByMonth(
    @CurrentUser() user: JwtPayload,
    @Param('targetMonth') targetMonth: string,
  ) {
    return {
      success: true,
      data: await this.financialInputsService.findInputByMonth(
        user.sub,
        targetMonth,
      ),
      message: null,
    };
  }

  @Get(':inputId')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('inputId', ParseIntPipe) inputId: number,
  ) {
    return {
      success: true,
      data: await this.financialInputsService.findInputById(user.sub, inputId),
      message: null,
    };
  }

  @Put(':inputId')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('inputId', ParseIntPipe) inputId: number,
    @Body() body: CreateFinancialInputDto,
  ) {
    return {
      success: true,
      data: await this.financialInputsService.update(user.sub, inputId, body),
      message: '입력값이 수정되고 추천 결과가 갱신되었습니다.',
    };
  }
}
