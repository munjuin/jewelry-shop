// middlewares/authMiddleware.js

// 1. 로그인한 사용자만 접근 가능 (보호된 라우트용)
// 예: 마이페이지, 장바구니, 결제 등
exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) { // Passport가 제공하는 메서드
        return next(); // 통과!
    }
    // 로그인이 안 되어 있다면
    res.send('<script>alert("로그인이 필요한 서비스입니다."); location.href="/login";</script>');
};

// 2. 로그인 안 한 사용자만 접근 가능 (공개 라우트용)
// 예: 로그인 페이지, 회원가입 페이지 (이미 로그인한 사람이 또 들어오는 것 방지)
exports.isNotAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next(); // 통과!
    }
    // 이미 로그인이 되어 있다면
    res.send('<script>alert("이미 로그인되어 있습니다."); location.href="/";</script>');
};