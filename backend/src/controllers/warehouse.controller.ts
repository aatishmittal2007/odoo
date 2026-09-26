import { Request, Response } from 'express';
import prisma from '../prisma';

export class WarehouseController {
  static async listWarehouses(req: Request, res: Response) {
    try {
      const warehouses = await prisma.warehouse.findMany({
        include: {
          locations: true,
          stockBalances: {
            include: { product: true },
          },
          _count: {
            select: {
              locations: true,
              exceptions: {
                where: { status: { in: ['NEW', 'INVESTIGATING', 'ACTION_REQUIRED'] } },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      const enriched = warehouses.map((w) => {
        const totalItemsCount = w.stockBalances.length;
        const totalStockQuantity = w.stockBalances.reduce((sum, b) => sum + b.quantity, 0);
        return {
          id: w.id,
          code: w.code,
          name: w.name,
          address: w.address,
          isDefault: w.isDefault,
          locationsCount: w.locations.length,
          locations: w.locations,
          totalItemsCount,
          totalStockQuantity,
          openExceptionsCount: w._count.exceptions,
        };
      });

      return res.json(enriched);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getWarehouse(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const warehouse = await prisma.warehouse.findUnique({
        where: { id },
        include: {
          locations: {
            include: {
              stockBalances: {
                include: { product: true },
              },
            },
          },
          exceptions: {
            where: { status: { in: ['NEW', 'INVESTIGATING', 'ACTION_REQUIRED'] } },
            include: { product: true, location: true },
          },
        },
      });

      if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });
      return res.json(warehouse);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createWarehouse(req: Request, res: Response) {
    try {
      const { code, name, address, isDefault = false } = req.body;
      if (!code || !name) return res.status(400).json({ error: 'Code and Name are required.' });

      const existing = await prisma.warehouse.findUnique({ where: { code } });
      if (existing) return res.status(400).json({ error: 'Warehouse code already exists.' });

      const warehouse = await prisma.warehouse.create({
        data: { code, name, address, isDefault },
      });
      return res.status(201).json(warehouse);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async listLocations(req: Request, res: Response) {
    try {
      const { warehouseId } = req.query;
      const where: any = {};
      if (warehouseId) where.warehouseId = String(warehouseId);

      const locations = await prisma.location.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          stockBalances: {
            include: { product: { select: { id: true, name: true, sku: true, uom: true } } },
          },
        },
        orderBy: [{ warehouse: { name: 'asc' } }, { name: 'asc' }],
      });
      return res.json(locations);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createLocation(req: Request, res: Response) {
    try {
      const { warehouseId, code, name, aisle, rack, shelf, bin, isVirtual = false } = req.body;
      if (!warehouseId || !code || !name) {
        return res.status(400).json({ error: 'WarehouseId, Code, and Name are required.' });
      }

      const location = await prisma.location.create({
        data: {
          warehouseId,
          code,
          name,
          aisle,
          rack,
          shelf,
          bin,
          isVirtual,
        },
      });
      return res.status(201).json(location);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateWarehouse(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, address, isActive, isDefault } = req.body;

      const updated = await prisma.warehouse.update({
        where: { id },
        data: {
          name: name !== undefined ? name : undefined,
          address: address !== undefined ? address : undefined,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined,
          isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined,
        },
      });
      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateLocation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, code, aisle, rack, shelf, bin, type } = req.body;

      const updated = await prisma.location.update({
        where: { id },
        data: {
          name: name !== undefined ? name : undefined,
          code: code !== undefined ? code : undefined,
          aisle: aisle !== undefined ? aisle : undefined,
          rack: rack !== undefined ? rack : undefined,
          shelf: shelf !== undefined ? shelf : undefined,
          bin: bin !== undefined ? bin : undefined,
          type: type !== undefined ? type : undefined,
        },
      });
      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
