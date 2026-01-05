import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { isAdmin } from '../middlewares/authMiddleware';
import upload from '../config/multer'; // S3 설정 파일

const router = Router();

// 모든 관리자 경로는 isAdmin 미들웨어를 거칩니다.
router.use(isAdmin);

router.get('/products', adminController.getOrders); // 목록 조회
router.get('/products/new', adminController.getProductForm);
router.post('/products', upload.array('images', 10), adminController.createProduct);

router.get('/orders', adminController.getOrders);
router.post('/orders/:id/status', adminController.updateOrderStatus);

router.post('/products/:id/delete', adminController.deleteProduct);

export default router;