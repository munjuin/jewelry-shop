// src/auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
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
   * 4. 서명 검증과 만료 시간 검사가 무사히 통과되면 실행되는 메서드입니다.
   * 여기서 리턴한 값은 컨트롤러에서 `req.user`로 언제든지 꺼내 쓸 수 있습니다.
   */
  async validate(payload: JwtPayload) {
    // (선택적 보안 강화) 토큰은 유효하지만, 그 사이에 유저가 탈퇴했을 수도 있으므로 DB를 한 번 더 확인합니다.
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('존재하지 않는 유저입니다.');
    }

    // req.user 에 담길 객체
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
