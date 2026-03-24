import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 이메일로 유저 찾기
   * 로그인 시 password 비교를 위해 select: false를 무시하고 가져옵니다.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'name', 'role'],
    });
  }

  /**
   * ID로 유저 찾기
   */
  async findById(id: number): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user ? new UserResponseDto(user) : null;
  }

  /**
   * 회원가입 (비밀번호 암호화 + DTO 반환)
   */
  async createUser(userData: Partial<User>): Promise<UserResponseDto> {
    // 1. 중복 가입 방지
    const existingUser = await this.findByEmail(userData.email!);
    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    // 2. 비밀번호 단방향 암호화
    if (userData.password) {
      const saltRounds = 10;
      userData.password = await bcrypt.hash(userData.password, saltRounds);
    }

    // 3. 엔티티 저장
    const newUser = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(newUser);

    // 4. 💡 [캡슐화 방식] 생성자를 호출하여 바로 반환!
    // 서비스는 "어떤 필드가 옮겨지는지" 일일이 몰라도 됩니다.
    return new UserResponseDto(savedUser);
  }
}
