import db from '../config/db';
import bcrypt from 'bcrypt';
import { QueryResult } from 'pg';

// 1. 데이터베이스 유저 테이블 구조 정의
export interface UserShape {
  id?: number;
  email: string;
  password_hash: string;
  name: string;
  phone?: string;
  created_at?: Date;
}

// 2. 회원가입 시 입력받는 데이터 타입
export interface UserCreateInput {
  email: string;
  password: string; // 해싱 전 비밀번호
  name: string;
  phone?: string;
}

class User {
  /**
   * 사용자 생성 (회원가입)
   */
  static async create(userInfo: UserCreateInput): Promise<UserShape> {
    const { email, password, name, phone } = userInfo;
    
    // 비밀번호 암호화 (Salt Rounds: 10)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const queryText = `
      INSERT INTO users (email, password_hash, name, phone)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, created_at;
    `;
    
    try {
      // 제네릭 <UserShape>을 사용하여 결과 타입을 명시합니다.
      const result: QueryResult<UserShape> = await db.query(queryText, [email, passwordHash, name, phone]);
      return result.rows[0]; 
    } catch (error) {
      console.error('User.create Error:', error);
      throw error;
    }
  }

  /**
   * 이메일로 사용자 찾기 (로그인 시 사용)
   */
  static async findByEmail(email: string): Promise<UserShape | undefined> {
    const queryText = `SELECT * FROM users WHERE email = $1`;
        
    try {
      const result: QueryResult<UserShape> = await db.query(queryText, [email]);
      return result.rows[0]; // 사용자가 없으면 undefined 반환
    } catch (error) {
      console.error('User.findByEmail Error:', error);
      throw error;
    }
  }

  /**
   * ID로 사용자 찾기 (세션 복구 시 사용)
   */
  static async findById(id: number): Promise<UserShape | undefined> {
    const queryText = `SELECT * FROM users WHERE id = $1`;
        
    try {
      const result: QueryResult<UserShape> = await db.query(queryText, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('User.findById Error:', error);
      throw error;
    }
  }
}

export default User;