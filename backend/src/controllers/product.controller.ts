import { Request, Response } from 'express';
import prisma from '../prisma';
import { StockService } from '../services/stock.service';
import { LedgerService } from '../services/ledger.service';
import { ConfidenceScoreService } from '../services/confidence-score';
import { ExceptionEngine } from '../services/exception-engine';

export class ProductController {
  static async listProducts(req: Request, res: Response) {
    try {
      const { categoryId, search, lowStock } = req.query;
      const where: any = {};

      if (categoryId) {
        where.categoryId = String(categoryId);
      }
      if (search) {
        where.OR = [
          { name: { contains: String(search) } },
          { sku: { contains: String(search) } },
        ];
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          category: true,
          stockBalances: {
            include: {
              warehouse: { select: { id: true, name: true, code: true } },
              location: { select: { id: true, name: true, code: true, rack: true } },
            },
          },
          exceptions: {
            where: { status: { in: ['NEW', 'INVESTIGATING', 'ACTION_REQUIRED'] } },
            select: { id: true, severity: true, type: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      const enriched = await Promise.all(
        products.map(async (p) => {
          const totalStock = p.stockBalances.reduce((sum, b) => sum + b.quantity, 0);
          const confidence = await ConfidenceScoreService.calculateProductConfidence(p.id);

          return {
            ...p,
            totalStock,
            openExceptionsCount: p.exceptions.length,
            hasCriticalException: p.exceptions.some((e) => e.severity === 'CRITICAL'),
            isLowStock: totalStock <= p.reorderLevel,
            confidenceScore: confidence.score,
            confidenceRating: confidence.rating,
          };
        })
      );

      let finalResult = enriched;
      if (lowStock === 'true') {
        finalResult = enriched.filter((p) => p.isLowStock);
      }

      return res.json(finalResult);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          stockBalances: {
            include: {
              warehouse: true,
              location: true,
            },
          },
          exceptions: {
            where: { status: { in: ['NEW', 'INVESTIGATING', 'ACTION_REQUIRED'] } },
            include: { warehouse: true, location: true },
          },
          physicalCounts: {
            orderBy: { countedAt: 'desc' },
            take: 10,
            include: {
              warehouse: true,
              location: true,
              user: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const totalStock = product.stockBalances.reduce((sum, b) => sum + b.quantity, 0);
      const confidence = await ConfidenceScoreService.calculateProductConfidence(product.id);

      const recentMovements = await prisma.stockLedger.findMany({
        where: { productId: id },
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: { user: { select: { id: true, name: true } } },
      });

      return res.json({
        ...product,
        totalStock,
        confidence,
        recentMovements,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createProduct(req: any, res: Response) {
    try {
      const {
        name,
        sku,
        description,
        categoryId,
        uom = 'units',
        reorderLevel = 10,
        costPrice = 0,
        countingPeriodDays = 30,
        warehouseId,
        locationId,
        initialStock = 0,
      } = req.body;

      if (!name || !sku || !categoryId) {
        return res.status(400).json({ error: 'Name, SKU, and Category are required.' });
      }

      const existing = await prisma.product.findUnique({ where: { sku } });
      if (existing) {
        return res.status(400).json({ error: `Product with SKU '${sku}' already exists.` });
      }

      const product = await prisma.$transaction(async (tx) => {
        const newProduct = await tx.product.create({
          data: {
            name,
            sku,
            description,
            categoryId,
            uom,
            reorderLevel: Number(reorderLevel),
            costPrice: Number(costPrice),
            countingPeriodDays: Number(countingPeriodDays),
            lastCountDate: initialStock > 0 ? new Date() : null,
          },
        });

        if (warehouseId && locationId && Number(initialStock) > 0) {
          const qty = Number(initialStock);
          const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId } });
          const location = await tx.location.findUnique({ where: { id: locationId } });

          await StockService.adjustLocationStock(
            {
              productId: newProduct.id,
              warehouseId,
              locationId,
              quantityDelta: qty,
            },
            tx
          );

          await LedgerService.record(
            {
              productId: newProduct.id,
              sku: newProduct.sku,
              operation: 'RECEIPT',
              referenceType: 'RECEIPT',
              referenceId: 'INITIAL_STOCK',
              sourceName: 'Initial Setup',
              destName: `${warehouse?.name || 'Warehouse'} / ${location?.name || 'Location'}`,
              quantityChange: qty,
              balanceAfter: qty,
              userId: req.user?.id,
              notes: 'Initial inventory intake',
            },
            tx
          );
        }

        await ExceptionEngine.evaluateProductRules(newProduct.id, tx);
        return newProduct;
      });

      return res.status(201).json(product);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async listCategories(req: Request, res: Response) {
    try {
      const categories = await prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: 'asc' },
      });
      return res.json(categories);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createCategory(req: Request, res: Response) {
    try {
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ error: 'Category name is required.' });

      const category = await prisma.category.create({
        data: { name, description },
      });
      return res.status(201).json(category);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateProduct(req: any, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        categoryId,
        uom,
        reorderLevel,
        reorderQuantity,
        costPrice,
        countingPeriodDays,
        isActive,
      } = req.body;

      const updated = await prisma.product.update({
        where: { id },
        data: {
          name: name !== undefined ? name : undefined,
          description: description !== undefined ? description : undefined,
          categoryId: categoryId !== undefined ? categoryId : undefined,
          uom: uom !== undefined ? uom : undefined,
          reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : undefined,
          reorderQuantity: reorderQuantity !== undefined ? Number(reorderQuantity) : undefined,
          costPrice: costPrice !== undefined ? Number(costPrice) : undefined,
          countingPeriodDays: countingPeriodDays !== undefined ? Number(countingPeriodDays) : undefined,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        },
        include: {
          category: true,
          stockBalances: {
            include: {
              warehouse: { select: { id: true, name: true, code: true } },
              location: { select: { id: true, name: true, code: true, rack: true } },
            },
          },
        },
      });

      const { AuditService } = await import('../services/audit.service');
      await AuditService.log({
        userId: req.user?.id,
        action: 'PRODUCT_UPDATE',
        entity: 'Product',
        entityId: updated.id,
        metadata: { sku: updated.sku, name: updated.name },
      });

      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteProduct(req: any, res: Response) {
    try {
      const { id } = req.params;
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          stockBalances: true,
          ledgerEntries: { take: 1 },
        },
      });

      if (!product) return res.status(404).json({ error: 'Product not found' });

      const totalStock = product.stockBalances.reduce((sum, b) => sum + b.quantity, 0);
      if (totalStock > 0 || product.ledgerEntries.length > 0) {
        // Safe archive
        const archived = await prisma.product.update({
          where: { id },
          data: { isActive: false },
        });

        const { AuditService } = await import('../services/audit.service');
        await AuditService.log({
          userId: req.user?.id,
          action: 'PRODUCT_ARCHIVE',
          entity: 'Product',
          entityId: id,
          metadata: { sku: product.sku, reason: 'Archived due to existing stock/movements' },
        });

        return res.json({ message: 'Product archived successfully', product: archived });
      }

      await prisma.product.delete({ where: { id } });
      return res.json({ message: 'Product deleted permanently' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
