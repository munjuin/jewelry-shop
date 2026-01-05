import request from 'supertest';
import express from 'express';
import path from 'path';
import mainRoutes from '../src/routes/mainRoutes';

const app = express();

/**
 * 1. 뷰 엔진 및 경로 설정 (src/views)
 */
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, '../src/views'));

/**
 * 2. DB 및 세션 모킹 미들웨어
 */
const mockDb = {
    query: jest.fn()
};

app.use((req: any, res, next) => {
    // DB 객체 주입
    req.db = mockDb;
    
    // 컨트롤러에서 req.session.user를 참조하므로 세션 객체를 가짜로 만듭니다.
    req.session = { user: null };
    
    // 이전에 겪었던 header.ejs의 user 정의 에러 방지용
    res.locals.user = null; 
    
    next();
});

// 3. 라우터 연결
app.use('/', mainRoutes);

describe('Main Controller 마이그레이션 테스트', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('메인 페이지 호출 시 최신 상품 8개를 조회하고 정상적으로 렌더링해야 한다', async () => {
        // [Mocking] DB에서 반환할 가짜 상품 데이터 2개
        const mockProducts = [
            { id: 1, name: '다이아몬드 목걸이', price: 1000000, created_at: new Date() },
            { id: 2, name: '사파이어 반지', price: 500000, created_at: new Date() }
        ];
        
        mockDb.query.mockResolvedValueOnce({ rows: mockProducts });

        const response = await request(app).get('/');

        // 실패 시 에러 로그 출력
        if (response.status !== 200) {
            console.log('❌ 메인 페이지 테스트 실패:', response.text);
        }

        // 검증 1: HTTP 상태 코드가 200인가?
        expect(response.status).toBe(200);

        // 검증 2: DB에서 가져온 상품 이름이 페이지 내에 포함되어 있는가?
        expect(response.text).toContain('다이아몬드 목걸이');
        expect(response.text).toContain('사파이어 반지');
        
        // 검증 3: DB 쿼리가 한 번 호출되었는가?
        expect(mockDb.query).toHaveBeenCalledTimes(1);
        // 검증 4: 쿼리문에 LIMIT 8이 포함되어 있는가?
        expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining('LIMIT 8'));
    });

    it('DB 조회 중 오류가 발생하면 500 에러를 반환해야 한다', async () => {
        // [Mocking] 강제로 에러 발생시킴
        mockDb.query.mockRejectedValueOnce(new Error('DB 연결 실패'));

        const response = await request(app).get('/');

        // mainController에서 next(error)를 호출하므로, 
        // 테스트 환경에 에러 핸들러가 없으면 기본적으로 500 응답이 옵니다.
        expect(response.status).toBe(500);
    });
});