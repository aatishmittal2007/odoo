import { Router } from 'express';
import { WarehouseController } from '../controllers/warehouse.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const MANAGER_ROLES = ['INVENTORY_MANAGER', 'ADMIN'];

router.get('/', authenticateToken, WarehouseController.listWarehouses);
router.post('/', authenticateToken, requireRole(MANAGER_ROLES), WarehouseController.createWarehouse);
router.get('/locations', authenticateToken, WarehouseController.listLocations);
router.post('/locations', authenticateToken, requireRole(MANAGER_ROLES), WarehouseController.createLocation);
router.get('/:id', authenticateToken, WarehouseController.getWarehouse);
router.put('/:id', authenticateToken, requireRole(MANAGER_ROLES), WarehouseController.updateWarehouse);
router.put('/locations/:id', authenticateToken, requireRole(MANAGER_ROLES), WarehouseController.updateLocation);

export default router;
