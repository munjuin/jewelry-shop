import request from 'supertest';
import express from 'express';
import path from 'path';
import productRoutes from '../src/routes/productRoutes';

const app = express();

/**
 * 1. 뷰 엔진 및 경로 설정
 * __dirname(tests 폴더)에서 한 단계 올라가 src/views를 가리킵니다.
 */
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, '../src/views'));

/**
 * 2. DB 모킹 미들웨어
 * 컨트롤러에서 req.db.query를 사용하므로 똑같은 구조로 만들어줍니다.
 */
const mockDb = {
    query: jest.fn()
};

app.use((req: any, res, next) => {
    req.db = mockDb;
    // EJS 템플릿이 에러 나지 않도록 가짜 유저 객체를 주입합니다.
    res.locals.user = { role: 'user' }; // 또는 관리자 테스트 시 'admin'
    next();
});

// 3. 라우터 연결 (경로 중첩 방지를 위해 '/'로 연결)
app.use('/', productRoutes);

describe('Product Controller 마이그레이션 테스트', () => {
    it('GET /products 호출 시 200 상태코드와 상품 목록을 반환해야 한다', async () => {
        // [Mocking] 1번째 쿼리: 상품 목록 데이터
        mockDb.query.mockResolvedValueOnce({
            rows: [
                { id: 1, name: '테스트 목걸이', price: 10000, image_url: 'test.jpg' }
            ]
        });

        // [Mocking] 2번째 쿼리: 전체 개수 데이터 (parseInt용 count 문자열)
        mockDb.query.mockResolvedValueOnce({
            rows: [{ count: '1' }]
        });

        const response = await request(app).get('/products');

        // 에러 발생 시 상세 내용을 볼 수 있게 로그 추가
        if (response.status !== 200) {
            console.log('❌ 테스트 실패 상세 원인:', response.text);
        }

        expect(response.status).toBe(200);
        expect(response.text).toContain('테스트 목걸이');
    });
});