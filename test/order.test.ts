// tests/order.test.ts
import request from 'supertest';
import express from 'express';
import path from 'path';
import orderRoutes from '../src/routes/orderRoutes';
import { AppDataSource } from '../src/config/db';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, '../src/views'));

app.use((req: any, res, next) => {
    req.isAuthenticated = () => true;
    req.user = { id: 1, email: 'owner@test.com' };
    res.locals.user = req.user;
    next();
});

app.use('/', orderRoutes);

jest.mock('../src/config/db', () => ({
    AppDataSource: {
        getRepository: jest.fn(),
        transaction: jest.fn()
    }
}));

describe('Order Controller 테스트 (HTTP Redirect 방식)', () => {
    const mockManager = {
        findOne: jest.fn(),
        save: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (AppDataSource.transaction as jest.Mock).mockImplementation(async (cb) => cb(mockManager));
    });

    it('주문 취소 성공 시 /mypage/orders로 리다이렉트되어야 한다 (302)', async () => {
        // 주문 내역 및 연결된 아이템을 찾은 것으로 모킹
        mockManager.findOne.mockResolvedValueOnce({ 
            id: 99, 
            status: 'PAID', 
            user: { id: 1 },
            items: [
                { quantity: 2, option_snapshot: 'Gold', product: { id: 1 } }
            ]
        });
        
        // 재고 복구를 위해 옵션 찾기 모킹
        mockManager.findOne.mockResolvedValueOnce({
            id: 5, stock_quantity: 10
        });

        const response = await request(app).post('/orders/99/cancel');

        expect(response.status).toBe(302);
        expect(response.header.location).toBe('/mypage/orders');
    });
});