import { Router, Request, Response } from 'express';
import { AuditService } from '../services/audit.service';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { entity, action, userId, entityId, limit, offset } = req.query;
    const result = await AuditService.listLogs({
      entity: entity ? String(entity) : undefined,
      action: action ? String(action) : undefined,
      userId: userId ? String(userId) : undefined,
      entityId: entityId ? String(entityId) : undefined,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
