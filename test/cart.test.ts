// tests/cart.test.ts
import request from 'supertest';
import express from 'express';
import cartRoutes from '../src/routes/cartRoutes';
import { AppDataSource } from '../src/config/db';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req: any, res, next) => {
  req.isAuthenticated = () => true;
  req.user = { id: 1 };
  next();
});
app.use('/', cartRoutes);

jest.mock('../src/config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    transaction: jest.fn(),
  },
}));

describe('Cart Controller 테스트 (HTTP Redirect 방식)', () => {
  const mockManager = {
    findOne: jest.fn(),
    create: jest.fn().mockReturnValue({ id: 10 }),
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.transaction as jest.Mock).mockImplementation(async (cb) =>
      cb(mockManager),
    );
  });

  it('장바구니 담기 성공 시 /cart로 리다이렉트되어야 한다 (302)', async () => {
    // 1. 유저의 장바구니 찾기 (존재한다고 가정)
    mockManager.findOne.mockResolvedValueOnce({ id: 10 });
    // 2. 장바구니 안에 동일 상품/옵션이 있는지 확인 (없다고 가정)
    mockManager.findOne.mockResolvedValueOnce(null);

    const response = await request(app)
      .post('/cart/add')
      .send({ product_id: 1, product_option_id: 5 });

    expect(response.status).toBe(302);
    expect(response.header.location).toBe('/cart');
  });
});
