import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

const MANAGER_ROLES = ['INVENTORY_MANAGER', 'ADMIN'];

router.get('/', authenticateToken, ProductController.listProducts);
router.get('/categories', authenticateToken, ProductController.listCategories);
router.post('/categories', authenticateToken, requireRole(MANAGER_ROLES), ProductController.createCategory);
router.get('/:id', authenticateToken, ProductController.getProduct);
router.post('/', authenticateToken, requireRole(MANAGER_ROLES), ProductController.createProduct);
router.put('/:id', authenticateToken, requireRole(MANAGER_ROLES), ProductController.updateProduct);
router.delete('/:id', authenticateToken, requireRole(MANAGER_ROLES), ProductController.deleteProduct);

export default router;
