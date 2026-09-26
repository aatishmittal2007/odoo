import { Request, Response } from 'express';
import prisma from '../prisma';
import { ConfidenceScoreService } from '../services/confidence-score';

export class DashboardController {
  static async getControlTowerData(req: Request, res: Response) {
    try {
      const [
        totalProducts,
        allBalances,
        productsWithReorder,
        openExceptions,
        criticalExceptions,
        pendingReceipts,
        pendingDeliveries,
        pendingTransfers,
        recentMovements,
        confidence,
      ] = await Promise.all([
        prisma.product.count(),
        prisma.stockBalance.findMany({ select: { quantity: true, productId: true } }),
        prisma.product.findMany({
          select: {
            id: true,
            reorderLevel: true,
            stockBalances: { select: { quantity: true } },
          },
        }),
        prisma.exception.count({
          where: { status: { in: ['NEW', 'INVESTIGATING', 'ACTION_REQUIRED'] } },
        }),
        prisma.exception.count({
          where: {
            status: { in: ['NEW', 'INVESTIGATING', 'ACTION_REQUIRED'] },
            severity: 'CRITICAL',
          },
        }),
        prisma.receipt.count({ where: { status: { in: ['DRAFT', 'WAITING', 'READY'] } } }),
        prisma.delivery.count({ where: { status: { in: ['DRAFT', 'READY'] } } }),
        prisma.transfer.count({ where: { status: { in: ['DRAFT', 'READY', 'IN_TRANSIT'] } } }),
        prisma.stockLedger.findMany({
          take: 6,
          orderBy: { timestamp: 'desc' },
          include: { product: { select: { name: true, sku: true, uom: true } } },
        }),
        ConfidenceScoreService.calculateSystemConfidence(),
      ]);

      const totalStock = allBalances.reduce((sum, b) => sum + b.quantity, 0);

      // Low stock count
      const lowStockCount = productsWithReorder.filter((p) => {
        const stock = p.stockBalances.reduce((sum, b) => sum + b.quantity, 0);
        return stock <= p.reorderLevel;
      }).length;

      // Needs Attention Triage (prioritize Critical -> High -> Medium -> Low)
      const needsAttentionExceptions = await prisma.exception.findMany({
        where: { status: { in: ['NEW', 'INVESTIGATING', 'ACTION_REQUIRED'] } },
        orderBy: [
          { severity: 'asc' }, // We will sort explicitly below
          { createdAt: 'desc' },
        ],
        take: 10,
        include: {
          product: { select: { name: true, sku: true, uom: true } },
          warehouse: { select: { name: true, code: true } },
          location: { select: { name: true, code: true, rack: true } },
        },
      });

      // Sort with strict priority: CRITICAL (1), HIGH (2), MEDIUM (3), LOW (4)
      const severityRank: Record<string, number> = {
        CRITICAL: 1,
        HIGH: 2,
        MEDIUM: 3,
        LOW: 4,
      };

      const prioritizedAttention = needsAttentionExceptions.sort(
        (a, b) => (severityRank[a.severity] || 5) - (severityRank[b.severity] || 5)
      );

      return res.json({
        metrics: {
          totalProducts,
          totalStock,
          lowStockCount,
          openExceptions,
          criticalExceptions,
          pendingReceipts,
          pendingDeliveries,
          pendingTransfers,
        },
        confidence,
        needsAttention: prioritizedAttention,
        recentMovements,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async globalSearch(req: Request, res: Response) {
    try {
      const { q } = req.query;
      if (!q || String(q).trim() === '') {
        return res.json({ products: [], exceptions: [], orders: [], locations: [] });
      }

      const query = String(q).trim();

      const [products, exceptions, deliveries, receipts, locations] = await Promise.all([
        prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { sku: { contains: query } },
            ],
          },
          take: 5,
        }),
        prisma.exception.findMany({
          where: {
            OR: [
              { exceptionNumber: { contains: query } },
              { sku: { contains: query } },
              { notes: { contains: query } },
            ],
          },
          include: { product: true },
          take: 5,
        }),
        prisma.delivery.findMany({
          where: {
            OR: [
              { deliveryNumber: { contains: query } },
              { customer: { contains: query } },
            ],
          },
          take: 5,
        }),
        prisma.receipt.findMany({
          where: {
            OR: [
              { receiptNumber: { contains: query } },
              { supplier: { contains: query } },
            ],
          },
          take: 5,
        }),
        prisma.location.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { code: { contains: query } },
              { rack: { contains: query } },
            ],
          },
          include: { warehouse: true },
          take: 5,
        }),
      ]);

      return res.json({
        products,
        exceptions,
        deliveries,
        receipts,
        locations,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async resetDemo(req: Request, res: Response) {
    try {
      const { exec } = await import('child_process');
      const path = await import('path');
      const rootDir = path.resolve(__dirname, '../../');

      exec('npm run seed', { cwd: rootDir }, (error, stdout, stderr) => {
        if (error) {
          console.error('Seed reset error:', error, stderr);
          return res.status(500).json({ error: 'Failed to reset demo data', details: stderr });
        }
        return res.json({ message: 'Demo data successfully reset to initial scenario', stdout });
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

