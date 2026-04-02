// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 정의되지 않은 속성이 들어오면 자동으로 제거해버림 (보안 강화)
      forbidNonWhitelisted: true, // DTO에 없는 속성이 들어오면 아예 에러를 뿜고 막아버림
      transform: true, // 클라이언트가 보낸 텍스트 데이터를 DTO의 타입(Number, Boolean 등)에 맞게 자동 변환
    }),
  );

  // 💡 클라이언트가 '/uploads' 경로로 요청하면 서버의 실제 'uploads' 폴더 안의 파일을 보여줌
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  return console.error(err);
});
