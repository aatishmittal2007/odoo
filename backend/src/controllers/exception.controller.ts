import { Request, Response } from 'express';
import { ExceptionService } from '../services/exception.service';
import { AnalyticsService } from '../services/analytics.service';
import { ExceptionEngine } from '../services/exception-engine';

export class ExceptionController {
  static async listExceptions(req: Request, res: Response) {
    try {
      const { status, severity, type, warehouseId, locationId, productId, ownerId, search } = req.query;
      const exceptions = await ExceptionService.listExceptions({
        status: status ? String(status) : undefined,
        severity: severity ? String(severity) : undefined,
        type: type ? String(type) : undefined,
        warehouseId: warehouseId ? String(warehouseId) : undefined,
        locationId: locationId ? String(locationId) : undefined,
        productId: productId ? String(productId) : undefined,
        ownerId: ownerId ? String(ownerId) : undefined,
        search: search ? String(search) : undefined,
      });
      return res.json(exceptions);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getException(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const details = await ExceptionService.getExceptionDetails(id);
      return res.json(details);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }

  static async startInvestigation(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { assignedToId, priority = 'HIGH', dueDate, reason, notes } = req.body;

      if (!assignedToId) {
        return res.status(400).json({ error: 'Assigned investigator is required.' });
      }

      const result = await ExceptionService.startInvestigation({
        exceptionId: id,
        assignedToId,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        reason,
        notes,
      });

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async addTask(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, assignedToId, dueDate } = req.body;
      if (!title) return res.status(400).json({ error: 'Task title is required.' });

      const task = await ExceptionService.addTask({
        exceptionId: id,
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
  }

  static async toggleTask(req: any, res: Response) {
    try {
      const { taskId } = req.params;
      const { isCompleted, status, notes, description, dueDate } = req.body;

      const task = await ExceptionService.toggleTask(taskId, {
        isCompleted: isCompleted !== undefined ? Boolean(isCompleted) : undefined,
        status,
        userId: req.user?.id,
        notes,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      return res.json(task);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async resolveException(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { rootCause, explanation, correctiveAction, resolutionNotes } = req.body;

      if (!rootCause) {
        return res.status(400).json({ error: 'Root cause taxonomy selection is required.' });
      }

      const result = await ExceptionService.resolveException({
        exceptionId: id,
        rootCause,
        explanation,
        correctiveAction,
        resolutionNotes,
        userId: req.user?.id,
      });

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async checkTransferExceptions(req: Request, res: Response) {
    try {
      await ExceptionEngine.checkTransferExceptions();
      return res.json({ success: true, message: 'Transfer exception scan complete.' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getProcessHealth(req: Request, res: Response) {
    try {
      const health = await AnalyticsService.getProcessHealth();
      return res.json(health);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getRootCauseDrilldown(req: Request, res: Response) {
    try {
      const { rootCause } = req.params;
      const drilldown = await AnalyticsService.getRootCauseDrilldown(decodeURIComponent(rootCause));
      return res.json(drilldown);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
