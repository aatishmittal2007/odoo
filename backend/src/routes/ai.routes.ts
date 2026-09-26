import { Router, Request, Response } from 'express';
import { OpenRouterService } from '../services/ai/openrouter.service';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/ai/status - Check OpenRouter configuration & reachability
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await OpenRouterService.checkStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to check AI status' });
  }
});

// POST /api/ai/exceptions/:id/summary - Generate or retrieve structured AI exception summary
router.post('/exceptions/:id/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const summary = await OpenRouterService.generateExceptionSummary(id);
    res.json(summary);
  } catch (err: any) {
    console.error('[AI Routes] Error generating exception summary:', err);
    res.status(500).json({
      error: err.message || 'Failed to generate AI analysis',
      fallbackAvailable: true,
    });
  }
});

// POST /api/ai/daily-summary - Generate operational daily brief from metrics
router.post('/daily-summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const analyticsData = req.body || {};
    const summary = await OpenRouterService.generateDailySummary(analyticsData);
    res.json(summary);
  } catch (err: any) {
    console.error('[AI Routes] Error generating daily summary:', err);
    res.status(500).json({ error: err.message || 'Failed to generate daily AI summary' });
  }
});

export default router;
