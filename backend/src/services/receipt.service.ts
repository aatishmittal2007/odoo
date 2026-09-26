import prisma from '../prisma';
import { StockService } from './stock.service';
import { LedgerService } from './ledger.service';
import { ExceptionEngine } from './exception-engine';

export class ReceiptService {
  static async listReceipts(filters?: { status?: string; search?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { receiptNumber: { contains: filters.search } },
        { supplier: { contains: filters.search } },
      ];
    }
    return await prisma.receipt.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        destinationWarehouse: true,
        destinationLocation: true,
        items: {
          include: { product: true },
        },
      },
    });
  }

  static async getReceipt(id: string) {
    return await prisma.receipt.findUnique({
      where: { id },
      include: {
        destinationWarehouse: true,
        destinationLocation: true,
        items: {
          include: { product: true },
        },
      },
    });
  }

  static async createReceipt(data: {
    receiptNumber?: string;
    supplier: string;
    destinationWarehouseId: string;
    destinationLocationId: string;
    notes?: string;
    items: { productId: string; quantity: number }[];
  }) {
    const count = await prisma.receipt.count();
    const receiptNumber = data.receiptNumber || `REC-${String(count + 1).padStart(3, '0')}`;

    return await prisma.receipt.create({
      data: {
        receiptNumber,
        supplier: data.supplier,
        destinationWarehouseId: data.destinationWarehouseId,
        destinationLocationId: data.destinationLocationId,
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
        destinationWarehouse: true,
        destinationLocation: true,
      },
    });
  }

  static async validateReceipt(id: string, userId?: string) {
    return await prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.findUnique({
        where: { id },
        include: {
          items: { include: { product: true } },
          destinationWarehouse: true,
          destinationLocation: true,
        },
      });

      if (!receipt) {
        throw new Error('Receipt not found');
      }

      if (receipt.status === 'DONE') {
        throw new Error('Receipt has already been validated and processed');
      }

      const destName = `${receipt.destinationWarehouse.name} / ${receipt.destinationLocation.name}`;
      const sourceName = `Supplier: ${receipt.supplier}`;

      for (const item of receipt.items) {
        // Increment location stock
        const { totalCompanyStock } = await StockService.adjustLocationStock(
          {
            productId: item.productId,
            warehouseId: receipt.destinationWarehouseId,
            locationId: receipt.destinationLocationId,
            quantityDelta: item.quantity,
          },
          tx
        );

        // Record in Stock Ledger
        await LedgerService.record(
          {
            productId: item.productId,
            sku: item.product.sku,
            operation: 'RECEIPT',
            referenceType: 'RECEIPT',
            referenceId: receipt.receiptNumber,
            sourceName,
            destName,
            quantityChange: item.quantity,
            balanceAfter: totalCompanyStock,
            userId,
            notes: `Receipt from ${receipt.supplier}`,
          },
          tx
        );

        // Update item received quantity
        await tx.receiptItem.update({
          where: { id: item.id },
          data: { receivedQuantity: item.quantity },
        });

        // Trigger exception check (e.g. check if low stock condition resolved)
        await ExceptionEngine.evaluateProductRules(item.productId, tx);
      }

      const updated = await tx.receipt.update({
        where: { id },
        data: {
          status: 'DONE',
          validatedAt: new Date(),
          validatedBy: userId || null,
        },
        include: {
          items: { include: { product: true } },
          destinationWarehouse: true,
          destinationLocation: true,
        },
      });

      // Audit log entry (D17)
      const { AuditService } = await import('./audit.service');
      await AuditService.log({
        userId,
        action: 'RECEIPT_VALIDATE',
        entity: 'Receipt',
        entityId: receipt.id,
        metadata: { receiptNumber: receipt.receiptNumber, supplier: receipt.supplier, itemsCount: receipt.items.length },
      }, tx);

      return updated;
    });
  }
}
