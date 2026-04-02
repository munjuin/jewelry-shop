// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { Request } from 'express'; // Express Request 타입 임포트

// 💡 JWT 가드를 통과하면 req 객체에 user 정보가 담깁니다. 그 형태를 정의합니다.
interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    role: 'USER' | 'ADMIN';
    refreshToken?: string; // Refresh 전략에서 넘어올 수 있는 토큰 원문
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    return await this.authService.signup(createUserDto);
  }

  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  async checkEmail(@Body() checkEmailDto: CheckEmailDto) {
    return await this.authService.checkEmail(checkEmailDto.email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }
    return await this.authService.login(user);
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: RequestWithUser) {
    return await this.authService.logout(req.user.id);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  // 💡 더 이상 any를 쓰지 않고 RequestWithUser 타입을 사용합니다.
  async refresh(@Req() req: RequestWithUser) {
    // 프론트엔드에서 보낸 Refresh Token 추출 로직 (가드가 넘겨준 방식에 따라 다를 수 있음)
    // 만약 JwtRefreshStrategy에서 validate 시점에 req.user.refreshToken에 담아준다면:
    const refreshToken = req.user.refreshToken || '';

    // 만약 헤더에서 직접 꺼내야 한다면 (Bearer ...):
    // const refreshToken = req.headers.authorization?.replace('Bearer ', '') || '';

    return await this.authService.refreshAccessToken(refreshToken, req.user.id);
  }
}
