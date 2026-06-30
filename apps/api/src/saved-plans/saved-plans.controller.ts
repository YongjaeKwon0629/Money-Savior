import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';
import { SavePlanDto } from './dto/save-plan.dto';
import { SavedPlansService } from './saved-plans.service';

@UseGuards(JwtAuthGuard)
@Controller('saved-plans')
export class SavedPlansController {
  constructor(private readonly savedPlansService: SavedPlansService) {}

  @Post()
  async save(@CurrentUser() user: JwtPayload, @Body() body: SavePlanDto) {
    return {
      success: true,
      data: await this.savedPlansService.save(user.sub, body.inputId),
      message: '추천 계획이 저장되었습니다.',
    };
  }

  @Get()
  async findAll(@CurrentUser() user: JwtPayload) {
    return {
      success: true,
      data: await this.savedPlansService.findAll(user.sub),
      message: null,
    };
  }

  @Delete(':planId')
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('planId', ParseIntPipe) planId: number,
  ) {
    await this.savedPlansService.remove(user.sub, planId);

    return {
      success: true,
      data: null,
      message: '추천 계획이 삭제되었습니다.',
    };
  }

  @Delete()
  async clear(@CurrentUser() user: JwtPayload) {
    await this.savedPlansService.clear(user.sub);

    return {
      success: true,
      data: null,
      message: '저장한 추천 계획을 모두 삭제했습니다.',
    };
  }
}
