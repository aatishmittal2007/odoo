import { Router } from 'express';
import { InventoryOpsController } from '../controllers/inventory-ops.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Receipts
router.get('/receipts', authenticateToken, InventoryOpsController.listReceipts);
router.post('/receipts', authenticateToken, InventoryOpsController.createReceipt);
router.get('/receipts/:id', authenticateToken, InventoryOpsController.getReceipt);
router.post('/receipts/:id/validate', authenticateToken, InventoryOpsController.validateReceipt);

// Deliveries
router.get('/deliveries', authenticateToken, InventoryOpsController.listDeliveries);
router.post('/deliveries', authenticateToken, InventoryOpsController.createDelivery);
router.get('/deliveries/:id', authenticateToken, InventoryOpsController.getDelivery);
router.post('/deliveries/:id/validate', authenticateToken, InventoryOpsController.validateDelivery);

// Transfers
router.get('/transfers', authenticateToken, InventoryOpsController.listTransfers);
router.post('/transfers', authenticateToken, InventoryOpsController.createTransfer);
router.get('/transfers/:id', authenticateToken, InventoryOpsController.getTransfer);
router.post('/transfers/:id/complete', authenticateToken, InventoryOpsController.completeTransfer);

// Adjustments
router.get('/adjustments', authenticateToken, InventoryOpsController.listAdjustments);
router.post('/adjustments', authenticateToken, InventoryOpsController.createAdjustment);

// Physical Counts
router.get('/physical-counts', authenticateToken, InventoryOpsController.listCounts);
router.post('/physical-counts', authenticateToken, InventoryOpsController.recordCount);

// Stock & Ledger
router.get('/ledger', authenticateToken, InventoryOpsController.getLedger);
router.get('/stock', authenticateToken, InventoryOpsController.getStockOverview);

export default router;
