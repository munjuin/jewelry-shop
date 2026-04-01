import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: '유효한 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일은 필수 입력값입니다.' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: '이름은 필수 입력값입니다.' })
  name!: string;

  @IsString()
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: '전화번호는 필수 입력값입니다.' })
  phone!: string;

  @IsString()
  @IsNotEmpty({ message: '우편번호는 필수 입력값입니다.' })
  zipcode!: string;

  @IsString()
  @IsNotEmpty({ message: '기본 주소는 필수 입력값입니다.' })
  address!: string;

  @IsString()
  @IsNotEmpty({ message: '상세 주소는 필수 입력값입니다.' })
  detail_address!: string;
}
