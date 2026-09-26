import prisma from '../prisma';
import { StockService } from './stock.service';
import { LedgerService } from './ledger.service';
import { ExceptionEngine } from './exception-engine';

export class DeliveryService {
  static async listDeliveries(filters?: { status?: string; search?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { deliveryNumber: { contains: filters.search } },
        { customer: { contains: filters.search } },
      ];
    }
    return await prisma.delivery.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        sourceWarehouse: true,
        sourceLocation: true,
        items: {
          include: { product: true },
        },
      },
    });
  }

  static async getDelivery(id: string) {
    return await prisma.delivery.findUnique({
      where: { id },
      include: {
        sourceWarehouse: true,
        sourceLocation: true,
        items: {
          include: { product: true },
        },
      },
    });
  }

  static async createDelivery(data: {
    deliveryNumber?: string;
    customer: string;
    sourceWarehouseId: string;
    sourceLocationId: string;
    notes?: string;
    items: { productId: string; quantity: number }[];
  }) {
    const count = await prisma.delivery.count();
    const deliveryNumber = data.deliveryNumber || `DEL-${String(count + 1).padStart(3, '0')}`;

    return await prisma.delivery.create({
      data: {
        deliveryNumber,
        customer: data.customer,
        sourceWarehouseId: data.sourceWarehouseId,
        sourceLocationId: data.sourceLocationId,
        notes: data.notes,
        status: 'READY',
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        sourceWarehouse: true,
        sourceLocation: true,
      },
    });
  }

  static async validateDelivery(id: string, userId?: string) {
    return await prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.findUnique({
        where: { id },
        include: {
          items: { include: { product: true } },
          sourceWarehouse: true,
          sourceLocation: true,
        },
      });

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      if (delivery.status === 'DONE') {
        throw new Error('Delivery has already been validated and shipped');
      }

      const sourceName = `${delivery.sourceWarehouse.name} / ${delivery.sourceLocation.name}`;
      const destName = `Customer: ${delivery.customer}`;

      for (const item of delivery.items) {
        // Validate sufficient stock
        const balance = await StockService.getOrCreateBalance(
          item.productId,
          delivery.sourceWarehouseId,
          delivery.sourceLocationId,
          tx
        );

        if (balance.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for '${item.product.name}' at ${sourceName}. Available: ${balance.quantity} ${item.product.uom}, Requested: ${item.quantity} ${item.product.uom}`
          );
        }

        // Decrease location stock
        const { totalCompanyStock } = await StockService.adjustLocationStock(
          {
            productId: item.productId,
            warehouseId: delivery.sourceWarehouseId,
            locationId: delivery.sourceLocationId,
            quantityDelta: -item.quantity,
          },
          tx
        );

        // Record in Stock Ledger
        await LedgerService.record(
          {
            productId: item.productId,
            sku: item.product.sku,
            operation: 'DELIVERY',
            referenceType: 'DELIVERY',
            referenceId: delivery.deliveryNumber,
            sourceName,
            destName,
            quantityChange: -item.quantity,
            balanceAfter: totalCompanyStock,
            userId,
            notes: `Delivery order for ${delivery.customer}`,
          },
          tx
        );

        // Update item delivered quantity
        await tx.deliveryItem.update({
          where: { id: item.id },
          data: { deliveredQuantity: item.quantity },
        });

        // Trigger exception check (e.g. check low stock or negative stock)
        await ExceptionEngine.evaluateProductRules(item.productId, tx);
      }

      const updated = await tx.delivery.update({
        where: { id },
        data: {
          status: 'DONE',
          validatedAt: new Date(),
          validatedBy: userId || null,
        },
        include: {
          items: { include: { product: true } },
          sourceWarehouse: true,
          sourceLocation: true,
        },
      });

      // Audit log entry (D17)
      const { AuditService } = await import('./audit.service');
      await AuditService.log({
        userId,
        action: 'DELIVERY_VALIDATE',
        entity: 'Delivery',
        entityId: delivery.id,
        metadata: { deliveryNumber: delivery.deliveryNumber, customer: delivery.customer, itemsCount: delivery.items.length },
      }, tx);

      return updated;
    });
  }
}
