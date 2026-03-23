import { PassportStatic } from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import User from '../models/userModel';
import { UserShape } from '../models/userModel';

export default (passport: PassportStatic) => {
  // 1. Local Strategy 정의
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return done(null, false, { message: '등록되지 않은 이메일입니다.' });
      }

      // 비밀번호 검증 (user.password_hash 사용)
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
      }

      return done(null, user); // 검증 성공
    } catch (error) {
      return done(error);
    }
  }));

  // 2. Serialize (세션에 id 저장)
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // 3. Deserialize (세션 id로 유저 복구)
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};