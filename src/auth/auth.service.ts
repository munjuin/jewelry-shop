// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config'; // ✅ 환경변수 사용을 위해 추가
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './jwt-payload.interface';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService, // ✅ 주입
  ) {}

  /**
   * 1. 유저 자격 증명 검증 (이메일 & 비밀번호 비교)
   */
  async validateUser(
    email: string,
    pass: string,
  ): Promise<UserResponseDto | null> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(pass, user.password))) {
      return new UserResponseDto(user);
    }
    return null;
  }

  /**
   * 💡 [내부 로직] 두 개의 토큰을 동시에 발급하는 헬퍼 메서드
   */
  private async getTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      // Access Token 발급 (기본 설정 사용)
      this.jwtService.signAsync(payload),
      // Refresh Token 발급 (전용 시크릿키와 만료시간 사용)
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>(
          'JWT_REFRESH_EXPIRATION_TIME',
        ) || '14d') as '14d',
      }),
    ]);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  /**
   * 💡 [내부 로직] Refresh Token을 해싱하여 DB에 저장
   */
  private async updateRefreshToken(userId: number, refreshToken: string) {
    const saltRounds = 10;
    const hashedRefreshToken = await bcrypt.hash(refreshToken, saltRounds);
    await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
  }

  /**
   * 2. 검증된 유저에게 JWT 토큰 '쌍' 발급 및 DB 저장
   */
  async login(user: UserResponseDto) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // 토큰 2개 발급
    const tokens = await this.getTokens(payload);
    // 리프레시 토큰은 DB에 해싱하여 저장
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  /**
   * 3. 💡 Access Token 단독 갱신 로직 (쇼핑몰 성능 최적화)
   */
  async refreshAccessToken(refreshToken: string, userId: number) {
    // 1. DB에서 유저와 해시된 리프레시 토큰을 가져옵니다.
    const user = await this.usersService.findByIdWithRefreshToken(userId);

    // 유저가 없거나, 로그아웃 상태(null)라면 거절
    if (!user || !user.refresh_token) {
      throw new UnauthorizedException('권한이 없거나 로그아웃된 유저입니다.');
    }

    // 2. 클라이언트가 보낸 토큰(평문)과 DB의 토큰(해시) 비교
    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.refresh_token,
    );
    if (!isRefreshTokenMatching) {
      throw new UnauthorizedException('유효하지 않은 Refresh Token입니다.');
    }

    // 3. DB 쓰기 작업 없이, Access Token만 가볍게 새로 찍어서 반환!
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const newAccessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: newAccessToken,
    };
  }
}
