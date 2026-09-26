import { Router, Request, Response } from 'express';
import { ExceptionService } from '../services/exception.service';
import { authenticateToken } from '../middleware/auth';
import prisma from '../prisma';

const router = Router();

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { exceptionId, assignedToId, status } = req.query;
    const where: any = {};
    if (exceptionId) where.exceptionId = String(exceptionId);
    if (assignedToId) where.assignedToId = String(assignedToId);
    if (status) where.status = String(status);

    const tasks = await prisma.investigationTask.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        exception: {
          select: {
            id: true,
            exceptionNumber: true,
            severity: true,
            status: true,
            product: { select: { name: true, sku: true } },
          },
        },
      },
    });
    return res.json(tasks);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateToken, async (req: any, res: Response) => {
  try {
    const { exceptionId, title, description, assignedToId, dueDate } = req.body;
    if (!exceptionId || !title) {
      return res.status(400).json({ error: 'exceptionId and title are required.' });
    }
    const task = await ExceptionService.addTask({
      exceptionId,
      title,
      description,
      assignedToId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      userId: req.user?.id,
    });
    return res.status(201).json(task);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { isCompleted, status, notes, description, dueDate } = req.body;
    const task = await ExceptionService.toggleTask(id, {
      isCompleted: isCompleted !== undefined ? Boolean(isCompleted) : undefined,
      status,
      notes,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      userId: req.user?.id,
    });
    return res.json(task);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { isCompleted, status, notes, description, dueDate } = req.body;
    const task = await ExceptionService.toggleTask(id, {
      isCompleted: isCompleted !== undefined ? Boolean(isCompleted) : undefined,
      status,
      notes,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      userId: req.user?.id,
    });
    return res.json(task);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
