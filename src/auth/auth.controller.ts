// src/auth/auth.controller.ts

// 💡 1. [핵심 해결] NestJS에서 사용하는 모든 데코레이터와 예외 처리를 정확하게 임포트합니다!
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
  Req,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service'; // ✅ usersService 주입을 위해 필요
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';

// 💡 2. [핵심 해결] 우리가 만든 DTO 파일들의 경로를 정확히 임포트합니다.
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

// 💡 3. Express의 Request는 타입만 가져옵니다.
import type { Request } from 'express';

// 커스텀 인터페이스
interface RequestWithUser extends Request {
  user: {
    sub: number;
    email: string;
    role: string;
    refreshToken: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 일치하지 않습니다.',
      );
    }

    return this.authService.login(user);
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  async refresh(@Req() req: RequestWithUser) {
    const user = req.user;
    return this.authService.refreshAccessToken(user.refreshToken, user.sub);
  }
}
