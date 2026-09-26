import prisma from '../prisma';
import { StockService } from './stock.service';
import { LedgerService } from './ledger.service';
import { ExceptionEngine } from './exception-engine';

export class AdjustmentService {
  static async listAdjustments(filters?: { productId?: string; warehouseId?: string }) {
    const where: any = {};
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.warehouseId) where.warehouseId = filters.warehouseId;

    return await prisma.adjustment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        warehouse: true,
        location: true,
      },
    });
  }

  static async createAdjustment(data: {
    adjustmentNumber?: string;
    warehouseId: string;
    locationId: string;
    productId: string;
    quantityChange: number; // positive or negative
    reason: string;
    userId?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const count = await tx.adjustment.count();
      const adjustmentNumber = data.adjustmentNumber || `ADJ-${String(count + 1).padStart(3, '0')}`;

      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });
      const warehouse = await tx.warehouse.findUnique({
        where: { id: data.warehouseId },
      });
      const location = await tx.location.findUnique({
        where: { id: data.locationId },
      });

      if (!product || !warehouse || !location) {
        throw new Error('Product, warehouse, or location not found');
      }

      // Record adjustment
      const adjustment = await tx.adjustment.create({
        data: {
          adjustmentNumber,
          warehouseId: data.warehouseId,
          locationId: data.locationId,
          productId: data.productId,
          quantityChange: data.quantityChange,
          reason: data.reason,
          status: 'APPROVED',
          createdBy: data.userId || null,
        },
      });

      // Update location stock
      const { totalCompanyStock } = await StockService.adjustLocationStock(
        {
          productId: data.productId,
          warehouseId: data.warehouseId,
          locationId: data.locationId,
          quantityDelta: data.quantityChange,
        },
        tx
      );

      const locationName = `${warehouse.name} / ${location.name}`;

      // Record ledger
      await LedgerService.record(
        {
          productId: data.productId,
          sku: product.sku,
          operation: 'ADJUSTMENT',
          referenceType: 'ADJUSTMENT',
          referenceId: adjustmentNumber,
          sourceName: data.quantityChange < 0 ? locationName : `Reason: ${data.reason}`,
          destName: data.quantityChange > 0 ? locationName : `Reason: ${data.reason}`,
          quantityChange: data.quantityChange,
          balanceAfter: totalCompanyStock,
          userId: data.userId,
          notes: data.reason,
        },
        tx
      );

      // Check for Unusual Adjustment or other exceptions
      await ExceptionEngine.checkAdjustmentRule(adjustment, product, totalCompanyStock, tx);
      await ExceptionEngine.evaluateProductRules(data.productId, tx);

      // Audit log entry (D17)
      const { AuditService } = await import('./audit.service');
      await AuditService.log({
        userId: data.userId,
        action: 'ADJUSTMENT_CREATE',
        entity: 'Adjustment',
        entityId: adjustment.id,
        metadata: {
          adjustmentNumber,
          sku: product.sku,
          quantityChange: data.quantityChange,
          reason: data.reason,
          locationName,
        },
      }, tx);

      return adjustment;
    });
  }
}
