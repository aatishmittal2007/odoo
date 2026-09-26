import prisma from '../prisma';
import { StockService } from './stock.service';
import { LedgerService } from './ledger.service';
import { ExceptionEngine } from './exception-engine';

export class TransferService {
  static async listTransfers(filters?: { status?: string; search?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { transferNumber: { contains: filters.search } },
        { notes: { contains: filters.search } },
      ];
    }
    return await prisma.transfer.findMany({
      where,
      orderBy: { scheduledDate: 'desc' },
      include: {
        sourceWarehouse: true,
        sourceLocation: true,
        destWarehouse: true,
        destLocation: true,
        items: {
          include: { product: true },
        },
      },
    });
  }

  static async getTransfer(id: string) {
    return await prisma.transfer.findUnique({
      where: { id },
      include: {
        sourceWarehouse: true,
        sourceLocation: true,
        destWarehouse: true,
        destLocation: true,
        items: {
          include: { product: true },
        },
      },
    });
  }

  static async createTransfer(data: {
    transferNumber?: string;
    sourceWarehouseId: string;
    sourceLocationId: string;
    destWarehouseId: string;
    destLocationId: string;
    notes?: string;
    items: { productId: string; quantity: number }[];
    userId?: string;
  }) {
    const count = await prisma.transfer.count();
    const transferNumber = data.transferNumber || `TRF-${String(count + 1).padStart(3, '0')}`;

    return await prisma.transfer.create({
      data: {
        transferNumber,
        sourceWarehouseId: data.sourceWarehouseId,
        sourceLocationId: data.sourceLocationId,
        destWarehouseId: data.destWarehouseId,
        destLocationId: data.destLocationId,
        notes: data.notes,
        status: 'READY',
        createdBy: data.userId || null,
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
        destWarehouse: true,
        destLocation: true,
      },
    });
  }

  static async completeTransfer(id: string, userId?: string) {
    return await prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findUnique({
        where: { id },
        include: {
          items: { include: { product: true } },
          sourceWarehouse: true,
          sourceLocation: true,
          destWarehouse: true,
          destLocation: true,
        },
      });

      if (!transfer) {
        throw new Error('Transfer not found');
      }

      if (transfer.status === 'DONE') {
        throw new Error('Transfer has already been completed');
      }

      if (
        transfer.sourceWarehouseId === transfer.destWarehouseId &&
        transfer.sourceLocationId === transfer.destLocationId
      ) {
        throw new Error('Source and destination locations cannot be identical.');
      }

      const sourceName = `${transfer.sourceWarehouse.name} / ${transfer.sourceLocation.name}`;
      const destName = `${transfer.destWarehouse.name} / ${transfer.destLocation.name}`;

      for (const item of transfer.items) {
        // Validate source stock sufficiency
        const sourceBalance = await StockService.getOrCreateBalance(
          item.productId,
          transfer.sourceWarehouseId,
          transfer.sourceLocationId,
          tx
        );

        if (sourceBalance.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for '${item.product.name}' at source ${sourceName}. Available: ${sourceBalance.quantity} ${item.product.uom}, Requested: ${item.quantity} ${item.product.uom}`
          );
        }

        // Decrement source location
        await StockService.adjustLocationStock(
          {
            productId: item.productId,
            warehouseId: transfer.sourceWarehouseId,
            locationId: transfer.sourceLocationId,
            quantityDelta: -item.quantity,
          },
          tx
        );

        // Increment destination location
        const { totalCompanyStock } = await StockService.adjustLocationStock(
          {
            productId: item.productId,
            warehouseId: transfer.destWarehouseId,
            locationId: transfer.destLocationId,
            quantityDelta: item.quantity,
          },
          tx
        );

        // Record single unified transfer movement in Stock Ledger
        await LedgerService.record(
          {
            productId: item.productId,
            sku: item.product.sku,
            operation: 'TRANSFER_OUT',
            referenceType: 'TRANSFER',
            referenceId: transfer.transferNumber,
            sourceName,
            destName,
            quantityChange: -item.quantity,
            balanceAfter: totalCompanyStock,
            userId,
            notes: `Transfer from ${sourceName} to ${destName}`,
          },
          tx
        );

        await LedgerService.record(
          {
            productId: item.productId,
            sku: item.product.sku,
            operation: 'TRANSFER_IN',
            referenceType: 'TRANSFER',
            referenceId: transfer.transferNumber,
            sourceName,
            destName,
            quantityChange: item.quantity,
            balanceAfter: totalCompanyStock,
            userId,
            notes: `Transfer receipt from ${sourceName}`,
          },
          tx
        );

        // Check product rules
        await ExceptionEngine.evaluateProductRules(item.productId, tx);
      }

      const updated = await tx.transfer.update({
        where: { id },
        data: {
          status: 'DONE',
          completedDate: new Date(),
          completedBy: userId || null,
        },
        include: {
          items: { include: { product: true } },
          sourceWarehouse: true,
          sourceLocation: true,
          destWarehouse: true,
          destLocation: true,
        },
      });

      // Audit log entry (D17)
      const { AuditService } = await import('./audit.service');
      await AuditService.log(
        {
          userId,
          action: 'TRANSFER_COMPLETE',
          entity: 'Transfer',
          entityId: transfer.id,
          metadata: {
            transferNumber: transfer.transferNumber,
            sourceName,
            destName,
            itemsCount: transfer.items.length,
          },
        },
        tx
      );

      return updated;
    });
  }
}
