// src/auth/guards/jwt-refresh-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// 'jwt-refresh'라는 이름의 Strategy를 작동시키는 스위치입니다.
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {}
