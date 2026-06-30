import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { JwtPayload } from './types/jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return {
      success: true,
      data: await this.authService.signup(dto),
      message: '회원가입이 완료되었습니다.',
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return {
      success: true,
      data: await this.authService.login(dto),
      message: '로그인이 완료되었습니다.',
    };
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return {
      success: true,
      data: await this.authService.refresh(dto),
      message: '토큰이 재발급되었습니다.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: JwtPayload) {
    await this.authService.logout(user.sub);

    return {
      success: true,
      data: null,
      message: '로그아웃했습니다.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: JwtPayload) {
    return {
      success: true,
      data: await this.authService.getMe(user.sub),
      message: null,
    };
  }
}
