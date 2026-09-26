import { Request, Response } from 'express';
import { ReceiptService } from '../services/receipt.service';
import { DeliveryService } from '../services/delivery.service';
import { TransferService } from '../services/transfer.service';
import { AdjustmentService } from '../services/adjustment.service';
import { PhysicalCountService } from '../services/physical-count.service';
import { LedgerService } from '../services/ledger.service';
import prisma from '../prisma';

export class InventoryOpsController {
  // Receipts
  static async listReceipts(req: Request, res: Response) {
    try {
      const { status, search } = req.query;
      const receipts = await ReceiptService.listReceipts({
        status: status ? String(status) : undefined,
        search: search ? String(search) : undefined,
      });
      return res.json(receipts);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getReceipt(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const receipt = await ReceiptService.getReceipt(id);
      if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
      return res.json(receipt);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createReceipt(req: any, res: Response) {
    try {
      const { receiptNumber, supplier, destinationWarehouseId, destinationLocationId, notes, items } = req.body;
      if (!supplier || !destinationWarehouseId || !destinationLocationId || !items || items.length === 0) {
        return res.status(400).json({ error: 'Supplier, destination warehouse, location, and items are required.' });
      }

      const receipt = await ReceiptService.createReceipt({
        receiptNumber,
        supplier,
        destinationWarehouseId,
        destinationLocationId,
        notes,
        items,
      });
      return res.status(201).json(receipt);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async validateReceipt(req: any, res: Response) {
    try {
      const { id } = req.params;
      const receipt = await ReceiptService.validateReceipt(id, req.user?.id);
      return res.json(receipt);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Deliveries
  static async listDeliveries(req: Request, res: Response) {
    try {
      const { status, search } = req.query;
      const deliveries = await DeliveryService.listDeliveries({
        status: status ? String(status) : undefined,
        search: search ? String(search) : undefined,
      });
      return res.json(deliveries);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getDelivery(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const delivery = await DeliveryService.getDelivery(id);
      if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
      return res.json(delivery);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createDelivery(req: any, res: Response) {
    try {
      const { deliveryNumber, customer, sourceWarehouseId, sourceLocationId, notes, items } = req.body;
      if (!customer || !sourceWarehouseId || !sourceLocationId || !items || items.length === 0) {
        return res.status(400).json({ error: 'Customer, source warehouse, location, and items are required.' });
      }

      const delivery = await DeliveryService.createDelivery({
        deliveryNumber,
        customer,
        sourceWarehouseId,
        sourceLocationId,
        notes,
        items,
      });
      return res.status(201).json(delivery);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async validateDelivery(req: any, res: Response) {
    try {
      const { id } = req.params;
      const delivery = await DeliveryService.validateDelivery(id, req.user?.id);
      return res.json(delivery);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Transfers
  static async listTransfers(req: Request, res: Response) {
    try {
      const { status, search } = req.query;
      const transfers = await TransferService.listTransfers({
        status: status ? String(status) : undefined,
        search: search ? String(search) : undefined,
      });
      return res.json(transfers);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getTransfer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const transfer = await TransferService.getTransfer(id);
      if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
      return res.json(transfer);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createTransfer(req: any, res: Response) {
    try {
      const {
        transferNumber,
        sourceWarehouseId,
        sourceLocationId,
        destWarehouseId,
        destLocationId,
        notes,
        items,
      } = req.body;

      if (!sourceWarehouseId || !sourceLocationId || !destWarehouseId || !destLocationId || !items || items.length === 0) {
        return res.status(400).json({ error: 'Source and destination warehouses/locations, and items are required.' });
      }

      const transfer = await TransferService.createTransfer({
        transferNumber,
        sourceWarehouseId,
        sourceLocationId,
        destWarehouseId,
        destLocationId,
        notes,
        items,
        userId: req.user?.id,
      });
      return res.status(201).json(transfer);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async completeTransfer(req: any, res: Response) {
    try {
      const { id } = req.params;
      const transfer = await TransferService.completeTransfer(id, req.user?.id);
      return res.json(transfer);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Adjustments
  static async listAdjustments(req: Request, res: Response) {
    try {
      const { productId, warehouseId } = req.query;
      const adjustments = await AdjustmentService.listAdjustments({
        productId: productId ? String(productId) : undefined,
        warehouseId: warehouseId ? String(warehouseId) : undefined,
      });
      return res.json(adjustments);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createAdjustment(req: any, res: Response) {
    try {
      const { warehouseId, locationId, productId, quantityChange, reason } = req.body;
      if (!warehouseId || !locationId || !productId || quantityChange === undefined || !reason) {
        return res.status(400).json({ error: 'Warehouse, location, product, quantity change, and reason are required.' });
      }

      const adjustment = await AdjustmentService.createAdjustment({
        warehouseId,
        locationId,
        productId,
        quantityChange: Number(quantityChange),
        reason,
        userId: req.user?.id,
      });
      return res.status(201).json(adjustment);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Physical Counts
  static async listCounts(req: Request, res: Response) {
    try {
      const { productId, warehouseId } = req.query;
      const counts = await PhysicalCountService.listCounts({
        productId: productId ? String(productId) : undefined,
        warehouseId: warehouseId ? String(warehouseId) : undefined,
      });
      return res.json(counts);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async recordCount(req: any, res: Response) {
    try {
      const { countNumber, warehouseId, locationId, productId, physicalQuantity, notes } = req.body;
      if (!warehouseId || !locationId || !productId || physicalQuantity === undefined) {
        return res.status(400).json({ error: 'Warehouse, location, product, and physical quantity are required.' });
      }

      const count = await PhysicalCountService.recordCount({
        countNumber,
        warehouseId,
        locationId,
        productId,
        physicalQuantity: Number(physicalQuantity),
        notes,
        userId: req.user?.id,
      });
      return res.status(201).json(count);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Stock Ledger
  static async getLedger(req: Request, res: Response) {
    try {
      const {
        productId,
        operation,
        referenceType,
        referenceId,
        search,
        startDate,
        endDate,
        locationName,
        page,
        pageSize,
        limit,
        offset,
      } = req.query;

      const result = await LedgerService.getLedger({
        productId: productId ? String(productId) : undefined,
        operation: operation ? String(operation) : undefined,
        referenceType: referenceType ? String(referenceType) : undefined,
        referenceId: referenceId ? String(referenceId) : undefined,
        search: search ? String(search) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        locationName: locationName ? String(locationName) : undefined,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Stock overview
  static async getStockOverview(req: Request, res: Response) {
    try {
      const { warehouseId, locationId, search } = req.query;
      const where: any = {};
      if (warehouseId) where.warehouseId = String(warehouseId);
      if (locationId) where.locationId = String(locationId);

      const balances = await prisma.stockBalance.findMany({
        where,
        include: {
          product: { include: { category: true } },
          warehouse: true,
          location: true,
        },
        orderBy: [{ warehouse: { name: 'asc' } }, { location: { name: 'asc' } }],
      });

      let results = balances;
      if (search) {
        const query = String(search).toLowerCase();
        results = balances.filter(
          (b) =>
            b.product.name.toLowerCase().includes(query) ||
            b.product.sku.toLowerCase().includes(query) ||
            b.warehouse.name.toLowerCase().includes(query) ||
            b.location.name.toLowerCase().includes(query)
        );
      }

      return res.json(results);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
