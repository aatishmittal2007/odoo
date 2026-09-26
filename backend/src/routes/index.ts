import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import warehouseRoutes from './warehouse.routes';
import inventoryRoutes from './inventory.routes';
import exceptionRoutes from './exception.routes';
import dashboardRoutes from './dashboard.routes';
import taskRoutes from './task.routes';
import auditRoutes from './audit.routes';
import aiRoutes from './ai.routes';
import integrationRoutes from './integration.routes';
import internalRoutes from './internal.routes';
import { InventoryOpsController } from '../controllers/inventory-ops.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/exceptions', exceptionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analytics', dashboardRoutes); // Alias for analytics endpoints
router.use('/tasks', taskRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/ai', aiRoutes);
router.use('/integrations', integrationRoutes);
router.use('/internal', internalRoutes); // n8n → backend internal automation channel

// Direct top-level operation route aliases matching DFD REST specification
router.get('/stock', authenticateToken, InventoryOpsController.getStockOverview);
router.get('/ledger', authenticateToken, InventoryOpsController.getLedger);

router.get('/receipts', authenticateToken, InventoryOpsController.listReceipts);
router.post('/receipts', authenticateToken, InventoryOpsController.createReceipt);
router.get('/receipts/:id', authenticateToken, InventoryOpsController.getReceipt);
router.post('/receipts/:id/validate', authenticateToken, InventoryOpsController.validateReceipt);

router.get('/deliveries', authenticateToken, InventoryOpsController.listDeliveries);
router.post('/deliveries', authenticateToken, InventoryOpsController.createDelivery);
router.get('/deliveries/:id', authenticateToken, InventoryOpsController.getDelivery);
router.post('/deliveries/:id/validate', authenticateToken, InventoryOpsController.validateDelivery);

router.get('/transfers', authenticateToken, InventoryOpsController.listTransfers);
router.post('/transfers', authenticateToken, InventoryOpsController.createTransfer);
router.get('/transfers/:id', authenticateToken, InventoryOpsController.getTransfer);
router.post('/transfers/:id/complete', authenticateToken, InventoryOpsController.completeTransfer);

router.get('/adjustments', authenticateToken, InventoryOpsController.listAdjustments);
router.post('/adjustments', authenticateToken, InventoryOpsController.createAdjustment);

router.get('/physical-counts', authenticateToken, InventoryOpsController.listCounts);
router.post('/physical-counts', authenticateToken, InventoryOpsController.recordCount);

export default router;
