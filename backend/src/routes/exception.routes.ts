import { Router } from 'express';
import { ExceptionController } from '../controllers/exception.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const MANAGER_ROLES = ['INVENTORY_MANAGER', 'ADMIN'];

router.get('/', authenticateToken, ExceptionController.listExceptions);
router.post('/scan-transfers', authenticateToken, requireRole(MANAGER_ROLES), ExceptionController.checkTransferExceptions);
router.get('/:id', authenticateToken, ExceptionController.getException);
router.post('/:id/investigate', authenticateToken, requireRole(MANAGER_ROLES), ExceptionController.startInvestigation);
router.post('/:id/tasks', authenticateToken, requireRole(MANAGER_ROLES), ExceptionController.addTask);
router.patch('/tasks/:taskId', authenticateToken, ExceptionController.toggleTask);
router.post('/:id/resolve', authenticateToken, requireRole(MANAGER_ROLES), ExceptionController.resolveException);

export default router;
