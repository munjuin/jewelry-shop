// src/users/users.service.ts
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // 이메일로 유저 찾기
  // 로그인 시 password 비교를 위해 select: false를 무시하고 가져옵니다.
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'name', 'role'],
    });
  }

  // ID로 유저 찾기
  async findById(id: number): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user ? new UserResponseDto(user) : null;
  }

  // 회원가입 로직 강화
  async createUser(userData: Partial<CreateUserDto>): Promise<UserResponseDto> {
    // 1. 1차 체크 (일반적인 상황에서의 빠른 응답)
    const existingUser = await this.findByEmail(userData.email!);
    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    // 2. 비밀번호 암호화
    if (userData.password) {
      const saltRounds = 10;
      userData.password = await bcrypt.hash(userData.password, saltRounds);
    }

    try {
      const newUser = this.userRepository.create(userData);
      const savedUser = await this.userRepository.save(newUser);
      return new UserResponseDto(savedUser);
    } catch (error) {
      // 💡 [핵심 트러블슈팅] DB 단의 유니크 제약 조건 위반 에러 처리
      // PostgreSQL의 유니크 위반 에러 코드는 '23505'입니다.
      if (error instanceof QueryFailedError) {
        // 💡 [핵심] driverError가 any이므로, 우리가 필요한 'code'가 있는 타입으로 단언(Assertion)합니다.
        // 이렇게 하면 'Unsafe assignment'와 'Unsafe member access' 에러가 모두 사라집니다.
        const dbError = error.driverError as { code?: string };

        if (dbError.code === '23505') {
          throw new ConflictException(
            '이미 등록된 이메일 주소입니다. (동시 요청 방어)',
          );
        }
      }

      // 그 외 알 수 없는 에러는 기존처럼 500 에러 처리
      throw new InternalServerErrorException(
        '서버 오류로 인해 회원가입에 실패했습니다.',
      );
    }
  }

  // [추가] Refresh Token을 DB에 저장(또는 삭제)합니다.
  async updateRefreshToken(
    id: number,
    refreshToken: string | null,
  ): Promise<void> {
    await this.userRepository.update(id, { refresh_token: refreshToken });
  }

  // [추가] ID로 유저를 찾되, 보안 방패(select: false)를 뚫고 refresh_token 필드까지 강제로 가져옵니다.
  async findByIdWithRefreshToken(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'role', 'refresh_token'], // 해시된 리프레시 토큰 포함
    });
  }
}
