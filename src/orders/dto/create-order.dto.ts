import { IsString, IsNotEmpty } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: '수령인 이름은 필수입니다.' })
  receiver_name!: string;

  @IsString()
  @IsNotEmpty({ message: '수령인 연락처는 필수입니다.' })
  receiver_phone!: string;

  @IsString()
  @IsNotEmpty({ message: '우편번호는 필수입니다.' })
  zipcode!: string;

  @IsString()
  @IsNotEmpty({ message: '기본 주소는 필수입니다.' })
  address!: string;

  @IsString()
  @IsNotEmpty({ message: '상세 주소는 필수입니다.' })
  detail_address!: string;
}
