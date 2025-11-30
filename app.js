const dotenv = require('dotenv');
dotenv.config();
const path = require('path');
const express = require('express');
const app = express();
const indexRouter = require('./routes/index')
const db = require('./config/db');

// 서버 시작 시 간단한 쿼리 날려보기 (현재 시간 조회)
db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ DB Connection Failed:', err.stack);
    } else {
        console.log('✅ DB Connection Verified! Current Time:', res.rows[0].now);
    }
});

const PORT = process.env.PORT || 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next)=>{
  res.locals.user = null;// ejs에서 user 변수 사용 가능(null로 초기화)
  next();
});

app.use('/', indexRouter);

app.use((req, res, next)=>{
  res.status(404).send('페이지가 없습니다');
});

app.listen(PORT, ()=>{
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`⚙️ Environment: ${process.env.NODE_ENV || 'development'}`);
});