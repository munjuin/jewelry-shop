import { Request, Response, NextFunction } from 'express';

/**
 * 1. 로그인한 사용자만 접근 가능
 * Passport의 req.isAuthenticated()를 사용하여 타입 안전하게 구현
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated()) { // Passport가 제공하는 인증 확인 메서드
    return next();
  }
  // 기존 로직대로 알림창을 띄우고 로그인 페이지로 이동
  res.send('<script>alert("로그인이 필요한 서비스입니다."); location.href="/login";</script>');
};

/**
 * 2. 로그인 안 한 사용자만 접근 가능 (이미 로그인한 경우 홈으로 리다이렉트)
 */
export const isNotAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.send('<script>alert("이미 로그인되어 있습니다."); location.href="/";</script>');
};

/**
 * 3. 관리자 권한 확인 (필요 시 추가)
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  // Passport를 쓰면 보통 유저 정보가 req.user에 담깁니다.
  if (req.isAuthenticated() && (req.user as any)?.role === 'admin') {
    return next();
  }
  res.status(403).send('권한이 없습니다.');
};