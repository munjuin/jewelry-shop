// src/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users') // DB 테이블 이름과 매칭
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column()
  name!: string;

  @Column()
  phone!: string;

  @Column({ nullable: true })
  zipcode!: string;

  @Column({ nullable: true })
  address!: string;

  @Column({ nullable: true })
  detail_address!: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'USER',
  })
  role!: 'USER' | 'ADMIN';

  @Column({ type: 'varchar', nullable: true, select: false })
  refresh_token!: string | null;

  @CreateDateColumn()
  created_at!: Date;
}
