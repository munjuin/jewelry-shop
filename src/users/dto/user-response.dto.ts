// users/dto/user-response.dto.ts
import { User } from '../../entities/user.entity';

export class UserResponseDto {
  // 💡 [핵심] 생성자 캡슐화: 엔티티를 받아서 자신을 조립함
  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.phone = user.phone;
    this.role = user.role;
    this.zipcode = user.zipcode;
    this.address = user.address;
    this.detail_address = user.detail_address;
    this.created_at = user.created_at;
  }

  id: number;
  email: string;
  name: string;
  phone: string;
  role: string;
  zipcode?: string;
  address?: string;
  detail_address?: string;
  created_at: Date;
}
