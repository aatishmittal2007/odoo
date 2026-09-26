import prisma from '../prisma';
import { StockService } from './stock.service';
import { ExceptionEngine } from './exception-engine';
import { ToleranceService } from './tolerance.service';

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

      // ---------------------------------------------------------------
      // TOLERANCE ENGINE — evaluate before deciding whether to raise exception
      // ---------------------------------------------------------------
      const toleranceResult = ToleranceService.evaluate(systemQuantity, physicalQuantity);

      const countTotal = await tx.physicalCount.count();
      const countNumber = data.countNumber || `CNT-${String(countTotal + 1).padStart(3, '0')}`;

      // Create physical count record (ALWAYS — count is evidence regardless of tolerance)
      const countRecord = await tx.physicalCount.create({
        data: {
          countNumber,
          warehouseId: data.warehouseId,
          locationId: data.locationId,
          productId: data.productId,
          systemQuantity,
          physicalQuantity,
          variance: toleranceResult.variance,
          variancePercentage: toleranceResult.variancePercentage,
          // Status reflects tolerance outcome
          status: toleranceResult.withinTolerance ? 'RECONCILED' : 'RECORDED',
          notes: [
            data.notes,
            toleranceResult.explanation,
          ].filter(Boolean).join(' | '),
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

      // ---------------------------------------------------------------
      // IMPORTANT: Physical count does NOT silently change stock.
      // Only an explicit resolution/adjustment can change inventory.
      // Exception is only raised when OUTSIDE tolerance.
      // ---------------------------------------------------------------
      if (!toleranceResult.withinTolerance) {
        await ExceptionEngine.createDiscrepancyException(
          {
            count: countRecord,
            systemQuantity,
            physicalQuantity,
            variance: toleranceResult.variance,
            variancePercentage: toleranceResult.variancePercentage,
            warehouseId: data.warehouseId,
            locationId: data.locationId,
            productId: data.productId,
            userId: data.userId,
            toleranceExplanation: toleranceResult.explanation,
          },
          tx
        );
      }

      // Audit log entry
      const { AuditService } = await import('./audit.service');
      await AuditService.log(
        {
          userId: data.userId,
          action: 'PHYSICAL_COUNT_SUBMIT',
          entity: 'PhysicalCount',
          entityId: countRecord.id,
          metadata: {
            countNumber,
            systemQuantity,
            physicalQuantity,
            variance: toleranceResult.variance,
            variancePercentage: toleranceResult.variancePercentage,
            withinTolerance: toleranceResult.withinTolerance,
            toleranceTier: toleranceResult.toleranceRule.tier,
            allowedVariance: toleranceResult.toleranceRule.allowedVariance,
            exceptionRaised: !toleranceResult.withinTolerance,
          },
        },
        tx
      );

      return {
        ...countRecord,
        toleranceResult, // Include tolerance details in the API response
      };
    });
  }
}
