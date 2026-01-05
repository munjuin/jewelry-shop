import request from 'supertest';
import express from 'express';
import path from 'path';
import orderRoutes from '../src/routes/orderRoutes';

const app = express();

// 1. 기본 설정
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, '../src/views'));

/**
 * 2. DB 및 클라이언트 모킹 (데이터 큐 방식)
 */
let dataQueue: any[] = [];

const mockClient = {
    query: jest.fn(async (sql: string): Promise<any> => {
        const upperSql = sql.trim().toUpperCase();
        // 트랜잭션 제어어는 데이터 소모 없이 즉시 성공 반환
        if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(upperSql)) {
            return { rows: [], rowCount: 1 };
        }
        return dataQueue.shift() || { rows: [], rowCount: 0 };
    }),
    release: jest.fn()
};

const mockDb = {
    query: jest.fn(async (): Promise<any> => {
        return dataQueue.shift() || { rows: [], rowCount: 0 };
    }),
    connect: jest.fn().mockResolvedValue(mockClient)
};

// 가짜 인증 및 유저 정보 주입
app.use((req: any, res, next) => {
    req.db = mockDb;
    req.isAuthenticated = () => true;
    req.user = { id: 1, email: 'owner@test.com' };
    res.locals.user = req.user;
    next();
});

// 3. 라우터 연결
app.use('/', orderRoutes);

describe('Order Controller 테스트 (HTTP Redirect 방식)', () => {
    it('주문 취소 성공 시 /mypage/orders로 리다이렉트되어야 한다 (302)', async () => {
        dataQueue.push({ rows: [{ id: 99, status: 'PAID', user_id: 1 }], rowCount: 1 }); // 주문 조회
        dataQueue.push({ rows: [], rowCount: 1 }); // 상태 변경
        dataQueue.push({ rows: [{ product_id: 1, quantity: 2, option_snapshot: 'Gold' }], rowCount: 1 }); // 상세 조회
        dataQueue.push({ rows: [], rowCount: 1 }); // 재고 복구

        const response = await request(app).post('/orders/99/cancel');

        // ✅ 검증: 상태 코드 302와 Location 헤더
        expect(response.status).toBe(302);
        expect(response.header.location).toBe('/mypage/orders');
    });
});