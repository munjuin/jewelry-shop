// tests/admin.test.ts
import request from 'supertest';
import express from 'express';
import path from 'path';
import adminRoutes from '../src/routes/adminRoutes';
import { AppDataSource } from '../src/config/db';

const app = express();

// 1. 기본 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, '../src/views'));

// TypeORM 완벽 모킹
jest.mock('../src/config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    transaction: jest.fn(),
  },
}));

// 가짜 인증 및 관리자 권한 주입
app.use((req: any, res, next) => {
  req.isAuthenticated = () => true;
  req.user = { id: 1, email: 'admin@test.com', role: 'admin' };
  res.locals.user = req.user;
  next();
});

// 3. 라우터 연결
app.use('/admin', adminRoutes);

describe('Admin Controller 테스트', () => {
  const mockRepo = {
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mockManager = {
    create: jest.fn().mockReturnValue({ id: 50 }),
    save: jest.fn().mockResolvedValue({}),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);
    (AppDataSource.transaction as jest.Mock).mockImplementation(async (cb) =>
      cb(mockManager),
    );
  });

  describe('POST /admin/products (상품 등록 - 트랜잭션)', () => {
    it('상품 정보, 이미지, 옵션이 순서대로 DB에 저장되고 리다이렉트되어야 한다', async () => {
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
          user: { email: 'owner@test.com', name: '주인님' },
          final_amount: 50000,
          status: 'PAID',
          created_at: new Date(),
          receiver_name: '수령인',
          receiver_phone: '010-0000-0000',
        },
      ];

      mockRepo.find.mockResolvedValueOnce(mockOrders);

      const response = await request(app).get('/admin/orders');

      expect(response.status).toBe(200);
      expect(response.text).toContain('주문 관리');
      expect(response.text).toContain('owner@test.com');
    });
  });

  describe('POST /admin/orders/:id/status (주문 상태 업데이트)', () => {
    it('주문 상태와 송장 정보를 성공적으로 업데이트하고 리다이렉트해야 한다', async () => {
      mockRepo.update.mockResolvedValueOnce({});

      const response = await request(app).post('/admin/orders/1/status').send({
        status: 'SHIPPED',
        courier: '우체국택배',
        tracking_number: '1234567890',
      });

      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/admin/orders?status=updated');
    });
  });

  describe('POST /admin/products/:id/delete (상품 삭제)', () => {
    it('상품을 삭제하고 목록 페이지로 리다이렉트해야 한다', async () => {
      mockRepo.delete.mockResolvedValueOnce({});

      const response = await request(app).post('/admin/products/50/delete');

      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/admin/products?status=deleted');
    });
  });
});
