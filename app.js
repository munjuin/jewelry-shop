const dotenv = require('dotenv');
dotenv.config();
const path = require('path');
const express = require('express');
const app = express();
const indexRouter = require('./routes/index')


const PORT = process.env.PORT || 3000;


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);

app.use((req, res, next)=>{
  res.status(404).send('페이지가 없습니다');
});

app.listen(PORT, ()=>{
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`⚙️ Environment: ${process.env.NODE_ENV || 'development'}`);
});