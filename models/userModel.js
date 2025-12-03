const db = require('../config/db');
const bcrypt = require('bcrypt');

class User {
  static async create(userInfo) {
    const { email, password, name, phone } = userInfo;
      
    // 비밀번호 암호화 (Salt Rounds: 10)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const queryText = `
      INSERT INTO users (email, password_hash, name, phone)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, created_at;
    `;
    
    try {
      const result = await db.query(queryText, [email, passwordHash, name, phone]);
      return result.rows[0]; // 생성된 사용자 정보 반환
    } catch (error) {
      throw error; // 컨트롤러에서 처리하도록 에러 전파
    }
  }

  static async findByEmail(email) {
    const queryText = `SELECT * FROM users WHERE email = $1`;
        
    try {
      const result = await db.query(queryText, [email]);
      return result.rows[0]; // 사용자가 없으면 undefined 반환
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    const queryText = `SELECT * FROM users WHERE id = $1`;
        
        try {
            const result = await db.query(queryText, [id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
  }
}

module.exports = User;