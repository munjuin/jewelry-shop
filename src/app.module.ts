import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // ConfigModule을 전역(Global)으로 설정하여 어디서든 환경변수를 꺼내 쓸 수 있게 합니다.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // 최상단의 .env 파일을 읽습니다.
      validationSchema: Joi.object({
        // 서버 기본 설정
        PORT: Joi.number().default(3000),

        // PostgreSQL DB 설정 (이름은 기존 .env 변수명과 일치시켜주세요)
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),

        // JWT 비밀키 (나중에 Auth 도메인에서 사용)
        // JWT_SECRET: Joi.string().required(), // 당장 없으면 에러가 나니 일단 주석 처리해둡니다.

        // AWS S3 설정 (나중에 업로드 로직에서 사용)
        // AWS_ACCESS_KEY_ID: Joi.string().required(),
        // AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        // AWS_REGION: Joi.string().required(),
        // AWS_BUCKET_NAME: Joi.string().required(),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
