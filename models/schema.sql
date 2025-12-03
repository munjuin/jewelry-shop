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

-- 1. 기존 테이블이 있다면 삭제
DROP TABLE IF EXISTS session;

CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "session" ("expire");

SELECT id, email, name, phone, created_at FROM users;
select * from "users"


-- 3. 만료 시간을 기준으로 인덱스 생성 (성능 향상 및 관리 용이)
CREATE INDEX IF NOT EXISTS session_expire_idx ON session (expire);



-- 1. 기존 테이블 초기화 (순서 중요: 자식부터 삭제)
DROP TABLE IF EXISTS product_options CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- 2. 상품 (Products) 테이블 - 부모 테이블
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    category VARCHAR(50),       -- ring, necklace, earring 등 (필터링용)
    status VARCHAR(20) DEFAULT 'ON_SALE' CHECK (status IN ('ON_SALE', 'SOLD_OUT')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 상품 이미지 (Product Images) - 다중 이미지 지원
-- 1개의 상품은 여러 개의 이미지를 가질 수 있음 (1:N)
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE, -- 부모 상품 삭제 시 같이 삭제
    image_url VARCHAR(500) NOT NULL,
    is_thumbnail BOOLEAN DEFAULT FALSE -- true면 목록에 표시될 대표 이미지
);

-- 4. 상품 옵션 (Product Options) - 재고 관리의 핵심
-- 1개의 상품은 여러 개의 옵션(사이즈/색상)을 가질 수 있음 (1:N)
CREATE TABLE product_options (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE, -- 부모 상품 삭제 시 같이 삭제
    option_name VARCHAR(100) NOT NULL,  -- 예: "12호", "Rose Gold"
    extra_price INTEGER DEFAULT 0,      -- 기본 가격에 더해질 추가금
    stock_quantity INTEGER DEFAULT 0    -- 옵션별 개별 재고 수량
);
