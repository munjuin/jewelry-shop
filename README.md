# 💍 Jewelry E-Commerce Platform

> **Node.js, Express, EJS, PostgreSQL**을 기반으로 구축한 주얼리 전문 웹 쇼핑몰 프로젝트입니다.  
> 복잡한 상품 옵션 관리, 다중 이미지 업로드(AWS S3), 트랜잭션을 활용한 안전한 주문 처리 시스템을 구현했습니다.

## 🛠 Tech Stack

| Category            | Technologies                                                                                                                                                                                                                                                                        |
| :------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend**         | ![NodeJS](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white) ![Express](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)                                                                                 |
| **Frontend**        | ![EJS](https://img.shields.io/badge/EJS-B4CA65?style=flat&logo=ejs&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) |
| **Database**        | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)                                                                                                                                                                            |
| **Infra & Storage** | ![AWS S3](https://img.shields.io/badge/AWS%20S3-569A31?style=flat&logo=amazons3&logoColor=white)                                                                                                                                                                                    |
| **Authentication**  | **Passport.js** (Local Strategy), **Bcrypt**, **Express-Session** (connect-pg-simple)                                                                                                                                                                                               |
| **API**             | **Daum Postcode API** (주소 검색)                                                                                                                                                                                                                                                   |

---

## ✨ Key Features (핵심 기능)

### 1. 사용자 (User)

- **회원가입/로그인:** Bcrypt 암호화 및 Session 기반 인증, 이메일 중복 확인 (AJAX).
- **상품 탐색:** 카테고리별 필터링, 페이지네이션, 품절 상품 오버레이 표시.
- **상품 상세:** 다중 이미지 갤러리, 옵션(사이즈/색상) 선택에 따른 **실시간 가격 계산**.
- **장바구니:** DB 기반 영구 저장, 수량 변경 및 삭제 (AJAX), **배송비 정책(10만원 이상 무료)** 자동 계산.
- **주문/결제:** **Daum 우편번호 API** 연동, 배송지 입력, 무통장 입금(가상) 프로세스.
- **마이페이지:** 주문 내역 조회 및 배송 전 **주문 취소(재고 자동 복구)** 기능.

### 2. 관리자 (Admin)

- **상품 관리:** 상품 등록/수정/삭제, **AWS S3**를 이용한 다중 이미지 업로드, 옵션 동적 추가.
- **주문 관리:** 전체 주문 내역 조회, 주문 상태 변경(결제완료/배송중 등), **송장번호(Tracking Number)** 입력.

### 3. 백엔드 핵심 로직

- **Transaction(트랜잭션):** 주문 생성 시 `주문서 생성` -> `상세 기록` -> `장바구니 비우기` -> `재고 차감`을 원자적(Atomic)으로 처리하여 데이터 무결성 보장.
- **Snapshot(스냅샷):** 상품 가격이 변동되어도 기존 주문 내역은 보존되도록 주문 시점의 가격과 옵션명을 별도 저장.
- **Upsert(업서트):** 장바구니 담기 시 중복 상품은 수량만 증가(UPDATE), 신규 상품은 추가(INSERT)하는 로직 구현.

---

## 🗂 Database Schema (ERD)

PostgreSQL을 사용하여 정규화된 관계형 데이터베이스를 설계했습니다.

| 테이블명            | 역할                            | 주요 관계                   |
| :------------------ | :------------------------------ | :-------------------------- |
| **users**           | 회원 정보 (주소 포함)           | Orders(1:N), Carts(1:1)     |
| **products**        | 상품 기본 정보                  | Options(1:N), Images(1:N)   |
| **product_options** | 옵션명, 추가금, **재고(Stock)** | Products(N:1)               |
| **product_images**  | S3 이미지 URL 저장              | Products(N:1)               |
| **carts**           | 유저별 장바구니                 | CartItems(1:N)              |
| **cart_items**      | 장바구니에 담긴 상품            | Products(N:1), Options(N:1) |
| **orders**          | 주문서 (배송지, 총액)           | OrderItems(1:N)             |
| **order_items**     | 주문 상세 (가격 스냅샷)         | Products(N:1)               |
| **sessions**        | 로그인 세션 저장소              | -                           |

---

## 🚀 Installation & Setup

### 1. 프로젝트 클론 및 패키지 설치

```bash
git clone [https://github.com/your-username/jewelry-shop.git](https://github.com/your-username/jewelry-shop.git)
cd jewelry-shop
npm install
```

### 2. 환경 변수 설정 (.env)

프로젝트 루트에 `.env` 파일을 생성하고 아래 정보를 입력하세요.

```env
PORT=
NODE_ENV=
# PostgreSQL 설정, DB 연결 정보
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=
# AWS S3 설정
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=
```

### 3. 데이터베이스 테이블 생성

`models/schema.sql` 파일 또는 아래 SQL을 실행하여 테이블을 생성합니다.
_(DBeaver 또는 psql 사용)_

```sql
-- (프로젝트 내 models/schema.sql 참조)
CREATE DATABASE jewelry_shop;
-- 이후 테이블 생성 쿼리 실행...
```

### 4. 서버 실행

```
npm run dev
```

## 📂 Project Structure

```text
jewelry-shop/
├── config/             # DB(PostgreSQL), Multer(S3), Passport 설정
├── controllers/        # 비즈니스 로직 (Admin, Auth, Cart, Order, Product)
├── middlewares/        # 인증(authMiddleware) 및 공통 미들웨어
├── models/             # DB 쿼리 및 스키마 파일
├── public/             # 정적 파일 (CSS, JS, Images)
├── routes/             # URL 라우팅 정의
├── views/              # EJS 템플릿 (View)
│   ├── admin/          # 관리자 페이지
│   ├── cart/           # 장바구니 페이지
│   ├── orders/         # 주문/결제 페이지
│   ├── partials/       # 공통 레이아웃 (Header, Footer)
│   ├── products/       # 상품 목록/상세 페이지
│   └── users/          # 로그인/회원가입/마이페이지
├── app.js              # 메인 애플리케이션 진입점
└── package.json
```

---

## 📝 License

This project is licensed under the MIT License.
