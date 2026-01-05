import request from 'supertest';
import express from 'express';
import cartRoutes from '../src/routes/cartRoutes';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let dataQueue: any[] = [];
const mockClient = {
    query: jest.fn(async (sql: string): Promise<any> => {
        if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql.trim().toUpperCase())) return { rows: [], rowCount: 1 };
        return dataQueue.shift() || { rows: [], rowCount: 0 };
    }),
    release: jest.fn()
};
const mockDb = {
    query: jest.fn(async (): Promise<any> => dataQueue.shift() || { rows: [], rowCount: 0 }),
    connect: jest.fn().mockResolvedValue(mockClient)
};

app.use((req: any, res, next) => {
    req.db = mockDb;
    req.isAuthenticated = () => true;
    req.user = { id: 1 };
    next();
});
app.use('/', cartRoutes);

describe('Cart Controller 테스트 (HTTP Redirect 방식)', () => {
    it('장바구니 담기 성공 시 /cart로 리다이렉트되어야 한다 (302)', async () => {
        dataQueue.push({ rows: [{ id: 10 }], rowCount: 1 }); // Cart 조회
        dataQueue.push({ rows: [], rowCount: 0 });           // Item 중복 확인
        dataQueue.push({ rows: [], rowCount: 1 });           // Insert

        const response = await request(app).post('/cart/add').send({ product_id: 1, product_option_id: 5 });

        // ✅ 검증: 상태 코드 302와 Location 헤더
        expect(response.status).toBe(302);
        expect(response.header.location).toBe('/cart');
    });
});