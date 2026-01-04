// const dotenv = require('dotenv');
import dotenv from 'dotenv';
dotenv.config();

// const express = require('express');
import express, { Request, Response, NextFunction } from 'express';
const app = express();

// const path = require('path');
import path from 'path';

import { QueryResult } from 'pg';
declare global {
  namespace Express {
    interface Request {
      db: any; 
    }
  }
}

const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const db = require('./config/db');
const passport = require('passport');
const passportConfig = require('./config/passport');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/authRoutes');
const multer = require('./config/multer');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

interface NowResult {
    now: Date;
}

// 서버 시작 시 간단한 쿼리 날려보기 (현재 시간 조회)
db.query('SELECT NOW()', (err: Error | null, res: QueryResult<NowResult>) => {
    if (err) {
        console.error('❌ DB Connection Failed:', err.stack);
        return; // 에러 발생 시 이후 로직 중단
    }

    // 이제 res.rows[0].now에 빨간 줄이 사라지고 자동완성이 지원됩니다.
    if (res && res.rows.length > 0) {
        console.log('✅ DB Connection Verified! Current Time:', res.rows[0].now);
    }
});

const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  store: new pgSession({
    pool: db,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'my_secret_key', // 쿠키 변조 방지용 암호키
    resave: false,              // 세션이 변경되지 않아도 저장할지 (false 권장)
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 쿠키 유효 기간 (30일)
        httpOnly: true, // 자바스크립트로 쿠키 접근 불가 (보안 강화)
        // secure: true // HTTPS 환경에서만 쿠키 전송 (배포 시 주석 해제)
    }
}))
passportConfig(passport);
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use((req, res, next)=>{
  req.db = db;
  next();
})

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/', productRoutes);
app.use('/', cartRoutes);
app.use('/', orderRoutes);
app.use('/admin', adminRoutes);

app.use((req, res, next) => {
    res.status(404).render('error/404', { title: 'Page Not Found' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack); // 서버 콘솔에는 에러 로그 출력
    res.status(500).render('error/500', { title: 'Server Error' });
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT} 에서 서버 실행 중`);
});
