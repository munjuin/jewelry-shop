const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
const path = require('path');
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

// 서버 시작 시 간단한 쿼리 날려보기 (현재 시간 조회)
db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ DB Connection Failed:', err.stack);
    } else {
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
  res.status(404).send('404 Not Found');
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT} 에서 서버 실행 중`);
});
