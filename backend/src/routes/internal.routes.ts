import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

/**
 * Internal automation middleware — validates INTERNAL_AUTOMATION_SECRET header.
 * Used for n8n → backend communication on /api/internal/automation/* endpoints.
 */
function requireInternalSecret(req: Request, res: Response, next: any) {
  const secret = process.env.INTERNAL_AUTOMATION_SECRET || 'stocksense-internal-automation-2026';
  const provided = req.headers['x-internal-automation-secret'];
  if (!provided || provided !== secret) {
    return res.status(401).json({ error: 'Unauthorized: invalid internal automation secret' });
  }
  next();
}

/**
 * GET /api/internal/automation/events
 * Returns list of AutomationEvent records for observability dashboard.
 * Also accessible to authenticated users (query param auth=user with JWT checked in future).
 */
router.get('/automation/events', requireInternalSecret, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const status = req.query.status as string | undefined;

    const events = await prisma.automationEvent.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({ events, total: events.length });
  } catch (err: any) {
    console.error('[InternalRoutes] GET /automation/events error:', err);
    res.status(500).json({ error: 'Failed to fetch automation events' });
  }
});

/**
 * POST /api/internal/automation/events
 * Called by n8n Workflow 5 to log a processed inventory event.
 */
router.post('/automation/events', requireInternalSecret, async (req: Request, res: Response) => {
  try {
    const { event, entityId, entityType, payload } = req.body;

    if (!event) {
      return res.status(400).json({ error: 'event is required' });
    }

    const record = await prisma.automationEvent.create({
      data: {
        eventId: `n8n_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventType: event,
        entityType: entityType || event.split('.')[0],
        entityId: entityId || 'unknown',
        payload: typeof payload === 'string' ? payload : JSON.stringify(payload || {}),
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });

    res.json({ success: true, eventId: record.eventId });
  } catch (err: any) {
    console.error('[InternalRoutes] POST /automation/events error:', err);
    res.status(500).json({ error: 'Failed to create automation event' });
  }
});

/**
 * POST /api/internal/automation/tasks
 * Called by n8n to create an investigation task via internal channel.
 */
router.post('/automation/tasks', requireInternalSecret, async (req: Request, res: Response) => {
  try {
    const { exceptionId, title, description, dueDate } = req.body;

    if (!exceptionId || !title) {
      return res.status(400).json({ error: 'exceptionId and title are required' });
    }

    const task = await prisma.investigationTask.create({
      data: {
        exceptionId,
        title,
        description: description || 'Auto-created by n8n automation engine',
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 86400000),
        status: 'TODO',
      },
    });

    res.json({ success: true, task });
  } catch (err: any) {
    console.error('[InternalRoutes] POST /automation/tasks error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * POST /api/internal/automation/summaries
 * Called by n8n Workflow 3 (daily summary) to persist inventory KPI snapshots.
 * Stores to InventorySummary table without requiring any AI API key.
 */
router.post('/automation/summaries', requireInternalSecret, async (req: Request, res: Response) => {
  try {
    const kpis = req.body;

    // Parse KPI data defensively — n8n sends the raw /api/dashboard/kpis response
    const totalProducts = parseInt(kpis.totalProducts ?? kpis.products ?? 0);
    const totalWarehouses = parseInt(kpis.totalWarehouses ?? kpis.warehouses ?? 0);
    const openExceptions = parseInt(kpis.openExceptions ?? kpis.exceptions?.open ?? 0);
    const criticalExceptions = parseInt(kpis.criticalExceptions ?? kpis.exceptions?.critical ?? 0);
    const totalStock = parseFloat(kpis.totalStock ?? kpis.stockValue ?? kpis.totalValue ?? 0);
    const lowStock = parseInt(kpis.lowStockAlerts ?? kpis.lowStock ?? 0);
    const negativeStock = parseInt(kpis.negativeStock ?? 0);
    const overdueInvestigations = parseInt(kpis.overdueInvestigations ?? 0);

    // Generate deterministic brief — no AI required
    const summaryText = generateDeterministicBrief({
      totalProducts,
      openExceptions,
      criticalExceptions,
      totalStock,
    });

    const summary = await prisma.inventorySummary.create({
      data: {
        summaryText,
        metricsJson: JSON.stringify(kpis),
        totalProducts,
        totalStock,
        lowStock,
        negativeStock,
        openExceptions,
        criticalExceptions,
        overdueInvestigations,
        recentReceipts: parseInt(kpis.recentReceipts ?? 0),
        recentDeliveries: parseInt(kpis.recentDeliveries ?? 0),
        recentTransfers: parseInt(kpis.recentTransfers ?? 0),
        recentAdjustments: parseInt(kpis.recentAdjustments ?? 0),
        generatedBy: 'n8n-daily-workflow',
      },
    });

    res.json({ success: true, summaryId: summary.id, brief: summaryText });
  } catch (err: any) {
    console.error('[InternalRoutes] POST /automation/summaries error:', err);
    res.status(500).json({ error: 'Failed to store inventory summary' });
  }
});

/**
 * GET /api/internal/automation/summaries
 * Returns recent inventory summaries for the dashboard.
 */
router.get('/automation/summaries', requireInternalSecret, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
    const summaries = await prisma.inventorySummary.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json({ summaries, total: summaries.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch summaries' });
  }
});

/**
 * Generates a deterministic operational brief from KPI data.
 * No AI required — pure rule-based text generation.
 */
function generateDeterministicBrief(kpis: {
  totalProducts: number;
  openExceptions: number;
  criticalExceptions: number;
  totalStock: number;
}): string {
  const { openExceptions, criticalExceptions, totalStock, totalProducts } = kpis;
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  let status = '✅ NORMAL';
  let urgency = '';

  if (criticalExceptions > 0) {
    status = '🔴 CRITICAL ALERT';
    urgency = `Immediate action required: ${criticalExceptions} CRITICAL exception(s) demand urgent physical verification. `;
  } else if (openExceptions > 5) {
    status = '🟡 ELEVATED';
    urgency = `${openExceptions} open exceptions exceed normal threshold. Review investigation queue. `;
  } else if (openExceptions > 0) {
    status = '🟠 ATTENTION';
    urgency = `${openExceptions} open exception(s) under investigation. `;
  }

  return `📊 DAILY INVENTORY BRIEF — ${date}\n\nStatus: ${status}\n\n${urgency}` +
    `Inventory covers ${totalProducts} active product lines with a total stock quantity of ${Number(totalStock).toLocaleString()}. ` +
    `Open exceptions: ${openExceptions} (${criticalExceptions} critical). ` +
    `\n\nThis report was generated automatically by StockSense n8n automation at 08:00 UTC.`;
}

export default router;

