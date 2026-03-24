// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    // 💡 핵심: new Repository()를 직접 하지 않고, NestJS가 주입해주길 기다립니다 (DI).
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // 1. 이메일로 유저 찾기 (로그인, 중복 가입 체크 시 사용)
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // 2. ID로 유저 찾기 (토큰 검증 후 유저 정보 가져올 때 사용)
  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  // 3. 새로운 유저 생성 (회원가입 시 사용)
  // (임시 파라미터. 다음 이슈에서 DTO와 암호화 로직이 추가될 예정입니다)
  async createUser(userData: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(userData);
    return this.userRepository.save(newUser);
  }
}
