import prisma from '../prisma';
import { StockService } from './stock.service';
import { ExceptionEngine } from './exception-engine';

export class PhysicalCountService {
  static async listCounts(filters?: { productId?: string; warehouseId?: string }) {
    const where: any = {};
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.warehouseId) where.warehouseId = filters.warehouseId;

    return await prisma.physicalCount.findMany({
      where,
      orderBy: { countedAt: 'desc' },
      include: {
        product: true,
        warehouse: true,
        location: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async recordCount(data: {
    countNumber?: string;
    warehouseId: string;
    locationId: string;
    productId: string;
    physicalQuantity: number;
    notes?: string;
    userId?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      // Find current system balance at this location
      const balance = await StockService.getOrCreateBalance(
        data.productId,
        data.warehouseId,
        data.locationId,
        tx
      );

      const systemQuantity = balance.quantity;
      const physicalQuantity = data.physicalQuantity;
      const variance = physicalQuantity - systemQuantity;
      const variancePercentage =
        systemQuantity !== 0 ? (variance / systemQuantity) * 100 : variance === 0 ? 0 : 100;

      const countTotal = await tx.physicalCount.count();
      const countNumber = data.countNumber || `CNT-${String(countTotal + 1).padStart(3, '0')}`;

      // Create physical count record
      const countRecord = await tx.physicalCount.create({
        data: {
          countNumber,
          warehouseId: data.warehouseId,
          locationId: data.locationId,
          productId: data.productId,
          systemQuantity,
          physicalQuantity,
          variance,
          variancePercentage,
          status: 'RECORDED',
          notes: data.notes,
          countedBy: data.userId || null,
        },
        include: {
          product: true,
          warehouse: true,
          location: true,
        },
      });

      // Update product's last count date
      await tx.product.update({
        where: { id: data.productId },
        data: { lastCountDate: new Date() },
      });

      // Update balance lastVerifiedAt
      await tx.stockBalance.update({
        where: { id: balance.id },
        data: { lastVerifiedAt: new Date() },
      });

      // Trigger Exception Engine rule for Physical Discrepancy if variance != 0
      if (variance !== 0) {
        await ExceptionEngine.createDiscrepancyException(
          {
            count: countRecord,
            systemQuantity,
            physicalQuantity,
            variance,
            variancePercentage,
            warehouseId: data.warehouseId,
            locationId: data.locationId,
            productId: data.productId,
            userId: data.userId,
          },
          tx
        );
      }

      // Audit log entry (D17)
      const { AuditService } = await import('./audit.service');
      await AuditService.log({
        userId: data.userId,
        action: 'PHYSICAL_COUNT_SUBMIT',
        entity: 'PhysicalCount',
        entityId: countRecord.id,
        metadata: {
          countNumber,
          systemQuantity,
          physicalQuantity,
          variance,
          variancePercentage,
        },
      }, tx);

      return countRecord;
    });
  }
}
