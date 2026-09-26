import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, ProductController.listProducts);
router.get('/categories', authenticateToken, ProductController.listCategories);
router.post('/categories', authenticateToken, ProductController.createCategory);
router.get('/:id', authenticateToken, ProductController.getProduct);
router.post('/', authenticateToken, ProductController.createProduct);
router.put('/:id', authenticateToken, ProductController.updateProduct);
router.delete('/:id', authenticateToken, ProductController.deleteProduct);

export default router;
