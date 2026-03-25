// src/auth/jwt-refresh.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
// 💡 이번 문지기의 이름은 'jwt-refresh' 입니다.
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      // 1. 헤더에서 Bearer 토큰(리프레시 토큰)을 추출합니다.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 2. 반드시 JWT_REFRESH_SECRET 키로 서명을 검사해야 합니다!
      secretOrKey:
        configService.get<string>('JWT_REFRESH_SECRET') ||
        'default_refresh_key',
      // 3. 클라이언트가 보낸 리프레시 토큰 '원형(평문)'을 라우터로 넘겨주기 위한 옵션입니다. (DB 해시 비교용)
      passReqToCallback: true,
    });
  }

  // 💡 [핵심 해결] payload를 any 대신 JwtPayload로 명시합니다.
  validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim();

    // 💡 [핵심 해결] 확정된 타입의 값들만 명시적으로 조립하여 반환합니다.
    // 이제 타입스크립트는 이 반환값이 완벽하게 안전하다고 판단합니다!
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      refreshToken: refreshToken || '', // 토큰이 혹시라도 없으면 빈 문자열 반환
    };
  }
}
