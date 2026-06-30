import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';
import { FinancialInputsService } from '../financial-inputs/financial-inputs.service';

@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly financialInputsService: FinancialInputsService) {}

  @Get(':inputId')
  async findByInputId(
    @CurrentUser() user: JwtPayload,
    @Param('inputId') inputId: string,
  ) {
    return {
      success: true,
      data: await this.financialInputsService.findRecommendationByInputId(
        user.sub,
        Number(inputId),
      ),
      message: null,
    };
  }
}
