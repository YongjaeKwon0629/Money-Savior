import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignupDto } from './dto/signup.dto';
import type { AuthUser } from './types/auth-user.type';
import type { JwtPayload } from './types/jwt-payload.interface';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('이미 가입한 이메일입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const createdUser = await this.userRepository.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    const tokens = await this.issueTokens(createdUser.id, createdUser.email);
    await this.userRepository.updateRefreshTokenHash(
      createdUser.id,
      await bcrypt.hash(tokens.refreshToken, 10),
    );
    await this.userRepository.updateLastLoginAt(createdUser.id, new Date());

    return {
      user: this.toAuthUser(createdUser.id, createdUser.email, createdUser.name),
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const passwordMatched = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatched) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const tokens = await this.issueTokens(user.id, user.email);
    await this.userRepository.updateRefreshTokenHash(
      user.id,
      await bcrypt.hash(tokens.refreshToken, 10),
    );
    await this.userRepository.updateLastLoginAt(user.id, new Date());

    return {
      user: this.toAuthUser(user.id, user.email, user.name),
      tokens,
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<{ tokens: AuthTokens }> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const user = await this.userRepository.findById(payload.sub);

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('다시 로그인해 주세요.');
    }

    const refreshTokenMatched = await bcrypt.compare(
      dto.refreshToken,
      user.refreshTokenHash,
    );

    if (!refreshTokenMatched) {
      throw new UnauthorizedException('다시 로그인해 주세요.');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    await this.userRepository.updateRefreshTokenHash(
      user.id,
      await bcrypt.hash(tokens.refreshToken, 10),
    );

    return { tokens };
  }

  async logout(userId: number): Promise<void> {
    await this.userRepository.updateRefreshTokenHash(userId, null);
  }

  async getMe(userId: number): Promise<AuthUser> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('인증이 필요합니다.');
    }

    return this.toAuthUser(user.id, user.email, user.name);
  }

  private async issueTokens(userId: number, email: string): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET ?? 'money-coach-access-secret',
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '1h') as never,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'money-coach-refresh-secret',
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '14d') as never,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'money-coach-refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('다시 로그인해 주세요.');
    }
  }

  private toAuthUser(id: number, email: string, name: string): AuthUser {
    return { id, email, name };
  }
}
