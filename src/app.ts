import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { QueryResult } from 'pg';

// 라이브러리 임포트 (타입 지원을 위해 import 사용)
import session from 'express-session';
const pgSession = require('connect-pg-simple')(session);
import passport from 'passport';

// 설정 및 라우터 임포트 (전부 import로 통일)
import db from './config/db';
import passportConfig from './config/passport';
import mainRoutes from './routes/mainRoutes';
import authRoutes from './routes/authRoutes'; // 이름 통일
import productRoutes from './routes/productRoutes';
import adminRoutes from './routes/adminRoutes'; // ✅ require 제거
import cartRoutes from './routes/cartRoutes';   // ✅ require 제거
import orderRoutes from './routes/orderRoutes'; // ✅ require 제거

const app = express();
const PORT = process.env.PORT || 3000;

// DB 연결 확인용 인터페이스
interface NowResult {
    now: Date;
}

db.query('SELECT NOW()', (err: Error | null, res: QueryResult<NowResult>) => {
    if (err) {
        console.error('❌ DB Connection Failed:', err.stack);
        return;
    }
    if (res && res.rows.length > 0) {
        console.log('✅ DB Connection Verified! Current Time:', res.rows[0].now);
    }
});

// 뷰 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 세션 설정
app.use(session({
    store: new pgSession({
        pool: db,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'my_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
        httpOnly: true,
    }
}));

// 패스포트 설정
passportConfig(passport);
app.use(passport.initialize());
app.use(passport.session());

// 전역 미들웨어: 유저 정보 및 DB 주입
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

app.use((req, res, next) => {
    req.db = db;
    next();
});

// 기본 미들웨어
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 🚀 라우터 연결 (이 부분이 이제 정상적으로 함수를 전달합니다)
app.use('/', mainRoutes);
app.use('/', authRoutes);
app.use('/', productRoutes);
app.use('/', cartRoutes);
app.use('/', orderRoutes);
app.use('/admin', adminRoutes);

// 404 에러 핸들링
app.use((req: Request, res: Response) => {
    res.status(404).render('error/404', { title: 'Page Not Found' });
});

// 500 서버 에러 핸들링
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('🔥 Server Error:', err.stack);
    res.status(500).render('error/500', { title: 'Server Error' });
});

app.listen(PORT, () => {
    console.log(`🚀 http://localhost:${PORT} 에서 서버 실행 중`);
});