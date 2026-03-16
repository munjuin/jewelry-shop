// src/config/db.ts
import { Pool, PoolConfig } from 'pg';
import { DataSource } from 'typeorm'; // ✅ TypeORM 임포트 추가
import dotenv from 'dotenv';

dotenv.config();

// ---------------------------------------------------------
// [Legacy] 기존 구형 엔진 (Raw SQL 및 세션 유지용 pg Pool)
// ---------------------------------------------------------
const poolConfig: PoolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'), 
};

const pool = new Pool(poolConfig);

pool.on('error', (err: Error) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// ---------------------------------------------------------
// [New] 새로운 신형 엔진 (향후 TypeORM Entity/Repository용)
// ---------------------------------------------------------
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../entities/*.{js,ts}'], // 나중에 생성할 엔티티 경로
  synchronize: true, // Entity 변경 시 스키마 자동 동기화 (개발용)
  logging: false,
});

// 기존 시스템(Session, 미들웨어)이 망가지지 않도록 default export는 그대로 유지합니다.
export default pool;