// tests/product.test.ts
import request from 'supertest';
import express from 'express';
import path from 'path';
import productRoutes from '../src/routes/productRoutes';
import { AppDataSource } from '../src/config/db';

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, '../src/views'));

app.use((req: any, res, next) => {
  res.locals.user = { role: 'user' };
  next();
});

app.use('/', productRoutes);

jest.mock('../src/config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('Product Controller 마이그레이션 테스트', () => {
  const mockRepo = { findAndCount: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);
  });

  it('GET /products 호출 시 200 상태코드와 상품 목록을 반환해야 한다', async () => {
    const mockProducts = [
      {
        id: 1,
        name: '테스트 목걸이',
        price: 10000,
        images: [{ image_url: 'test.jpg', is_thumbnail: true }],
      },
    ];
    const mockTotalCount = 1;

    // TypeORM findAndCount는 [데이터배열, 총갯수] 를 반환합니다.
    mockRepo.findAndCount.mockResolvedValueOnce([mockProducts, mockTotalCount]);

    const response = await request(app).get('/products');

    if (response.status !== 200) {
      console.log('❌ 테스트 실패 상세 원인:', response.text);
    }

    expect(response.status).toBe(200);
    expect(response.text).toContain('테스트 목걸이');
  });
});
