import request from 'supertest';
import express from 'express';
import path from 'path';
import session from 'express-session';
import passport from 'passport';
import authRoutes from '../src/routes/authRoutes';
import User from '../src/models/userModel';

// 1. User 모델 모킹 (실제 DB 연결 없이 로직만 테스트)
jest.mock('../src/models/userModel');

const app = express();

/**
 * 2. Express 설정 (실제 app.ts의 환경과 유사하게 구성)
 */
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, '../src/views'));

// 세션 및 Passport 초기화
app.use(session({ 
    secret: 'test-secret', 
    resave: false, 
    saveUninitialized: false 
}));
app.use(passport.initialize());
app.use(passport.session());

// 뷰 렌더링 시 user 변수 에러 방지용 미들웨어
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// 3. 라우터 연결
app.use('/', authRoutes);

describe('Auth Controller 마이그레이션 테스트', () => {
    
    // 각 테스트가 끝나면 모킹된 데이터를 초기화합니다.
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /login', () => {
        it('로그인 페이지가 정상적으로 렌더링되어야 한다', async () => {
            const response = await request(app).get('/login');
            expect(response.status).toBe(200);
            expect(response.text).toContain('로그인');
        });
    });

    describe('POST /signup (회원가입)', () => {
        it('필수 필드가 누락되면 경고창을 띄워야 한다', async () => {
            const response = await request(app)
                .post('/signup')
                .send({ email: '' }); // 빈 값 전송

            expect(response.text).toContain('모든 필드를 입력해주세요');
        });

        it('비밀번호가 일치하지 않으면 경고창을 띄워야 한다', async () => {
            const response = await request(app)
                .post('/signup')
                .send({
                    email: 'test@test.com',
                    username: '주인',
                    password: '123',
                    confirmPassword: '456',
                    phone: '01012341234'
                });

            expect(response.text).toContain('비밀번호가 일치하지 않습니다');
        });

        it('회원가입 성공 시 알림창과 함께 로그인 페이지로 이동해야 한다', async () => {
            // [Mocking] 중복 이메일이 없고, 생성이 성공하는 시나리오
            (User.findByEmail as jest.Mock).mockResolvedValue(null);
            (User.create as jest.Mock).mockResolvedValue({ id: 1, email: 'test@test.com' });

            const response = await request(app)
                .post('/signup')
                .send({
                    email: 'test@test.com',
                    username: '주인',
                    password: '123',
                    confirmPassword: '123',
                    phone: '01012341234'
                });

            // ✅ 실제 컨트롤러 응답 문구인 "회원가입 완료! 로그인해주세요."로 수정됨
            expect(response.text).toContain('회원가입 완료! 로그인해주세요.');
            expect(response.text).toContain('location.href="/login"');
        });

        it('이미 존재하는 이메일일 경우 가입이 거부되어야 한다', async () => {
            // [Mocking] 이미 유저가 존재하는 시나리오
            (User.findByEmail as jest.Mock).mockResolvedValue({ id: 1, email: 'test@test.com' });

            const response = await request(app)
                .post('/signup')
                .send({
                    email: 'test@test.com',
                    username: '주인',
                    password: '123',
                    confirmPassword: '123',
                    phone: '01012341234'
                });

            expect(response.text).toContain('이미 가입된 이메일입니다');
        });
    });
});