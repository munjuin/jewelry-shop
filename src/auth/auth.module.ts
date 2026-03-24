// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // 1. 유저 DB를 조회해야 하니 UsersModule을 가져옵니다. (UsersService 사용 가능해짐)
    UsersModule,

    // 2. Passport 기본 전략을 JWT로 설정합니다.
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // 3. 💡 핵심: ConfigService를 주입받아 JWT 설정을 비동기로 진행합니다.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_EXPIRATION_TIME',
          ) as unknown as '1h',
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule], // 나중에 Guard 등에서 쓸 수 있게 내보냄
})
export class AuthModule {}
