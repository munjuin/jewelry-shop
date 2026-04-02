// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Product } from './entities/product.entity';
import { ProductOption } from './entities/product-option.entity';
import { ProductImage } from './entities/product-image.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: 'localhost',
      port: 6379,
      ttl: 600, // 기본 캐시 유지 시간 (초) - 10분
    }),
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
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION_TIME: Joi.string().default('1h'),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRATION_TIME: Joi.string().default('14d'),

        // AWS S3 설정 (나중에 업로드 로직에서 사용)
        // AWS_ACCESS_KEY_ID: Joi.string().required(),
        // AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        // AWS_REGION: Joi.string().required(),
        // AWS_BUCKET_NAME: Joi.string().required(),
      }),
    }),

    // 2. [신규] TypeORM 비동기 모듈 연결 (DI 컨테이너 활용)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // ConfigService를 쓰기 위해 주입받음
      inject: [ConfigService], // 의존성 주입(DI)
      // DB연결 구성 내용
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),

        // 💡 엔티티 파일들은 다음 마일스톤(Issue #6)에서 옮길 때 여기에 추가될 예정입니다.
        entities: [
          User,
          Product,
          ProductOption,
          ProductImage,
          Order,
          OrderItem,
          Cart,
          CartItem,
        ],

        // 개발 환경에서는 synchronize를 켜서 테이블을 자동 동기화합니다.
        synchronize: true,
        logging: true, // DB 통신 로그를 터미널에서 보기 위해 켜둡니다.
        dropSchema: false,
      }),
    }),

    UsersModule,
    ProductsModule,
    AuthModule,
    CartModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
