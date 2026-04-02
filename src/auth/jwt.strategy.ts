// src/auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다!');
    }

    super({
      // 1. 요청 헤더에서 'Authorization: Bearer <토큰>' 형태의 토큰을 뽑아옵니다.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 2. 토큰 만료 시간이 지났으면 즉시 거절(Unauthorized)합니다.
      ignoreExpiration: false,
      // 3. 토큰의 서명이 우리 서버의 비밀키로 만들어진 것이 맞는지 확인합니다.
      // 💡 [핵심] undefined 가능성을 차단하기 위한 기본값(Fallback) 제공
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'default_secret_key',
    });
  }

  /**
   * 💡 [핵심 트러블슈팅] DB 조회를 제거한 Stateless 검증
   * 서명 검증이 통과되었다면 페이로드의 데이터를 즉시 신뢰합니다.
   */
  validate(payload: JwtPayload) {
    // 이제 매 요청마다 UsersService.findById를 호출하지 않습니다.
    // 리턴된 값은 컨트롤러의 req.user에 그대로 담깁니다.

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
