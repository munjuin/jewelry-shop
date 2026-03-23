import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { isAuthenticated } from '../middlewares/authMiddleware';

const router = Router();

router.get('/checkout', isAuthenticated, orderController.getCheckoutPage);
router.post('/orders', isAuthenticated, orderController.createOrder);
router.get('/orders/complete', isAuthenticated, orderController.getOrderComplete);
router.get('/mypage/orders', isAuthenticated, orderController.getOrderList);
router.post('/orders/:id/cancel', isAuthenticated, orderController.cancelOrder);

export default router;