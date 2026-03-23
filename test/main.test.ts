// tests/main.test.ts
import request from 'supertest';
import express from 'express';
import path from 'path';
import mainRoutes from '../src/routes/mainRoutes';
import { AppDataSource } from '../src/config/db';

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, '../src/views'));

app.use((req: any, res, next) => {
  req.session = { user: null };
  res.locals.user = null;
  next();
});

app.use('/', mainRoutes);

jest.mock('../src/config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('Main Controller 마이그레이션 테스트', () => {
  const mockRepo = { find: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);
  });

  it('메인 페이지 호출 시 최신 상품 8개를 조회하고 정상적으로 렌더링해야 한다', async () => {
    const mockProducts = [
      {
        id: 1,
        name: '다이아몬드 목걸이',
        price: 1000000,
        created_at: new Date(),
        images: [],
      },
      {
        id: 2,
        name: '사파이어 반지',
        price: 500000,
        created_at: new Date(),
        images: [],
      },
    ];

    mockRepo.find.mockResolvedValueOnce(mockProducts);

    const response = await request(app).get('/');

    if (response.status !== 200) {
      console.log('❌ 메인 페이지 테스트 실패:', response.text);
    }

    expect(response.status).toBe(200);
    expect(response.text).toContain('다이아몬드 목걸이');
    expect(response.text).toContain('사파이어 반지');

    expect(mockRepo.find).toHaveBeenCalledTimes(1);
    // TypeORM에서는 LIMIT 8 대신 take: 8 옵션을 사용하므로 객체 상태로 검증
    expect(mockRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ take: 8 }),
    );
  });

  it('DB 조회 중 오류가 발생하면 500 에러를 반환해야 한다', async () => {
    mockRepo.find.mockRejectedValueOnce(new Error('DB 연결 실패'));

    const response = await request(app).get('/');
    expect(response.status).toBe(500);
  });
});
