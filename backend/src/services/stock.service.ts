import prisma from '../prisma';

export class StockService {
  /**
   * Get or initialize a stock balance for a specific product, warehouse, and location.
   */
  static async getOrCreateBalance(
    productId: string,
    warehouseId: string,
    locationId: string,
    tx?: any
  ) {
    const client = tx || prisma;
    let balance = await client.stockBalance.findUnique({
      where: {
        productId_warehouseId_locationId: {
          productId,
          warehouseId,
          locationId,
        },
      },
    });

    if (!balance) {
      balance = await client.stockBalance.create({
        data: {
          productId,
          warehouseId,
          locationId,
          quantity: 0,
          reservedQuantity: 0,
        },
      });
    }

    return balance;
  }

  /**
   * Adjust stock at a specific location atomically, returning the updated location balance and new total company balance.
   */
  static async adjustLocationStock(
    params: {
      productId: string;
      warehouseId: string;
      locationId: string;
      quantityDelta: number;
    },
    tx?: any
  ) {
    const client = tx || prisma;

    // Ensure balance record exists
    await this.getOrCreateBalance(params.productId, params.warehouseId, params.locationId, client);

    // Update the specific location balance
    const updatedBalance = await client.stockBalance.update({
      where: {
        productId_warehouseId_locationId: {
          productId: params.productId,
          warehouseId: params.warehouseId,
          locationId: params.locationId,
        },
      },
      data: {
        quantity: {
          increment: params.quantityDelta,
        },
        updatedAt: new Date(),
      },
    });

    // Calculate total stock for this product across all locations
    const allBalances = await client.stockBalance.findMany({
      where: { productId: params.productId },
    });
    const totalCompanyStock = allBalances.reduce((sum: number, b: any) => sum + b.quantity, 0);

    return {
      updatedBalance,
      totalCompanyStock,
    };
  }

  /**
   * Get company-wide total stock for a product.
   */
  static async getProductTotalStock(productId: string, tx?: any): Promise<number> {
    const client = tx || prisma;
    const balances = await client.stockBalance.findMany({
      where: { productId },
    });
    return balances.reduce((sum: number, b: any) => sum + b.quantity, 0);
  }

  /**
   * Get breakdown of stock by location for a product.
   */
  static async getProductStockBreakdown(productId: string) {
    return await prisma.stockBalance.findMany({
      where: { productId },
      include: {
        warehouse: { select: { id: true, code: true, name: true } },
        location: { select: { id: true, code: true, name: true, rack: true, shelf: true, bin: true } },
      },
    });
  }
}
