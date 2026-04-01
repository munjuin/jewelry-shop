import { IsEmail, IsNotEmpty } from 'class-validator';

export class CheckEmailDto {
  @IsEmail({}, { message: '유효한 이메일 형식이 아닙니다.' })
  @IsNotEmpty()
  email!: string;
}
