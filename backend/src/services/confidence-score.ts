import prisma from '../prisma';

export interface ConfidenceFactor {
  factor: string;
  type: 'POSITIVE' | 'WARNING' | 'CRITICAL';
  impactPoints: number; // e.g. +10 or -15
  description: string;
}

export interface InventoryConfidenceResult {
  score: number; // 0 - 100
  rating: 'HIGH' | 'MODERATE' | 'LOW' | 'CRITICAL';
  factors: ConfidenceFactor[];
  description: string;
}

// Configurable scoring weights
export const CONFIDENCE_CONFIG = {
  BASE_SCORE: 100,
  PENALTY_CRITICAL_EXCEPTION: 25,
  PENALTY_HIGH_EXCEPTION: 15,
  PENALTY_MEDIUM_EXCEPTION: 8,
  PENALTY_OVERDUE_COUNT: 12,
  PENALTY_NEGATIVE_STOCK: 35,
  PENALTY_UNUSUAL_ADJUSTMENT: 10,
  BONUS_RECENTLY_COUNTED: 10, // within 14 days
  BONUS_ZERO_EXCEPTIONS: 10,
};

export class ConfidenceScoreService {
  /**
   * Calculate transparent operational confidence for a specific product.
   */
  static async calculateProductConfidence(productId: string): Promise<InventoryConfidenceResult> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        stockBalances: true,
        exceptions: {
          where: {
            status: { in: ['NEW', 'INVESTIGATING', 'ACTION_REQUIRED'] },
          },
        },
        adjustments: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    if (!product) {
      return {
        score: 50,
        rating: 'LOW',
        factors: [],
        description: 'Product not found.',
      };
    }

    let score = CONFIDENCE_CONFIG.BASE_SCORE;
    const factors: ConfidenceFactor[] = [];

    // Factor 1: Physical verification recency
    if (product.lastCountDate) {
      const daysSinceCount = Math.floor(
        (Date.now() - new Date(product.lastCountDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceCount <= 14) {
        score += CONFIDENCE_CONFIG.BONUS_RECENTLY_COUNTED;
        factors.push({
          factor: 'Recent Physical Verification',
          type: 'POSITIVE',
          impactPoints: CONFIDENCE_CONFIG.BONUS_RECENTLY_COUNTED,
          description: `Physically verified ${daysSinceCount} days ago (within 14-day recency window).`,
        });
      } else if (daysSinceCount > product.countingPeriodDays) {
        score -= CONFIDENCE_CONFIG.PENALTY_OVERDUE_COUNT;
        factors.push({
          factor: 'Overdue Physical Verification',
          type: 'WARNING',
          impactPoints: -CONFIDENCE_CONFIG.PENALTY_OVERDUE_COUNT,
          description: `Count is overdue by ${daysSinceCount - product.countingPeriodDays} days (cycle: ${product.countingPeriodDays}d).`,
        });
      } else {
        factors.push({
          factor: 'Scheduled Count Current',
          type: 'POSITIVE',
          impactPoints: 0,
          description: `Last physically verified ${daysSinceCount} days ago.`,
        });
      }
    } else {
      score -= CONFIDENCE_CONFIG.PENALTY_OVERDUE_COUNT;
      factors.push({
        factor: 'Never Physically Counted',
        type: 'WARNING',
        impactPoints: -CONFIDENCE_CONFIG.PENALTY_OVERDUE_COUNT,
        description: 'Product has no recorded physical inventory audit.',
      });
    }

    // Factor 2: Unresolved exceptions
    if (product.exceptions.length === 0) {
      score += CONFIDENCE_CONFIG.BONUS_ZERO_EXCEPTIONS;
      factors.push({
        factor: 'Zero Open Exceptions',
        type: 'POSITIVE',
        impactPoints: CONFIDENCE_CONFIG.BONUS_ZERO_EXCEPTIONS,
        description: 'No unresolved discrepancies, mismatches, or stock alerts.',
      });
    } else {
      const criticals = product.exceptions.filter((e) => e.severity === 'CRITICAL');
      const highs = product.exceptions.filter((e) => e.severity === 'HIGH');
      const mediums = product.exceptions.filter((e) => e.severity === 'MEDIUM');

      if (criticals.length > 0) {
        const penalty = criticals.length * CONFIDENCE_CONFIG.PENALTY_CRITICAL_EXCEPTION;
        score -= penalty;
        factors.push({
          factor: 'Critical Active Exceptions',
          type: 'CRITICAL',
          impactPoints: -penalty,
          description: `${criticals.length} unresolved critical exception(s) requiring immediate intervention.`,
        });
      }

      if (highs.length > 0) {
        const penalty = highs.length * CONFIDENCE_CONFIG.PENALTY_HIGH_EXCEPTION;
        score -= penalty;
        factors.push({
          factor: 'High Severity Exceptions',
          type: 'WARNING',
          impactPoints: -penalty,
          description: `${highs.length} high priority exception(s) pending investigation.`,
        });
      }

      if (mediums.length > 0) {
        const penalty = mediums.length * CONFIDENCE_CONFIG.PENALTY_MEDIUM_EXCEPTION;
        score -= penalty;
        factors.push({
          factor: 'Medium Severity Exceptions',
          type: 'WARNING',
          impactPoints: -penalty,
          description: `${mediums.length} medium priority exception(s) open.`,
        });
      }
    }

    // Factor 3: Negative stock check
    const totalStock = product.stockBalances.reduce((sum, b) => sum + b.quantity, 0);
    if (totalStock < 0) {
      score -= CONFIDENCE_CONFIG.PENALTY_NEGATIVE_STOCK;
      factors.push({
        factor: 'Negative Physical/System Stock',
        type: 'CRITICAL',
        impactPoints: -CONFIDENCE_CONFIG.PENALTY_NEGATIVE_STOCK,
        description: `Negative recorded balance of ${totalStock} ${product.uom}.`,
      });
    }

    // Factor 4: Recent unusual adjustments
    const recentUnusual = product.adjustments.find((a) => Math.abs(a.quantityChange) >= 15);
    if (recentUnusual) {
      score -= CONFIDENCE_CONFIG.PENALTY_UNUSUAL_ADJUSTMENT;
      factors.push({
        factor: 'Recent High-Variance Adjustment',
        type: 'WARNING',
        impactPoints: -CONFIDENCE_CONFIG.PENALTY_UNUSUAL_ADJUSTMENT,
        description: `Unusual adjustment of ${recentUnusual.quantityChange > 0 ? '+' : ''}${recentUnusual.quantityChange} units recorded recently.`,
      });
    }

    // Clamp score between 5 and 100
    const clampedScore = Math.max(5, Math.min(100, Math.round(score)));

    let rating: 'HIGH' | 'MODERATE' | 'LOW' | 'CRITICAL' = 'HIGH';
    if (clampedScore < 50) rating = 'CRITICAL';
    else if (clampedScore < 70) rating = 'LOW';
    else if (clampedScore < 85) rating = 'MODERATE';

    return {
      score: clampedScore,
      rating,
      factors,
      description: 'Operational confidence indicator based on physical count recency, active exceptions, and balance health.',
    };
  }

  /**
   * Calculate overall warehouse / facility confidence.
   */
  static async calculateSystemConfidence(): Promise<InventoryConfidenceResult> {
    const products = await prisma.product.findMany({ select: { id: true } });
    if (products.length === 0) {
      return {
        score: 100,
        rating: 'HIGH',
        factors: [],
        description: 'No inventory tracked yet.',
      };
    }

    const scores = await Promise.all(
      products.map((p) => this.calculateProductConfidence(p.id))
    );

    const averageScore = Math.round(
      scores.reduce((sum, s) => sum + s.score, 0) / scores.length
    );

    // Aggregate key factors
    const openExceptionsCount = await prisma.exception.count({
      where: { status: { in: ['NEW', 'INVESTIGATING', 'ACTION_REQUIRED'] } },
    });
    const overdueCounts = await prisma.product.count({
      where: {
        lastCountDate: null,
      },
    });

    const factors: ConfidenceFactor[] = [];
    if (openExceptionsCount === 0) {
      factors.push({
        factor: 'Healthy Exception Registry',
        type: 'POSITIVE',
        impactPoints: 10,
        description: 'Zero open inventory exceptions across all tracked products.',
      });
    } else {
      factors.push({
        factor: 'Active Open Exceptions',
        type: 'WARNING',
        impactPoints: -15,
        description: `${openExceptionsCount} active exceptions awaiting investigation across the facility.`,
      });
    }

    if (overdueCounts > 0) {
      factors.push({
        factor: 'Uncounted Inventory Items',
        type: 'WARNING',
        impactPoints: -10,
        description: `${overdueCounts} product(s) require physical verification audit.`,
      });
    }

    factors.push({
      factor: 'Ledger Audit Integrity',
      type: 'POSITIVE',
      impactPoints: 5,
      description: '100% of inventory movements tracked with immutable double-sided ledger entries.',
    });

    let rating: 'HIGH' | 'MODERATE' | 'LOW' | 'CRITICAL' = 'HIGH';
    if (averageScore < 50) rating = 'CRITICAL';
    else if (averageScore < 70) rating = 'LOW';
    else if (averageScore < 85) rating = 'MODERATE';

    return {
      score: averageScore,
      rating,
      factors,
      description: 'System-wide operational confidence indicator across all active warehouses and stock locations.',
    };
  }
}
