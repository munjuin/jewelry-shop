import { Router } from 'express';
import * as authController from '../controllers/authController';
import { isAuthenticated, isNotAuthenticated } from '../middlewares/authMiddleware';

const router = Router();

router.get('/signup', isNotAuthenticated, authController.getSignupPage);
router.post('/signup', isNotAuthenticated, authController.signup);
router.post('/api/check-email', isNotAuthenticated, authController.checkEmail);

router.get('/login', isNotAuthenticated, authController.getLoginPage);
router.post('/login', isNotAuthenticated, authController.login);

router.get('/logout', isAuthenticated, authController.logout);

export default router;