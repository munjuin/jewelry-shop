// src/app.ts
import 'reflect-metadata'; // ✅ TypeORM 데코레이터 인식을 위해 무조건 파일의 가장 첫 줄에 배치

import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { QueryResult } from 'pg';

import session from 'express-session';
const pgSession = require('connect-pg-simple')(session);
import passport from 'passport';

// ✅ db 임포트 시, 기존 pool(db)과 신규 AppDataSource를 함께 가져옵니다.
import db, { AppDataSource } from './config/db'; 
import passportConfig from './config/passport';
import mainRoutes from './routes/mainRoutes';
import authRoutes from './routes/authRoutes'; 
import productRoutes from './routes/productRoutes';
import adminRoutes from './routes/adminRoutes'; 
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes'; 

const app = express();
const PORT = process.env.PORT || 3000;

interface NowResult {
    now: Date;
}

// ---------------------------------------------------------
// 1. 기존 pg Pool 연결 확인
// ---------------------------------------------------------
db.query('SELECT NOW()', (err: Error | null, res: QueryResult<NowResult>) => {
    if (err) {
        console.error('❌ DB Connection Failed (pg Pool):', err.stack);
        return;
    }
    if (res && res.rows.length > 0) {
        console.log('✅ DB Connection Verified (pg Pool)! Current Time:', res.rows[0].now);
    }
});

// ---------------------------------------------------------
// 2. 신규 TypeORM 엔진 연결 초기화
// ---------------------------------------------------------
AppDataSource.initialize()
    .then(() => {
        console.log('✅ TypeORM 신규 엔진 가동 성공!');
    })
    .catch((error) => {
        console.error('❌ TypeORM 초기화 실패:', error);
    });

// 뷰 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 세션 설정 (기존 db pool을 그대로 사용하므로 안전하게 호환됨)
app.use(session({
    store: new pgSession({
        pool: db,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'my_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, 
        httpOnly: true,
    }
}));

// 패스포트 설정
passportConfig(passport);
app.use(passport.initialize());
app.use(passport.session());

// 전역 미들웨어
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// 기존 하위 호환성을 위한 DB 주입 (차후 Repository 패턴 완료 시 제거 예정)
app.use((req, res, next) => {
    req.db = db;
    next();
});

// 기본 미들웨어
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 라우터 연결
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