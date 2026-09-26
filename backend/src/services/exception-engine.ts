import prisma from '../prisma';
import { ExceptionType, ExceptionSeverity, ExceptionStatus } from '../types';
import { N8nService } from './n8n/n8n.service';
import type { ToleranceResult } from './tolerance.service';

// ---------------------------------------------------------------------------
// Severity Scoring Engine
// ---------------------------------------------------------------------------

export interface SeverityMeta {
  variancePercentage: number;
  absVariance: number;
  varianceScore: number;         // base score from variance %
  criticalProduct: boolean;
  criticalProductScore: number;
  activeOrderImpact: boolean;
  activeOrderScore: number;
  negativeStock: boolean;
  negativeStockScore: number;
  repeatedDiscrepancy: boolean;
  repeatedScore: number;
  totalScore: number;
  severity: string;
  reasons: string[];
}

async function computeSeverity(
  params: {
    productId: string;
    warehouseId: string;
    locationId: string;
    absVariance: number;
    variancePercentage: number;
    currentStock?: number;
  },
  client: any
): Promise<SeverityMeta> {
  const reasons: string[] = [];
  const absPercentage = Math.abs(params.variancePercentage);

  // 1. Base variance score
  let varianceScore = 1;
  if (absPercentage >= 30) {
    varianceScore = 4;
    reasons.push(`Variance exceeded 30% (actual: ${absPercentage.toFixed(1)}%)`);
  } else if (absPercentage >= 15) {
    varianceScore = 3;
    reasons.push(`Variance exceeded 15% (actual: ${absPercentage.toFixed(1)}%)`);
  } else if (absPercentage >= 5) {
    varianceScore = 2;
    reasons.push(`Variance exceeded 5% (actual: ${absPercentage.toFixed(1)}%)`);
  } else {
    varianceScore = 1;
    reasons.push(`Variance below 5% (actual: ${absPercentage.toFixed(1)}%)`);
  }

  // 2. Absolute quantity impact (ensures large unit discrepancies carry appropriate weight)
  let absQuantityScore = 0;
  if (params.absVariance >= 25) {
    absQuantityScore = 3;
    reasons.push(`High absolute unit variance (${params.absVariance} units)`);
  } else if (params.absVariance >= 10) {
    absQuantityScore = 2;
    reasons.push(`Significant absolute unit variance (${params.absVariance} units)`);
  }

  // 3. Critical product flag (reorderLevel >= 20, high cost, or strategic inventory item)
  let criticalProductScore = 0;
  let criticalProduct = false;
  try {
    const product = await client.product.findUnique({ where: { id: params.productId } });
    if (product && (product.reorderLevel >= 20 || product.costPrice >= 20 || product.reorderQuantity >= 50)) {
      criticalProduct = true;
      criticalProductScore = 2;
      reasons.push(`Critical inventory product (reorder threshold ${product.reorderLevel} ${product.uom})`);
    }
  } catch { /* non-blocking */ }

  // 4. Active operational order impact (pending deliveries that may be affected)
  let activeOrderScore = 0;
  let activeOrderImpact = false;
  try {
    const pendingDeliveries = await client.delivery.count({
      where: {
        sourceWarehouseId: params.warehouseId,
        sourceLocationId: params.locationId,
        status: { in: ['READY', 'DRAFT'] },
      },
    });
    if (pendingDeliveries > 0) {
      activeOrderImpact = true;
      activeOrderScore = 2;
      reasons.push(`${pendingDeliveries} pending delivery order(s) may be affected`);
    }
  } catch { /* non-blocking */ }

  // 5. Negative stock condition
  let negativeStockScore = 0;
  let negativeStock = false;
  if (params.currentStock !== undefined && params.currentStock < 0) {
    negativeStock = true;
    negativeStockScore = 3;
    reasons.push(`Negative stock condition (${params.currentStock} units)`);
  }

  // 6. Repeated discrepancy for this product/location
  let repeatedScore = 0;
  let repeatedDiscrepancy = false;
  try {
    const priorCount = await client.exception.count({
      where: {
        productId: params.productId,
        warehouseId: params.warehouseId,
        type: ExceptionType.INVENTORY_DISCREPANCY,
        status: { in: [ExceptionStatus.RESOLVED, ExceptionStatus.CLOSED] },
      },
    });
    if (priorCount > 0) {
      repeatedDiscrepancy = true;
      repeatedScore = 2;
      reasons.push(`Repeated discrepancy — ${priorCount} prior resolved discrepancy exception(s) for this product/location`);
    }
  } catch { /* non-blocking */ }

  const totalScore = varianceScore + absQuantityScore + criticalProductScore + activeOrderScore + negativeStockScore + repeatedScore;

  // Map total score to severity (0-3 LOW, 4-6 MEDIUM, 7-9 HIGH, 10+ CRITICAL)
  let severity: string;
  if (totalScore >= 10) {
    severity = ExceptionSeverity.CRITICAL;
  } else if (totalScore >= 7) {
    severity = ExceptionSeverity.HIGH;
  } else if (totalScore >= 4) {
    severity = ExceptionSeverity.MEDIUM;
  } else {
    severity = ExceptionSeverity.LOW;
  }

  // Critical overrides (Section 9)
  if (negativeStock) {
    severity = ExceptionSeverity.CRITICAL;
    if (!reasons.includes('CRITICAL OVERRIDE: Negative stock detected')) {
      reasons.push('CRITICAL OVERRIDE: Negative stock detected');
    }
  } else if (params.absVariance >= 50 || absPercentage >= 50) {
    severity = ExceptionSeverity.CRITICAL;
    if (!reasons.includes('CRITICAL OVERRIDE: Severe stock shortage (>= 50% or >= 50 units)')) {
      reasons.push('CRITICAL OVERRIDE: Severe stock shortage (>= 50% or >= 50 units)');
    }
  } else if (criticalProduct && activeOrderImpact) {
    severity = ExceptionSeverity.CRITICAL;
    if (!reasons.includes('CRITICAL OVERRIDE: Critical product with active operational impact')) {
      reasons.push('CRITICAL OVERRIDE: Critical product with active operational impact');
    }
  }

  return {
    variancePercentage: params.variancePercentage,
    absVariance: params.absVariance,
    varianceScore,
    criticalProduct,
    criticalProductScore,
    activeOrderImpact,
    activeOrderScore,
    negativeStock,
    negativeStockScore,
    repeatedDiscrepancy,
    repeatedScore,
    totalScore,
    severity,
    reasons,
  };
}

// ---------------------------------------------------------------------------
// ExceptionEngine
// ---------------------------------------------------------------------------

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
   * Only called when the discrepancy is OUTSIDE tolerance (tolerance engine decides).
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
      toleranceExplanation?: string; // From ToleranceService.evaluate()
    },
    tx?: any
  ) {
    const client = tx || prisma;
    const product = await client.product.findUnique({ where: { id: params.productId } });
    if (!product) return;

    const absVariance = Math.abs(params.variance);
    const currentStockResult = await client.stockBalance.findMany({ where: { productId: params.productId } });
    const currentStock = currentStockResult.reduce((s: number, b: any) => s + b.quantity, 0);

    // Compute explainable severity
    const severityMeta = await computeSeverity(
      {
        productId: params.productId,
        warehouseId: params.warehouseId,
        locationId: params.locationId,
        absVariance,
        variancePercentage: params.variancePercentage,
        currentStock,
      },
      client
    );

    const exceptionNumber = await this.getNextExceptionNumber(client);

    const notesLines = [
      `Physical verification discrepancy: System count was ${params.systemQuantity}, physical count entered was ${params.physicalQuantity}.`,
      `Variance: ${params.variance > 0 ? '+' : ''}${params.variance} (${params.variancePercentage.toFixed(1)}%).`,
    ];
    if (params.toleranceExplanation) {
      notesLines.push(`Tolerance: ${params.toleranceExplanation}`);
    }
    notesLines.push(`Severity score: ${severityMeta.totalScore}/14 — ${severityMeta.severity}`);
    notesLines.push(`Reasons: ${severityMeta.reasons.join('; ')}`);

    const exception = await client.exception.create({
      data: {
        exceptionNumber,
        type: ExceptionType.INVENTORY_DISCREPANCY,
        productId: params.productId,
        sku: product.sku,
        warehouseId: params.warehouseId,
        locationId: params.locationId,
        severity: severityMeta.severity,
        severityMetaJson: JSON.stringify(severityMeta),
        status: ExceptionStatus.NEW,
        notes: notesLines.join(' '),
      },
    });

    // Physical Count as primary evidence
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
          toleranceExplanation: params.toleranceExplanation,
          severityScore: severityMeta.totalScore,
          severity: severityMeta.severity,
          severityReasons: severityMeta.reasons,
        }),
      },
    });

    // Auto-attach recent relevant operations as evidence
    await this.attachRecentEvidence(exception.id, params.productId, client);

    // Create default investigation tasks
    await this.createDefaultTasks(exception.id, params.warehouseId, params.locationId, client);

    // Notify n8n automation layer asynchronously (non-blocking)
    this.notifyN8n(exception, {
      variance: params.variance,
      variancePercentage: params.variancePercentage,
      systemQuantity: params.systemQuantity,
      physicalQuantity: params.physicalQuantity,
      severityScore: severityMeta.totalScore,
      severityReasons: severityMeta.reasons,
    });

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
    const product = await client.product.findUnique({ where: { id: params.productId } });
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
        severityMetaJson: JSON.stringify({
          totalScore: 7,
          severity: 'HIGH',
          reasons: ['Location mismatch — product found in unexpected location'],
        }),
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

      const isLarge = absChange >= 30 || percentChange >= 30;
      const severity = isLarge ? ExceptionSeverity.CRITICAL : ExceptionSeverity.HIGH;
      const score = isLarge ? 10 : 7;
      const reasons = [
        `Adjustment of ${adjustment.quantityChange > 0 ? '+' : ''}${adjustment.quantityChange} units (${percentChange.toFixed(1)}% of stock)`,
        isLarge ? 'Absolute or percentage change exceeds large-adjustment threshold' : 'Change exceeds unusual-adjustment threshold',
      ];

      const exception = await client.exception.create({
        data: {
          exceptionNumber,
          type: ExceptionType.UNUSUAL_ADJUSTMENT,
          productId: product.id,
          sku: product.sku,
          warehouseId: adjustment.warehouseId,
          locationId: adjustment.locationId,
          severity,
          severityMetaJson: JSON.stringify({ totalScore: score, severity, reasons }),
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
            severityMetaJson: JSON.stringify({
              totalScore: 12,
              severity: 'CRITICAL',
              reasons: [`Negative stock: ${totalStock} ${product.uom}`, 'Negative stock is always CRITICAL'],
            }),
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
        const severity = totalStock === 0 ? ExceptionSeverity.CRITICAL : ExceptionSeverity.HIGH;
        const score = totalStock === 0 ? 10 : 7;
        const exceptionNumber = await this.getNextExceptionNumber(client);
        await client.exception.create({
          data: {
            exceptionNumber,
            type: ExceptionType.LOW_STOCK,
            productId,
            sku: product.sku,
            warehouseId,
            locationId,
            severity,
            severityMetaJson: JSON.stringify({
              totalScore: score,
              severity,
              reasons: [`Stock ${totalStock} ${product.uom} is at or below reorder level (${product.reorderLevel} ${product.uom})`],
            }),
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
          const overdueDays = Math.floor(daysSinceCount - product.countingPeriodDays);
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
              severityMetaJson: JSON.stringify({
                totalScore: 4,
                severity: 'MEDIUM',
                reasons: [`Physical verification overdue by ${overdueDays} days (cycle: every ${product.countingPeriodDays} days)`],
              }),
              status: ExceptionStatus.NEW,
              notes: `Physical verification is overdue by ${overdueDays} days (cycle: every ${product.countingPeriodDays} days).`,
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
      include: { items: true },
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
              severityMetaJson: JSON.stringify({
                totalScore: 7,
                severity: 'HIGH',
                reasons: [`Transfer #${transfer.transferNumber} incomplete for more than ${staleHours}h`],
              }),
              status: ExceptionStatus.NEW,
              notes: `Transfer #${transfer.transferNumber} has remained incomplete in status '${transfer.status}' for more than ${staleHours} hours.`,
            },
          });
        }
      }
    }
  }

  /**
   * Automatically attach recent ledger events as evidence.
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
   * Populate realistic investigation tasks for warehouse staff.
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

  private static notifyN8n(exception: any, extraData: any = {}) {
    try {
      N8nService.dispatchEvent('exception.created', {
        exceptionId: exception.id,
        exceptionNumber: exception.exceptionNumber,
        severity: exception.severity,
        type: exception.type,
        productId: exception.productId,
        sku: exception.sku,
        warehouseId: exception.warehouseId,
        locationId: exception.locationId,
        ...extraData,
      });

      if (exception.severity === ExceptionSeverity.HIGH || exception.severity === ExceptionSeverity.CRITICAL) {
        N8nService.dispatchEvent('exception.high_severity', {
          exceptionId: exception.id,
          exceptionNumber: exception.exceptionNumber,
          severity: exception.severity,
          type: exception.type,
          productId: exception.productId,
          sku: exception.sku,
          warehouseId: exception.warehouseId,
          locationId: exception.locationId,
          ...extraData,
        });
      }
    } catch (err: any) {
      console.warn(`[ExceptionEngine] Non-blocking n8n notification error: ${err.message}`);
    }
  }
}
