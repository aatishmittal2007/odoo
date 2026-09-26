import prisma from '../prisma';
import { ExceptionType, ExceptionSeverity, ExceptionStatus } from '../types';

export class ExceptionEngine {
  static async getNextExceptionNumber(client: any): Promise<string> {
    const all = await client.exception.findMany({ select: { exceptionNumber: true } });
    let max = 0;
    for (const item of all) {
      const match = item.exceptionNumber.match(/INC-(\d+)/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > max) max = val;
      }
    }
    return `INC-${String(max + 1).padStart(3, '0')}`;
  }

  /**
   * Rule 1: Physical Discrepancy
   */
  static async createDiscrepancyException(
    params: {
      count: any;
      systemQuantity: number;
      physicalQuantity: number;
      variance: number;
      variancePercentage: number;
      warehouseId: string;
      locationId: string;
      productId: string;
      userId?: string;
    },
    tx?: any
  ) {
    const client = tx || prisma;
    const product = await client.product.findUnique({
      where: { id: params.productId },
    });
    if (!product) return;

    const absVariance = Math.abs(params.variance);
    const absPercentage = Math.abs(params.variancePercentage);

    let severity = ExceptionSeverity.MEDIUM;
    if (absPercentage >= 25 || absVariance >= 20) {
      severity = ExceptionSeverity.CRITICAL;
    } else if (absPercentage >= 10 || absVariance >= 10) {
      severity = ExceptionSeverity.HIGH;
    }

    const exceptionNumber = await this.getNextExceptionNumber(client);

    const exception = await client.exception.create({
      data: {
        exceptionNumber,
        type: ExceptionType.INVENTORY_DISCREPANCY,
        productId: params.productId,
        sku: product.sku,
        warehouseId: params.warehouseId,
        locationId: params.locationId,
        severity,
        status: ExceptionStatus.NEW,
        notes: `Physical verification discrepancy: System count was ${params.systemQuantity}, physical count entered was ${params.physicalQuantity}. Variance: ${params.variance > 0 ? '+' : ''}${params.variance} (${params.variancePercentage.toFixed(1)}%).`,
      },
    });

    // Automatically link Physical Count as evidence
    await client.exceptionEvidence.create({
      data: {
        exceptionId: exception.id,
        referenceType: 'PHYSICAL_COUNT',
        referenceId: params.count.countNumber,
        title: `Physical Count #${params.count.countNumber} (${params.physicalQuantity} units)`,
        timestamp: params.count.countedAt || new Date(),
        metadataJson: JSON.stringify({
          systemQuantity: params.systemQuantity,
          physicalQuantity: params.physicalQuantity,
          variance: params.variance,
          variancePercentage: params.variancePercentage,
        }),
      },
    });

    // Auto-attach recent relevant operations on this product as potential evidence
    await this.attachRecentEvidence(exception.id, params.productId, client);

    // Create default investigation tasks for warehouse staff
    await this.createDefaultTasks(exception.id, params.warehouseId, params.locationId, client);

    return exception;
  }

  /**
   * Rule 2: Location Mismatch
   */
  static async createLocationMismatchException(
    params: {
      productId: string;
      expectedLocationId: string;
      foundLocationId: string;
      warehouseId: string;
      notes: string;
    },
    tx?: any
  ) {
    const client = tx || prisma;
    const product = await client.product.findUnique({
      where: { id: params.productId },
    });
    if (!product) return;

    const exceptionNumber = await this.getNextExceptionNumber(client);

    return await client.exception.create({
      data: {
        exceptionNumber,
        type: ExceptionType.LOCATION_MISMATCH,
        productId: params.productId,
        sku: product.sku,
        warehouseId: params.warehouseId,
        locationId: params.foundLocationId,
        severity: ExceptionSeverity.HIGH,
        status: ExceptionStatus.NEW,
        notes: params.notes,
      },
    });
  }

  /**
   * Rule 3: Unusual Adjustment
   */
  static async checkAdjustmentRule(
    adjustment: any,
    product: any,
    totalStockAfter: number,
    tx?: any
  ) {
    const client = tx || prisma;
    const absChange = Math.abs(adjustment.quantityChange);
    const stockBase = totalStockAfter - adjustment.quantityChange;
    const percentChange = stockBase > 0 ? (absChange / stockBase) * 100 : 100;

    // Threshold: adjustment >= 15 units or >= 15% of stock
    if (absChange >= 15 || percentChange >= 15) {
      const exceptionNumber = await this.getNextExceptionNumber(client);

      const exception = await client.exception.create({
        data: {
          exceptionNumber,
          type: ExceptionType.UNUSUAL_ADJUSTMENT,
          productId: product.id,
          sku: product.sku,
          warehouseId: adjustment.warehouseId,
          locationId: adjustment.locationId,
          severity: absChange >= 30 || percentChange >= 30 ? ExceptionSeverity.CRITICAL : ExceptionSeverity.HIGH,
          status: ExceptionStatus.NEW,
          notes: `Unusual inventory adjustment of ${adjustment.quantityChange > 0 ? '+' : ''}${adjustment.quantityChange} units (${percentChange.toFixed(1)}% of stock). Reason: ${adjustment.reason}.`,
        },
      });

      await client.exceptionEvidence.create({
        data: {
          exceptionId: exception.id,
          referenceType: 'ADJUSTMENT',
          referenceId: adjustment.adjustmentNumber,
          title: `Adjustment #${adjustment.adjustmentNumber} (${adjustment.quantityChange > 0 ? '+' : ''}${adjustment.quantityChange} units)`,
          timestamp: adjustment.createdAt,
          metadataJson: JSON.stringify({
            quantityChange: adjustment.quantityChange,
            reason: adjustment.reason,
          }),
        },
      });

      await this.attachRecentEvidence(exception.id, product.id, client);
      await this.createDefaultTasks(exception.id, adjustment.warehouseId, adjustment.locationId, client);
    }
  }

  /**
   * Rule 4, 5, 6: Product-Level Rules (Overdue Count, Low Stock, Negative Stock)
   */
  static async evaluateProductRules(productId: string, tx?: any) {
    const client = tx || prisma;
    const product = await client.product.findUnique({
      where: { id: productId },
      include: {
        stockBalances: {
          include: { warehouse: true, location: true },
        },
      },
    });

    if (!product) return;

    const totalStock = product.stockBalances.reduce((sum: number, b: any) => sum + b.quantity, 0);
    const primaryBalance = product.stockBalances[0];
    const warehouseId = primaryBalance?.warehouseId || '';
    const locationId = primaryBalance?.locationId || '';

    // Check Negative Stock (Rule 6)
    if (totalStock < 0) {
      const existing = await client.exception.findFirst({
        where: {
          productId,
          type: ExceptionType.NEGATIVE_STOCK,
          status: { in: [ExceptionStatus.NEW, ExceptionStatus.INVESTIGATING, ExceptionStatus.ACTION_REQUIRED] },
        },
      });

      if (!existing && warehouseId && locationId) {
        const exceptionNumber = await this.getNextExceptionNumber(client);
        await client.exception.create({
          data: {
            exceptionNumber,
            type: ExceptionType.NEGATIVE_STOCK,
            productId,
            sku: product.sku,
            warehouseId,
            locationId,
            severity: ExceptionSeverity.CRITICAL,
            status: ExceptionStatus.NEW,
            notes: `Critical negative stock condition detected: ${totalStock} ${product.uom}. Immediate reconciliation required.`,
          },
        });
      }
    }

    // Check Low Stock (Rule 5)
    if (totalStock <= product.reorderLevel && totalStock >= 0) {
      const existing = await client.exception.findFirst({
        where: {
          productId,
          type: ExceptionType.LOW_STOCK,
          status: { in: [ExceptionStatus.NEW, ExceptionStatus.INVESTIGATING, ExceptionStatus.ACTION_REQUIRED] },
        },
      });

      if (!existing && warehouseId && locationId) {
        const exceptionNumber = await this.getNextExceptionNumber(client);
        await client.exception.create({
          data: {
            exceptionNumber,
            type: ExceptionType.LOW_STOCK,
            productId,
            sku: product.sku,
            warehouseId,
            locationId,
            severity: totalStock === 0 ? ExceptionSeverity.CRITICAL : ExceptionSeverity.HIGH,
            status: ExceptionStatus.NEW,
            notes: `Current stock of ${totalStock} ${product.uom} is at or below the reorder threshold (${product.reorderLevel} ${product.uom}).`,
          },
        });
      }
    }

    // Check Count Overdue (Rule 4)
    if (product.lastCountDate) {
      const daysSinceCount = (Date.now() - new Date(product.lastCountDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCount > product.countingPeriodDays) {
        const existing = await client.exception.findFirst({
          where: {
            productId,
            type: ExceptionType.COUNT_OVERDUE,
            status: { in: [ExceptionStatus.NEW, ExceptionStatus.INVESTIGATING, ExceptionStatus.ACTION_REQUIRED] },
          },
        });

        if (!existing && warehouseId && locationId) {
          const exceptionNumber = await this.getNextExceptionNumber(client);
          await client.exception.create({
            data: {
              exceptionNumber,
              type: ExceptionType.COUNT_OVERDUE,
              productId,
              sku: product.sku,
              warehouseId,
              locationId,
              severity: ExceptionSeverity.MEDIUM,
              status: ExceptionStatus.NEW,
              notes: `Physical verification is overdue by ${Math.floor(daysSinceCount - product.countingPeriodDays)} days (cycle: every ${product.countingPeriodDays} days).`,
            },
          });
        }
      }
    }
  }

  /**
   * Rule 7: Check Stale Incomplete Transfers (> 48h)
   */
  static async checkTransferExceptions() {
    const staleHours = 48;
    const thresholdDate = new Date(Date.now() - staleHours * 60 * 60 * 1000);

    const staleTransfers = await prisma.transfer.findMany({
      where: {
        status: { in: ['READY', 'IN_TRANSIT'] },
        createdAt: { lt: thresholdDate },
      },
      include: {
        items: true,
      },
    });

    for (const transfer of staleTransfers) {
      for (const item of transfer.items) {
        const existing = await prisma.exception.findFirst({
          where: {
            productId: item.productId,
            type: ExceptionType.TRANSFER_EXCEPTION,
            status: { in: [ExceptionStatus.NEW, ExceptionStatus.INVESTIGATING, ExceptionStatus.ACTION_REQUIRED] },
          },
        });

        if (!existing) {
          const product = await prisma.product.findUnique({ where: { id: item.productId } });
          const exceptionNumber = await this.getNextExceptionNumber(prisma);

          await prisma.exception.create({
            data: {
              exceptionNumber,
              type: ExceptionType.TRANSFER_EXCEPTION,
              productId: item.productId,
              sku: product?.sku || '',
              warehouseId: transfer.destWarehouseId,
              locationId: transfer.destLocationId,
              severity: ExceptionSeverity.HIGH,
              status: ExceptionStatus.NEW,
              notes: `Transfer #${transfer.transferNumber} has remained incomplete in status '${transfer.status}' for more than ${staleHours} hours.`,
            },
          });
        }
      }
    }
  }

  /**
   * Automatically attach recent ledger events (receipts, transfers, deliveries, adjustments) as evidence.
   */
  static async attachRecentEvidence(exceptionId: string, productId: string, client: any) {
    const recentLedgers = await client.stockLedger.findMany({
      where: { productId },
      orderBy: { timestamp: 'desc' },
      take: 8,
    });

    for (const entry of recentLedgers) {
      await client.exceptionEvidence.create({
        data: {
          exceptionId,
          referenceType: entry.referenceType,
          referenceId: entry.referenceId,
          title: `${entry.operation} #${entry.referenceId} (${entry.quantityChange > 0 ? '+' : ''}${entry.quantityChange})`,
          timestamp: entry.timestamp,
          metadataJson: JSON.stringify({
            operation: entry.operation,
            referenceType: entry.referenceType,
            referenceId: entry.referenceId,
            sourceName: entry.sourceName,
            destName: entry.destName,
            quantityChange: entry.quantityChange,
            balanceAfter: entry.balanceAfter,
            notes: entry.notes,
          }),
        },
      });
    }
  }

  /**
   * Populate realistic investigation tasks for warehouse staff
   */
  static async createDefaultTasks(exceptionId: string, warehouseId: string, locationId: string, client: any) {
    const location = await client.location.findUnique({ where: { id: locationId } });
    const locationName = location ? location.name : 'primary location';

    const tasks = [
      `Recount ${locationName}`,
      'Verify recent internal transfer manifests',
      'Verify recent outbound delivery picking slips',
      'Inspect physical area for unrecorded damaged stock',
      'Confirm physical location tagging and barcode labels',
    ];

    for (let i = 0; i < tasks.length; i++) {
      await client.investigationTask.create({
        data: {
          exceptionId,
          title: tasks[i],
          isCompleted: false,
          sortOrder: i,
        },
      });
    }
  }
}
