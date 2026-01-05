import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import User, { UserShape } from '../models/userModel';

// 1. 회원가입 페이지 렌더링
export const getSignupPage = (req: Request, res: Response) => {
  res.render('signup', { title: '회원가입' });
};

// 2. 이메일 중복 확인 API
export const checkEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.json({ available: false, message: '이미 사용 중인 이메일입니다.' });
    }
    res.json({ available: true, message: '사용 가능한 이메일입니다.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '서버 오류' });
  }
};

// 3. 회원가입 처리
export const signup = async (req: Request, res: Response) => {
  const { email, username, password, confirmPassword, phone } = req.body;

  if (!email || !username || !password || !confirmPassword || !phone) {
    return res.send('<script>alert("모든 필드를 입력해주세요."); history.back();</script>');
  }

  if (password !== confirmPassword) {
    return res.send('<script>alert("비밀번호가 일치하지 않습니다."); history.back();</script>');
  }

  try {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.send('<script>alert("이미 가입된 이메일입니다."); history.back();</script>');
    }

    await User.create({ email, password, name: username, phone });
    res.send('<script>alert("회원가입 완료! 로그인해주세요."); location.href="/login";</script>');
  } catch (error) {
    console.error(error);
    res.send('<script>alert("회원가입 중 오류 발생."); history.back();</script>');
  }
};

// 4. 로그인 페이지
export const getLoginPage = (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('login', { title: '로그인' });
};

// 5. 로그인 처리
export const login = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', (err: Error | null, user: UserShape | false, info: { message: string }) => {
    if (err) return next(err);
    if (!user) {
      return res.send(`<script>alert("${info.message}"); history.back();</script>`);
    }

    req.login(user, (err) => {
      if (err) return next(err);
      return res.redirect('/');
    });
  })(req, res, next);
};

// 6. 로그아웃 처리
export const logout = (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err: Error | any) => {
      if (err) return res.status(500).send('로그아웃 오류');
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
};