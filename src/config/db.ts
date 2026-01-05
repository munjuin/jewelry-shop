// src/config/db.ts
import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// 1. 설계 원칙: 환경 변수 타입 안전성 확보
// DB 설정 객체에 명시적 타입을 부여하여 오타를 방지합니다.
const poolConfig: PoolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  // 포트는 문자열로 오기 때문에 반드시 숫자로 변환해야 함 (설계 포인트)
  port: parseInt(process.env.DB_PORT || '5432'), 
};

const pool = new Pool(poolConfig);

// 2. 에러 핸들링 레이어화
pool.on('error', (err: Error) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// 3. 설계 원칙: ESM 표준 준수
export default pool;