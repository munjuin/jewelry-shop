// src/entities/User.ts
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn 
} from 'typeorm';

@Entity('users') // DB 테이블 이름과 매칭
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  zipcode: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  detail_address: string;

  @Column({ 
    type: 'varchar', 
    length: 10, 
    default: 'USER' 
  })
  role: 'USER' | 'ADMIN';

  @CreateDateColumn()
  created_at: Date;
}