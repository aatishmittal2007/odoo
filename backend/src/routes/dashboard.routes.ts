import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { ExceptionController } from '../controllers/exception.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/control-tower', authenticateToken, DashboardController.getControlTowerData);
router.get('/search', authenticateToken, DashboardController.globalSearch);
router.get('/process-health', authenticateToken, ExceptionController.getProcessHealth);
router.get('/drilldown/:rootCause', authenticateToken, ExceptionController.getRootCauseDrilldown);
router.post('/reset-demo', authenticateToken, DashboardController.resetDemo);

export default router;
