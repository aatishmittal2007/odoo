import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/demo-login', AuthController.demoLogin);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/me', authenticateToken, AuthController.getMe);
router.get('/users', authenticateToken, AuthController.listUsers);

export default router;
