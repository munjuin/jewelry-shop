-- 기존 테이블이 있다면 삭제 (초기화)
DROP TABLE IF EXISTS users CASCADE;

-- 회원(Users) 테이블 생성
CREATE TABLE users (
    id SERIAL PRIMARY KEY,              -- 고유 ID (자동 증가)
    email VARCHAR(255) UNIQUE NOT NULL, -- 이메일 (중복 불가, 필수)
    password_hash VARCHAR(255) NOT NULL,-- 암호화된 비밀번호 (필수)
    name VARCHAR(100) NOT NULL,         -- 이름
    phone VARCHAR(20) NOT NULL,         -- 휴대폰 번호
    
    -- [Daum 우편번호 API 대응 컬럼]
    zipcode VARCHAR(10),                -- 우편번호
    address VARCHAR(255),               -- 기본 주소
    detail_address VARCHAR(255),        -- 상세 주소
    
    -- [권한 관리]
    role VARCHAR(10) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 가입일
);