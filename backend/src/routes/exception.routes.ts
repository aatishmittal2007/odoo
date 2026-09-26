import { Router } from 'express';
import { ExceptionController } from '../controllers/exception.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, ExceptionController.listExceptions);
router.post('/scan-transfers', authenticateToken, ExceptionController.checkTransferExceptions);
router.get('/:id', authenticateToken, ExceptionController.getException);
router.post('/:id/investigate', authenticateToken, ExceptionController.startInvestigation);
router.post('/:id/tasks', authenticateToken, ExceptionController.addTask);
router.patch('/tasks/:taskId', authenticateToken, ExceptionController.toggleTask);
router.post('/:id/resolve', authenticateToken, ExceptionController.resolveException);

export default router;
