// mainController.ts
import { Request, Response, NextFunction } from 'express';

/**
 * 메인 페이지 로드 컨트롤러
 * 설계 원칙: async/await와 명시적 타입 정의 적용
 */
export const getHomePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. DB에서 상품 목록 조회 (설계대로 제네릭 활용 가능)
    const result = await req.db.query('SELECT * FROM products ORDER BY created_at DESC LIMIT 8');
    
    // 2. 뷰 렌더링 (세션 유저 정보 포함)
    res.render('index', {
      products: result.rows,
      user: req.session.user || null,
      title: '주얼리 쇼핑몰 - 메인'
    });
  } catch (error) {
    console.error('메인 페이지 로드 중 오류 발생:', error);
    next(error); // 에러 핸들링 미들웨어로 전달
  }
};