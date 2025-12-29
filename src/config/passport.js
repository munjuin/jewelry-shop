const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/userModel');

module.exports = (passport) => {
  // 1. Local Strategy 정의 (ID/PW 검증 로직)
  passport.use(new LocalStrategy({
      usernameField: 'email',    // 폼 필드명 (name="email")
      passwordField: 'password'  // 폼 필드명 (name="password")
  }, async (email, password, done) => {
      try {
          // 사용자 조회
          const user = await User.findByEmail(email);
          if (!user) {
              // done(에러, 성공여부, 메시지)
              return done(null, false, { message: '등록되지 않은 이메일입니다.' });
          }

          // 비밀번호 검증
          const isMatch = await bcrypt.compare(password, user.password_hash);
          if (!isMatch) {
              return done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
          }

          // 검증 성공! 사용자 정보 반환
          return done(null, user);
      } catch (error) {
          return done(error);
      }
  }));

  // 2. Serialize (로그인 성공 시 세션에 저장할 데이터 선택)
  // 일반적으로 세션 용량을 위해 user.id만 저장합니다.
  passport.serializeUser((user, done) => {
      done(null, user.id);
  });

  // 3. Deserialize (세션의 id로 실제 사용자 정보를 복구)
  // 매 요청마다 실행되어 req.user에 사용자 정보를 채워줍니다.
  passport.deserializeUser(async (id, done) => {
      try {
          // User 모델에 id로 찾는 메서드가 필요합니다. (SQL 쿼리: SELECT * FROM users WHERE id = $1)
          // 임시로 직접 쿼리하거나, User 모델에 findById를 추가해야 합니다.
          // 여기서는 User 모델에 findById가 있다고 가정하고 작성합니다.
          // const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
          const user = await User.findById(id); 
          done(null, user);
      } catch (error) {
          done(error);
      }
  });
};