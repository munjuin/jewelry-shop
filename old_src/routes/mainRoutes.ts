// mainRoutes.ts
import { Router } from 'express';
// 컨트롤러 마이그레이션이 완료되었다고 가정합니다.
import * as mainController from '../controllers/mainController';

const router = Router();

// 메인 페이지 라우팅
router.get('/', mainController.getHomePage);

export default router;