// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './jwt-payload.interface';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService, // 토큰 발급기
  ) {}

  /**
   * 1. 유저 자격 증명 검증 (이메일 & 비밀번호 비교)
   * LocalStrategy나 Controller에서 호출할 메서드입니다.
   */
  async validateUser(
    email: string,
    pass: string,
  ): Promise<UserResponseDto | null> {
    const user = await this.usersService.findByEmail(email);

    // 유저가 존재하고, 입력한 평문(pass)과 DB의 해시값(user.password)이 일치하는지 비교
    if (user && (await bcrypt.compare(pass, user.password))) {
      // 💡 안 쓰는 password 변수 에러를 없애는 가장 우아한 방법!
      // 이미 만들어둔 DTO 생성자에 던져주면 알아서 비밀번호를 빼고 조립해 줍니다.
      return new UserResponseDto(user);
    }
    return null;
  }

  /**
   * 2. 검증된 유저에게 JWT 토큰 발급
   */
  login(user: UserResponseDto) {
    // Payload: 토큰 안에 담을 공개 정보 (절대 비밀번호 같은 민감 정보를 넣으면 안 됩니다!)
    const payload: JwtPayload = {
      sub: user.id, // JWT 표준에서 주체(Subject)는 보통 sub로 표기합니다.
      email: user.email,
      role: user.role,
    };

    return {
      // jwtService가 .env의 JWT_SECRET을 이용해 암호화된 서명을 남깁니다.
      access_token: this.jwtService.sign(payload),
    };
  }
}
