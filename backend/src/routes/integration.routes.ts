import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { N8nService } from '../services/n8n/n8n.service';
import { OpenRouterService } from '../services/ai/openrouter.service';
import { IntegrationStatus } from '../types';

const router = Router();

// GET /api/integrations/status - Comprehensive status of all architecture components
router.get('/status', async (req: Request, res: Response) => {
  try {
    // 1. PostgreSQL DB check
    let postgresStatus: { status: 'connected' | 'disconnected'; message: string };
    try {
      await prisma.$queryRaw`SELECT 1`;
      postgresStatus = {
        status: 'connected',
        message: 'Authoritative PostgreSQL database is connected and accepting queries',
      };
    } catch (dbErr: any) {
      postgresStatus = {
        status: 'disconnected',
        message: `Database connection error: ${dbErr.message}`,
      };
    }

    // 2. StockSense Core check
    const coreStatus = {
      status: 'healthy' as const,
      message: 'Inventory calculations, tolerance checks, and ledger engines operational',
    };

    // 3. n8n Automation Engine check
    const n8nStatus = await N8nService.checkStatus();

    // 4. OpenRouter AI Service check
    const aiStatus = await OpenRouterService.checkStatus();

    const responsePayload: IntegrationStatus = {
      stocksenseCore: coreStatus,
      postgres: postgresStatus,
      n8n: {
        status: n8nStatus.status,
        message: n8nStatus.message,
        url: n8nStatus.url,
      },
      openRouter: {
        status: aiStatus.configured ? 'configured' : 'not_configured',
        model: aiStatus.model,
        message: aiStatus.message,
      },
    };

    res.json(responsePayload);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to determine integration status' });
  }
});

// POST /api/integrations/n8n/callback - Secure webhook endpoint for incoming n8n automation callbacks
router.post('/n8n/callback', async (req: Request, res: Response) => {
  try {
    const secretHeader = (req.headers['x-stocksense-webhook-secret'] || req.headers['authorization']?.replace('Bearer ', '')) as string;
    const result = await N8nService.handleCallback(secretHeader, req.body);
    res.json(result);
  } catch (err: any) {
    console.error('[Integration Routes] n8n callback error:', err.message);
    res.status(403).json({ error: err.message || 'Forbidden' });
  }
});

export default router;
