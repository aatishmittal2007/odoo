import prisma from '../prisma';

export interface ImpactedOrder {
  orderId: string;
  orderNumber: string;
  customer: string;
  requiredQuantity: number;
  scheduledDate: Date;
  status: 'AT_RISK' | 'CRITICAL_SHORTAGE' | 'NORMAL';
  riskReason: string;
}

export interface BusinessImpactResult {
  hasImpact: boolean;
  message: string;
  affectedOrdersCount: number;
  potentialShortageUnits: number;
  orders: ImpactedOrder[];
  summary: {
    totalCommittedDemand: number;
    availablePhysicalStock: number;
    shortfall: number;
  };
}

export class BusinessImpactService {
  /**
   * Determine deterministic operational impact of an exception on active deliveries.
   */
  static async calculateImpact(productId: string): Promise<BusinessImpactResult> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        stockBalances: true,
        physicalCounts: {
          orderBy: { countedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!product) {
      return {
        hasImpact: false,
        message: 'No active business impact detected.',
        affectedOrdersCount: 0,
        potentialShortageUnits: 0,
        orders: [],
        summary: {
          totalCommittedDemand: 0,
          availablePhysicalStock: 0,
          shortfall: 0,
        },
      };
    }

    // Determine latest physical count or total balance
    const latestCount = product.physicalCounts[0];
    const systemStock = product.stockBalances.reduce((sum, b) => sum + b.quantity, 0);
    const availablePhysicalStock = latestCount ? latestCount.physicalQuantity : systemStock;

    // Find active/pending deliveries containing this product
    const activeDeliveries = await prisma.delivery.findMany({
      where: {
        status: { in: ['DRAFT', 'READY'] },
        items: {
          some: { productId },
        },
      },
      include: {
        items: {
          where: { productId },
        },
      },
      orderBy: { date: 'asc' },
    });

    if (activeDeliveries.length === 0) {
      return {
        hasImpact: false,
        message: 'No active business impact detected.',
        affectedOrdersCount: 0,
        potentialShortageUnits: 0,
        orders: [],
        summary: {
          totalCommittedDemand: 0,
          availablePhysicalStock,
          shortfall: 0,
        },
      };
    }

    let cumulativeDemand = 0;
    const impactedOrders: ImpactedOrder[] = [];

    for (const delivery of activeDeliveries) {
      const item = delivery.items[0];
      const required = item ? item.quantity : 0;
      cumulativeDemand += required;

      const isAtRisk = cumulativeDemand > availablePhysicalStock;
      const orderShortage = Math.max(0, cumulativeDemand - availablePhysicalStock);

      impactedOrders.push({
        orderId: delivery.id,
        orderNumber: delivery.deliveryNumber,
        customer: delivery.customer,
        requiredQuantity: required,
        scheduledDate: delivery.date,
        status: isAtRisk ? (orderShortage >= required ? 'CRITICAL_SHORTAGE' : 'AT_RISK') : 'NORMAL',
        riskReason: isAtRisk
          ? `Cumulative demand (${cumulativeDemand} ${product.uom}) exceeds physical stock (${availablePhysicalStock} ${product.uom})`
          : 'Demand covered by currently available physical stock',
      });
    }

    const atRiskOrders = impactedOrders.filter((o) => o.status !== 'NORMAL');
    const totalCommittedDemand = cumulativeDemand;
    const potentialShortageUnits = Math.max(0, totalCommittedDemand - availablePhysicalStock);

    if (atRiskOrders.length === 0) {
      return {
        hasImpact: false,
        message: 'No active business impact detected. All active orders are covered by physical stock.',
        affectedOrdersCount: 0,
        potentialShortageUnits: 0,
        orders: impactedOrders,
        summary: {
          totalCommittedDemand,
          availablePhysicalStock,
          shortfall: 0,
        },
      };
    }

    return {
      hasImpact: true,
      message: `${atRiskOrders.length} active delivery ${atRiskOrders.length === 1 ? 'order is' : 'orders may be'} affected due to inventory discrepancy.`,
      affectedOrdersCount: atRiskOrders.length,
      potentialShortageUnits,
      orders: impactedOrders,
      summary: {
        totalCommittedDemand,
        availablePhysicalStock,
        shortfall: potentialShortageUnits,
      },
    };
  }
}
