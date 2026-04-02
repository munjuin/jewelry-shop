// src/users/dto/create-user.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일은 필수 입력값입니다.' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: '이름은 필수 입력값입니다.' })
  name!: string;

  @IsString()
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  @IsNotEmpty()
  password!: string;

  // 💡 @IsPhoneNumber() 대신 정규식(@Matches)을 사용하여 한국식 번호 형식을 허용합니다.
  @IsString()
  @IsNotEmpty()
  @Matches(/^01([0|1|6|7|8|9]?)-?([0-9]{3,4})-?([0-9]{4})$/, {
    message: '유효한 전화번호 형식(010-0000-0000)이 아닙니다.',
  })
  phone!: string;

  // 💡 누락되었던 주소 필드 3대장을 확실하게 추가해 줍니다.
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
