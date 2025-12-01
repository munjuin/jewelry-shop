// config/db.js
const { Pool } = require('pg');
require('dotenv').config(); // .env 파일 로드

// 1. Connection Pool 생성
// Pool은 매번 연결을 새로 맺지 않고 미리 맺어둔 연결을 재사용하여 성능을 높입니다.
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: false // 로컬 환경에서 SSL 인증 없이 연결 허용
        
});


// 2. 연결 이벤트 리스너 (로그용)
pool.on('connect', () => {
    console.log('✅ Connected to the PostgreSQL database successfully!');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

// 3. 모듈 내보내기
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool: pool, // 필요시 pool 자체를 쓸 수 있게 export
};