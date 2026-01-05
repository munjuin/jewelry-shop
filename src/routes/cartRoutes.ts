import { Router } from 'express';
import * as cartController from '../controllers/cartController';
import { isAuthenticated } from '../middlewares/authMiddleware';

const router = Router();

router.post('/cart/add', isAuthenticated, cartController.addToCart);
router.get('/cart', isAuthenticated, cartController.getCartPage);
router.patch('/api/cart/:itemId', isAuthenticated, cartController.updateCartItem);
router.delete('/api/cart/:itemId', isAuthenticated, cartController.deleteCartItem);

export default router;