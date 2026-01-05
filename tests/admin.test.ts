import request from 'supertest';
import express from 'express';
import path from 'path';
import adminRoutes from '../src/routes/adminRoutes';

const app = express();

// 1. 기본 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, '../src/views'));

/**
 * 2. DB 및 클라이언트 모킹 (데이터 큐 방식)
 */
let dataQueue: any[] = [];

const mockClient = {
    query: jest.fn(async (sql: string): Promise<any> => {
        const upperSql = sql.trim().toUpperCase();
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

// 가짜 인증 및 관리자 권한 주입
app.use((req: any, res, next) => {
    req.db = mockDb;
    req.isAuthenticated = () => true;
    // 관리자(admin) 권한 설정
    req.user = { id: 1, email: 'admin@test.com', role: 'admin' };
    res.locals.user = req.user;
    next();
});

// 3. 라우터 연결
app.use('/admin', adminRoutes);

describe('Admin Controller 테스트', () => {

    beforeEach(() => {
        dataQueue = [];
        jest.clearAllMocks();
    });

    describe('POST /admin/products (상품 등록 - 트랜잭션)', () => {
        it('상품 정보, 이미지, 옵션이 순서대로 DB에 저장되고 리다이렉트되어야 한다', async () => {
            // [데이터 큐 순서]
            // 1. 상품 기본 정보 INSERT (RETURNING id)
            dataQueue.push({ rows: [{ id: 50 }], rowCount: 1 });
            // 2. 첫 번째 이미지 INSERT
            dataQueue.push({ rows: [], rowCount: 1 });
            // 3. 첫 번째 옵션 INSERT
            dataQueue.push({ rows: [], rowCount: 1 });

            // 파일 업로드 시뮬레이션을 위해 .attach() 사용 가능하지만, 
            // 여기선 컨트롤러 로직 검증을 위해 필드만 전송
            const response = await request(app)
                .post('/admin/products')
                .field('name', '신상 다이아 반지')
                .field('price', '1000000')
                .field('description', '아주 영롱합니다')
                .field('category', 'ring')
                .field('option_name', '14K Gold')
                .field('extra_price', '0')
                .field('stock_quantity', '10');

            expect(response.status).toBe(302);
            expect(response.header.location).toBe('/admin/products?status=success');
        });
    });

    describe('GET /admin/orders (주문 관리 목록)', () => {
    it('모든 사용자의 주문 내역을 조회하여 렌더링해야 한다', async () => {
        const mockOrders = [
            { 
                id: 1, 
                user_name: '주인님', 
                email: 'owner@test.com', 
                // ✅ EJS가 기대하는 이름인 final_amount로 수정
                final_amount: 50000, 
                status: 'PAID',
                created_at: new Date(), 
                receiver_name: '수령인',
                receiver_phone: '010-0000-0000'
            }
        ];
        
        dataQueue.push({ rows: mockOrders, rowCount: 1 });

        const response = await request(app).get('/admin/orders');

        expect(response.status).toBe(200);
        expect(response.text).toContain('주문 관리');
        expect(response.text).toContain('owner@test.com');
    });
});

    describe('POST /admin/orders/:id/status (주문 상태 업데이트)', () => {
        it('주문 상태와 송장 정보를 성공적으로 업데이트하고 리다이렉트해야 한다', async () => {
            dataQueue.push({ rows: [], rowCount: 1 });

            const response = await request(app)
                .post('/admin/orders/1/status')
                .send({
                    status: 'SHIPPED',
                    courier: '우체국택배',
                    tracking_number: '1234567890'
                });

            expect(response.status).toBe(302);
            expect(response.header.location).toBe('/admin/orders?status=updated');
        });
    });

    describe('POST /admin/products/:id/delete (상품 삭제)', () => {
        it('상품을 삭제하고 목록 페이지로 리다이렉트해야 한다', async () => {
            dataQueue.push({ rows: [], rowCount: 1 });

            const response = await request(app).post('/admin/products/50/delete');

            expect(response.status).toBe(302);
            expect(response.header.location).toBe('/admin/products?status=deleted');
        });
    });
});