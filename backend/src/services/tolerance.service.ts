/**
 * StockSense — Tolerance Engine
 *
 * Centralized service for computing whether a physical count discrepancy
 * falls within the acceptable tolerance band.
 *
 * Hierarchy (most specific wins — currently using system-wide defaults;
 * product/category/warehouse overrides can be plugged in later):
 *   Product-specific → Category-specific → Warehouse-specific → System default
 *
 * System default tiers:
 *   0–20 units   → absolute tolerance = 1 unit (qty too small for %)
 *   21–100 units → max(2 units, 2% of systemQty)
 *   101–500 units → 2% of systemQty
 *   501+ units   → 1% of systemQty
 */

export interface ToleranceRule {
  tier: string;
  absoluteTolerance: number;
  percentageTolerance: number; // as decimal e.g. 0.02 = 2%
  allowedVariance: number;     // computed MAX(absolute, qty * %)
}

export interface ToleranceResult {
  systemQuantity: number;
  physicalQuantity: number;
  variance: number;              // physicalQty - systemQty
  absVariance: number;
  variancePercentage: number;    // (variance / systemQty) * 100, or 0 if systemQty=0
  withinTolerance: boolean;
  toleranceRule: ToleranceRule;
  explanation: string;           // Human-readable explanation for exception evidence
}

export class ToleranceService {
  /**
   * Compute the applicable tolerance rule for a given system quantity.
   * Uses system-wide defaults. Can be extended to accept product/warehouse overrides.
   */
  static computeRule(systemQuantity: number): ToleranceRule {
    const qty = Math.abs(systemQuantity);

    if (qty <= 20) {
      return {
        tier: '0–20 units (small batch)',
        absoluteTolerance: 1,
        percentageTolerance: 0,
        allowedVariance: 1,
      };
    } else if (qty <= 100) {
      const pctBased = qty * 0.02;
      const allowed = Math.max(2, pctBased);
      return {
        tier: '21–100 units',
        absoluteTolerance: 2,
        percentageTolerance: 0.02,
        allowedVariance: allowed,
      };
    } else if (qty <= 500) {
      return {
        tier: '101–500 units',
        absoluteTolerance: 0,
        percentageTolerance: 0.02,
        allowedVariance: qty * 0.02,
      };
    } else {
      return {
        tier: '501+ units (high volume)',
        absoluteTolerance: 0,
        percentageTolerance: 0.01,
        allowedVariance: qty * 0.01,
      };
    }
  }

  /**
   * Evaluate a physical count against the tolerance engine.
   * Returns full result including whether an exception should be raised.
   */
  static evaluate(systemQuantity: number, physicalQuantity: number): ToleranceResult {
    const variance = physicalQuantity - systemQuantity;
    const absVariance = Math.abs(variance);

    // Zero-stock edge cases
    if (systemQuantity === 0 && physicalQuantity === 0) {
      return {
        systemQuantity,
        physicalQuantity,
        variance: 0,
        absVariance: 0,
        variancePercentage: 0,
        withinTolerance: true,
        toleranceRule: {
          tier: 'Zero stock — no discrepancy',
          absoluteTolerance: 0,
          percentageTolerance: 0,
          allowedVariance: 0,
        },
        explanation: 'System: 0 | Physical: 0 — No discrepancy. Both are zero.',
      };
    }

    // variancePercentage: avoid divide-by-zero
    const variancePercentage =
      systemQuantity > 0 ? (variance / systemQuantity) * 100 : (physicalQuantity > 0 ? 100 : 0);

    const rule = this.computeRule(systemQuantity);
    const withinTolerance = absVariance <= rule.allowedVariance;

    const direction = variance > 0 ? '+' : '';
    const pctDisplay = variancePercentage.toFixed(1);
    const tierLabel = rule.tier;

    const explanation = [
      `System quantity: ${systemQuantity}`,
      `Physical quantity: ${physicalQuantity}`,
      `Variance: ${direction}${variance} (${direction}${pctDisplay}%)`,
      `Tolerance tier: ${tierLabel}`,
      `Allowed variance: ${rule.allowedVariance.toFixed(2)} units`,
      `Result: ${withinTolerance ? 'WITHIN TOLERANCE — no exception raised' : 'OUTSIDE TOLERANCE — exception raised'}`,
    ].join(' | ');

    return {
      systemQuantity,
      physicalQuantity,
      variance,
      absVariance,
      variancePercentage,
      withinTolerance,
      toleranceRule: rule,
      explanation,
    };
  }
}
