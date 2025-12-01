const dotenv = require('dotenv');
dotenv.config();
const path = require('path');
const express = require('express');
const app = express();
const indexRouter = require('./routes/index')
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const passport = require('passport');
const session = require('express-session');
const passportConfig = require('./config/passport');
const pgSession = require('connect-pg-simple')(session);

const PORT = process.env.PORT || 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 1. Session 설정 (기존과 동일)
app.use(session({
    store: new pgSession({ pool : db.pool, tableName : 'sessions' }), // 1. 첫 번째 store 정의
    conString: `postgres://...`, // 2. conString 정의 (PGStore가 Pool 대신 독립 연결 시도)
    conString: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
    ssl: { rejectUnauthorized: false },
}));
// 2. Passport 설정 실행
passportConfig(passport);
// 3. Passport 미들웨어 초기화 (반드시 session 설정 뒤에!)
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
// 4. 전역 뷰 변수 설정 (Passport는 req.user에 정보를 담아줍니다)
app.use((req, res, next) => {
    res.locals.user = req.user || null; // Passport가 로그인 시 req.user를 생성함
    next();
});
// 1. Form 데이터(x-www-form-urlencoded) 처리
app.use(express.urlencoded({ extended: true })); 
// 2. JSON 데이터(AJAX 요청) 처리
app.use(express.json());


app.use('/', indexRouter);
app.use('/', authRoutes);

app.use((req, res, next)=>{
  res.status(404).send('페이지가 없습니다');
});

app.listen(PORT, ()=>{
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`⚙️ Environment: ${process.env.NODE_ENV || 'development'}`);
});