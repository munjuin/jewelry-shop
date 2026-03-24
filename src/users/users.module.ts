// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity'; // ✅ 경로를 맞춰주세요

@Module({
  // 1. 이 모듈 안에서 User 레포지토리를 쓸 수 있게 허가합니다.
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  // 2. 나중에 AuthModule 등 다른 곳에서도 UsersService를 쓸 수 있게 밖으로 내보냅니다.
  exports: [UsersService],
})
export class UsersModule {}
