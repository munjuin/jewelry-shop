import { Pool } from 'pg';
import { UserShape } from '../models/userModel';

// 1. express-session 모듈 확장 (이 부분이 추가되어야 합니다)
import 'express-session';
declare module 'express-session' {
  interface SessionData {
    user: UserShape; // 또는 기존에 정의하신 상세 객체 타입
  }
}

// 2. 기존 Express 네임스페이스 확장
declare global {
  namespace Express {
    interface User extends UserShape {}
    interface Request {
      db: Pool;
    }
  }
}