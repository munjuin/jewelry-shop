# Jewelry E-Commerce Platform (Mastery Version)

> **"From JS to TS: 안정성과 확장성을 고려한 백엔드 현대화 프로젝트"**
>
> Node.js, Express 기반의 쇼핑몰 프로젝트를 **TypeScript로 마이그레이션**하고, **Jest를 활용한 테스트 자동화** 및 **GitHub Actions CI**를 구축하여 엔터프라이즈급 안정성을 확보했습니다.

---

## 🚀 Migration & Quality Achievements (기술적 성과)

이번 마이그레이션을 통해 단순한 기능 구현을 넘어, 실제 서비스 운영에서 발생할 수 있는 오류를 최소화하고 유지보수 효율을 극대화했습니다.

### 1. TypeScript Migration

- **안정성**: `strict` 모드 적용을 통해 컴파일 단계에서 잠재적 런타임 에러 차단.
- **확장성**: `express-session`, `multer-s3` 등 외부 라이브러리의 커스텀 타입 확장(`d.ts`)으로 프로젝트 전반의 타입 일관성 유지.
- **가독성**: 인터페이스 기반의 데이터 구조 정의로 코드 자동 완성 및 문서화 효과.

### 2. Robust Testing Strategy (Jest)

- **비즈니스 로직 검증**: 실제 DB 연결 없이도 복잡한 **주문 트랜잭션**과 **장바구니 로직**을 검증하기 위한 'Data Queue' Mocking 전략 도입.
- **회귀 테스트 환경**: 기능 수정 시 기존 로직의 파손 여부를 즉각 확인할 수 있는 유닛 테스트 스위트 구축.

### 3. CI Pipeline (GitHub Actions)

- **지속적 통합**: 모든 Push/PR 시 Ubuntu 환경에서 빌드 및 테스트 자동 수행.
- **품질 관리**: 테스트를 통과하지 못한 코드가 병합되지 않도록 보호 시스템 구축.

---

## 🛠 Tech Stack

| Category         | Technologies                                                                                                                                                                                                           |
| :--------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Language**     | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white) ![NodeJS](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)              |
| **Backend**      | ![Express](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)                                                                                                                     |
| **Database**     | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)                                                                                                               |
| **Infra/DevOps** | ![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=flat&logo=githubactions&logoColor=white) ![AWS S3](https://img.shields.io/badge/AWS%20S3-569A31?style=flat&logo=amazons3&logoColor=white) |
| **Testing**      | ![Jest](https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white)                                                                                                                                 |

---

## ✨ Key Features (핵심 기능)

### 1. 사용자 (User)

- **주문/결제**: Daum 우편번호 API 연동 및 배송지 관리 시스템.
- **실시간 로직**: 옵션 선택에 따른 가격 실시간 계산 및 10만원 이상 무료배송 자동 적용.
- **데이터 무결성**: 주문 시점의 가격/옵션 정보를 보존하는 **Snapshot 패턴** 적용.

### 2. 관리자 (Admin)

- **상품 관리**: AWS S3 기반의 다중 이미지 업로드 및 동적 옵션/재고 관리.
- **주문 관리**: 주문 상태 변경(결제완료/배송중/취소) 및 송장 번호 추적 시스템.

### 3. 백엔드 핵심 로직

- **Atomic Transaction**: 주문 프로세스(주문서 생성-상세 기록-장바구니 비우기-재고 차감)를 단일 트랜잭션으로 처리하여 데이터 일관성 보장.
- **Upsert Logic**: 장바구니 중복 담기 시 수량만 증가시키는 효율적인 데이터 처리.

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

```bash
# 1. 의존성 설치
npm install

# 2. 빌드 (TypeScript 컴파일)
npm run build

# 3. 테스트 실행
npm test

# 4. 개발 서버 실행 (ts-node-dev)
npm run dev
```

## 📂 Project Structure

```text
jewelry-shop/
├── src/                # 메인 소스 코드 (TypeScript)
│   ├── config/         # DB(PostgreSQL), Multer(S3), env 설정
│   ├── controllers/    # 비즈니스 로직 (Admin, Auth, Cart, Order, Product)
│   ├── middlewares/    # 인증(isAdmin, isAuthenticated) 및 공통 미들웨어
│   ├── routes/         # 도메인별 URL 라우팅 정의
│   ├── types/          # 전역 타입 정의 및 외부 모듈 확장(.d.ts)
│   ├── views/          # EJS 템플릿 (UI 레이아웃)
│   └── app.ts          # 애플리케이션 진입점 및 서버 설정
├── tests/              # Jest 기반 단위 테스트 코드 (.test.ts)
├── dist/               # 컴파일된 JavaScript 결과물 (Build Output)
├── public/             # 정적 자원 (CSS, 클라이언트 JS, Images)
├── .github/            # GitHub Actions CI 워크플로우 설정
├── .env                # 환경 변수 설정 파일 (비공개)
├── tsconfig.json       # TypeScript 컴파일 설정
├── jest.config.js      # Jest 테스트 설정
└── package.json        # 의존성 관리 및 스크립트 정의
```

## 📝 License

This project is licensed under the MIT License.
