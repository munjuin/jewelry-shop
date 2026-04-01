// src/auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// PassportStrategy(Strategy, 'jwt')를 작동시키는 기본 스위치입니다.
export class JwtAuthGuard extends AuthGuard('jwt') {}
