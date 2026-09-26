import prisma from '../prisma';

export interface CreateLedgerEntryParams {
  productId: string;
  sku: string;
  operation: 'RECEIPT' | 'DELIVERY' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT' | 'COUNT_RECONCILE';
  referenceType: 'RECEIPT' | 'DELIVERY' | 'TRANSFER' | 'ADJUSTMENT' | 'PHYSICAL_COUNT';
  referenceId: string;
  sourceName?: string;
  destName?: string;
  quantityChange: number;
  balanceAfter: number;
  userId?: string;
  notes?: string;
}

export class LedgerService {
  static async record(params: CreateLedgerEntryParams, tx?: any) {
    const client = tx || prisma;
    return await client.stockLedger.create({
      data: {
        productId: params.productId,
        sku: params.sku,
        operation: params.operation,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        sourceName: params.sourceName || null,
        destName: params.destName || null,
        quantityChange: params.quantityChange,
        balanceAfter: params.balanceAfter,
        userId: params.userId || null,
        notes: params.notes || null,
      },
    });
  }

  static async getLedger(filters?: {
    productId?: string;
    operation?: string;
    referenceType?: string;
    referenceId?: string;
    search?: string;
    startDate?: string | Date;
    endDate?: string | Date;
    locationName?: string;
    page?: number;
    pageSize?: number;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.productId) {
      where.productId = filters.productId;
    }
    if (filters?.operation && filters.operation !== 'ALL') {
      where.operation = filters.operation;
    }
    if (filters?.referenceType && filters.referenceType !== 'ALL') {
      where.referenceType = filters.referenceType;
    }
    if (filters?.referenceId) {
      where.referenceId = { contains: filters.referenceId };
    }
    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = new Date(filters.startDate);
      if (filters.endDate) where.timestamp.lte = new Date(filters.endDate);
    }
    if (filters?.locationName) {
      where.OR = [
        { sourceName: { contains: filters.locationName } },
        { destName: { contains: filters.locationName } },
      ];
    }
    if (filters?.search) {
      where.OR = [
        { sku: { contains: filters.search } },
        { referenceId: { contains: filters.search } },
        { sourceName: { contains: filters.search } },
        { destName: { contains: filters.search } },
        { notes: { contains: filters.search } },
        { product: { name: { contains: filters.search } } },
      ];
    }

    const pageSize = filters?.pageSize || filters?.limit || 50;
    const page = filters?.page || (filters?.offset !== undefined ? Math.floor(filters.offset / pageSize) + 1 : 1);
    const skip = (page - 1) * pageSize;

    const [total, entries] = await Promise.all([
      prisma.stockLedger.count({ where }),
      prisma.stockLedger.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: pageSize,
        skip,
        include: {
          product: {
            select: { id: true, name: true, sku: true, uom: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    return { total, entries, page, pageSize, totalPages };
  }
}
