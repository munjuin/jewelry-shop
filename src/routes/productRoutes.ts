import { Router } from 'express';
import * as productController from '../controllers/productController';

const router = Router();

// 상품 목록 페이지 (GET /products)
router.get('/products', productController.getProducts);

// 상세 조회 (GET /products/:id)
router.get('/products/:id', productController.getProductDetail);

export default router;