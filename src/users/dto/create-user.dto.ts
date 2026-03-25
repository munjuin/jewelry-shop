import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsPhoneNumber,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일은 필수 입력값입니다.' })
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  phone!: string;
}
