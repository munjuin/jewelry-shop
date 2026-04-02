// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './jwt-payload.interface';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // 1. 회원가입 (UsersService의 createUser 호출)
  async signup(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // 💡 이미 usersService.createUser 안에 중복 검사와 해싱 로직이 완벽히 들어있습니다!
    return await this.usersService.createUser(createUserDto);
  }

  // 2. 이메일 중복 확인
  async checkEmail(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (user) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }
    return { available: true, message: '사용 가능한 이메일입니다.' };
  }

  // 3. 로그아웃 (Refresh Token 무효화)
  async logout(userId: number) {
    // UsersService의 updateRefreshToken을 사용해 토큰을 null로 만듭니다.
    await this.usersService.updateRefreshToken(userId, null);
    return { message: '성공적으로 로그아웃 되었습니다.' };
  }

  // -------------------------------------------------------------
  // (이 아래는 기존에 작성하셨던 로직 그대로입니다)
  // -------------------------------------------------------------

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

  private async getTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>(
          'JWT_REFRESH_EXPIRATION_TIME',
        ) || '14d') as '14d',
      }),
    ]);
    return { access_token: accessToken, refresh_token: refreshToken };
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const saltRounds = 10;
    const hashedRefreshToken = await bcrypt.hash(refreshToken, saltRounds);
    await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
  }

  async login(user: UserResponseDto) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const tokens = await this.getTokens(payload);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async refreshAccessToken(refreshToken: string, userId: number) {
    const user = await this.usersService.findByIdWithRefreshToken(userId);
    if (!user || !user.refresh_token) {
      throw new UnauthorizedException('권한이 없거나 로그아웃된 유저입니다.');
    }
    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.refresh_token,
    );
    if (!isRefreshTokenMatching) {
      throw new UnauthorizedException('유효하지 않은 Refresh Token입니다.');
    }
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const newAccessToken = await this.jwtService.signAsync(payload);
    return { access_token: newAccessToken };
  }
}
