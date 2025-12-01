const User = require('../models/userModel');
const passport = require('passport');

// 1. 회원가입 페이지 렌더링 (GET)
exports.getSignupPage = (req, res) => {
    res.render('signup', { title: '회원가입' });
};

// 2. 이메일 중복 확인 API (POST /api/check-email)
exports.checkEmail = async (req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.json({ available: false, message: '이미 사용 중인 이메일입니다.' });
        }
        res.json({ available: true, message: '사용 가능한 이메일입니다.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
};

// 3. 회원가입 처리 (POST)
exports.signup = async (req, res) => {
    const { email, username, password, confirmPassword, phone } = req.body;

    // [유효성 검사 1] 빈 값 확인
    if (!email || !username || !password || !confirmPassword || !phone) {
        return res.send('<script>alert("모든 필드를 입력해주세요."); history.back();</script>');
    }

    // [유효성 검사 2] 비밀번호 일치 확인
    if (password !== confirmPassword) {
        return res.send('<script>alert("비밀번호가 일치하지 않습니다."); history.back();</script>');
    }

    try {
        // [유효성 검사 3] 이메일 중복 재확인 (보안)
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.send('<script>alert("이미 가입된 이메일입니다."); history.back();</script>');
        }

        // DB 저장 (User 모델에서 bcrypt 암호화 처리됨)
        await User.create({ email, password, name: username, phone });

        // 성공 시 로그인 페이지로 이동
        res.send('<script>alert("회원가입이 완료되었습니다! 로그인해주세요."); location.href="/login";</script>');

    } catch (error) {
        console.error(error);
        res.send('<script>alert("회원가입 중 오류가 발생했습니다."); history.back();</script>');
    }
};

// 로그인 페이지 (GET)
exports.getLoginPage = (req, res) => {
  if (req.isAuthenticated()) { // Passport가 제공하는 로그인 확인 함수
      return res.redirect('/');
  }
  res.render('login', { title: '로그인' }); // 에러 메시지 전달 로직은 추후 connect-flash 필요
};

// 로그인 처리 (POST)
exports.login = (req, res, next) => {
  // Passport 인증 실행
  passport.authenticate('local', (err, user, info) => {
      if (err) { return next(err); }
      
      // 로그인 실패 시
      if (!user) {
          return res.send(`<script>alert("${info.message}"); history.back();</script>`);
      }

      // 로그인 성공 시 (세션 생성)
      req.login(user, (err) => {
          if (err) { return next(err); }
          return res.redirect('/');
      });
  })(req, res, next); // 미들웨어 내에서 미들웨어 호출
};

// 로그아웃 처리 (GET)
exports.logout = (req, res, next) => {
  req.logout((err) => { // Passport가 제공하는 로그아웃 함수
      if (err) { return next(err); }
      // 세션 파기 (선택사항, 깔끔한 로그아웃을 위해 권장)
      req.session.destroy(() => {
          res.redirect('/');
      });
  });
};