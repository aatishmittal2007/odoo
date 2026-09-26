import { Router } from 'express';
import { WarehouseController } from '../controllers/warehouse.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, WarehouseController.listWarehouses);
router.post('/', authenticateToken, WarehouseController.createWarehouse);
router.get('/locations', authenticateToken, WarehouseController.listLocations);
router.post('/locations', authenticateToken, WarehouseController.createLocation);
router.get('/:id', authenticateToken, WarehouseController.getWarehouse);
router.put('/:id', authenticateToken, WarehouseController.updateWarehouse);
router.put('/locations/:id', authenticateToken, WarehouseController.updateLocation);

export default router;
