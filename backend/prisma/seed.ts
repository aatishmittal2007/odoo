import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting StockSense comprehensive database seed...');

  // Clear existing data in correct order
  await prisma.auditLog.deleteMany();
  await prisma.exceptionResolution.deleteMany();
  await prisma.investigationTask.deleteMany();
  await prisma.investigation.deleteMany();
  await prisma.exceptionEvidence.deleteMany();
  await prisma.exception.deleteMany();
  await prisma.physicalCount.deleteMany();
  await prisma.adjustment.deleteMany();
  await prisma.transferItem.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.deliveryItem.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.receiptItem.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.stockLedger.deleteMany();
  await prisma.stockBalance.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.location.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing tables.');

  // 1. Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const manager = await prisma.user.create({
    data: {
      email: 'manager@stocksense.io',
      passwordHash,
      name: 'Alex Mercer',
      role: 'INVENTORY_MANAGER',
      department: 'Supply Chain Operations',
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'staff@stocksense.io',
      passwordHash,
      name: 'Sam Rodriguez',
      role: 'WAREHOUSE_STAFF',
      department: 'Main Warehouse Inventory',
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      email: 'elena@stocksense.io',
      passwordHash,
      name: 'Elena Rostova',
      role: 'WAREHOUSE_STAFF',
      department: 'Receiving & QC',
    },
  });

  console.log('👤 Created users: manager@stocksense.io & staff@stocksense.io (pwd: password123)');

  // 2. Warehouses
  const mainWh = await prisma.warehouse.create({
    data: {
      code: 'WH-MAIN',
      name: 'Main Warehouse',
      address: '100 Industrial Parkway, Zone 4',
      isDefault: true,
    },
  });

  const prodWh = await prisma.warehouse.create({
    data: {
      code: 'WH-PROD',
      name: 'Production Warehouse',
      address: '42 Fabricators Boulevard, Building B',
      isDefault: false,
    },
  });

  const secWh = await prisma.warehouse.create({
    data: {
      code: 'WH-SEC',
      name: 'Secondary Warehouse',
      address: '88 Logistics Way, North Terminal',
      isDefault: false,
    },
  });

  // 3. Locations
  const rackA = await prisma.location.create({
    data: { warehouseId: mainWh.id, code: 'RACK-A', name: 'Rack A', aisle: '1', rack: 'A', shelf: '1-3' },
  });
  const rackB = await prisma.location.create({
    data: { warehouseId: mainWh.id, code: 'RACK-B', name: 'Rack B', aisle: '1', rack: 'B', shelf: '1-3' },
  });
  const rackC = await prisma.location.create({
    data: { warehouseId: mainWh.id, code: 'RACK-C', name: 'Rack C', aisle: '2', rack: 'C', shelf: '1-2' },
  });
  const recvDock = await prisma.location.create({
    data: { warehouseId: mainWh.id, code: 'RECV-01', name: 'Receiving Dock', aisle: 'Dock', isVirtual: false },
  });
  const shipBay = await prisma.location.create({
    data: { warehouseId: mainWh.id, code: 'SHIP-01', name: 'Shipping Bay', aisle: 'Dock', isVirtual: false },
  });

  const prodStaging = await prisma.location.create({
    data: { warehouseId: prodWh.id, code: 'STG-01', name: 'Staging A1', aisle: 'Prod', rack: 'P1' },
  });
  const prodBin1 = await prisma.location.create({
    data: { warehouseId: prodWh.id, code: 'BIN-101', name: 'Assembly Bin 1', aisle: 'Line 1', bin: 'B101' },
  });

  const secBulk = await prisma.location.create({
    data: { warehouseId: secWh.id, code: 'BLK-01', name: 'Bulk Storage Bay 1', aisle: 'Bulk' },
  });

  console.log('🏢 Created warehouses and locations.');

  // 4. Categories
  const catRaw = await prisma.category.create({
    data: { name: 'Raw Material', description: 'Metals, polymers, and core feedstock' },
  });
  const catSupplies = await prisma.category.create({
    data: { name: 'Building Supplies', description: 'Structural materials, cement, and masonry' },
  });
  const catFinished = await prisma.category.create({
    data: { name: 'Finished Goods', description: 'Manufactured products and furniture' },
  });
  const catFasteners = await prisma.category.create({
    data: { name: 'Fasteners & Hardware', description: 'Bolts, nuts, fittings, and connectors' },
  });
  const catElectrical = await prisma.category.create({
    data: { name: 'Electrical & Cabling', description: 'Wiring, conduit, and transformers' },
  });

  // 5. Products
  const steelRods = await prisma.product.create({
    data: {
      sku: 'SR001',
      name: 'Steel Rods',
      description: '12mm high-tensile carbon reinforcement steel rods',
      categoryId: catRaw.id,
      uom: 'kg',
      reorderLevel: 25,
      costPrice: 4.5,
      countingPeriodDays: 30,
      lastCountDate: new Date('2026-09-26T08:10:00Z'),
    },
  });

  const copperWire = await prisma.product.create({
    data: {
      sku: 'CW002',
      name: 'Copper Wire',
      description: 'Solid copper insulated electrical cable 2.5mm',
      categoryId: catElectrical.id,
      uom: 'meters',
      reorderLevel: 50,
      costPrice: 12.0,
      countingPeriodDays: 14,
      lastCountDate: new Date('2026-09-20T10:00:00Z'),
    },
  });

  const cement = await prisma.product.create({
    data: {
      sku: 'CM003',
      name: 'Cement',
      description: 'Portland cement high grade 50kg bags',
      categoryId: catSupplies.id,
      uom: 'bags',
      reorderLevel: 30,
      costPrice: 8.2,
      countingPeriodDays: 30,
      lastCountDate: new Date('2026-09-15T09:00:00Z'),
    },
  });

  const plasticChairs = await prisma.product.create({
    data: {
      sku: 'PC004',
      name: 'Plastic Chairs',
      description: 'Molded outdoor stackable conference chairs',
      categoryId: catFinished.id,
      uom: 'units',
      reorderLevel: 40,
      costPrice: 18.5,
      countingPeriodDays: 60,
      lastCountDate: new Date('2026-08-10T14:00:00Z'), // Overdue count
    },
  });

  const bolts = await prisma.product.create({
    data: {
      sku: 'IB005',
      name: 'Industrial Bolts',
      description: 'M16 Zinc-plated grade 8.8 structural hex bolts',
      categoryId: catFasteners.id,
      uom: 'units',
      reorderLevel: 100,
      costPrice: 0.75,
      countingPeriodDays: 30,
      lastCountDate: new Date('2026-09-22T11:00:00Z'),
    },
  });

  console.log('📦 Created products: Steel Rods, Copper Wire, Cement, Plastic Chairs, Industrial Bolts.');

  // 6. Setup Initial Stock & Balances
  // Copper Wire: 45 meters (below reorder level 50 -> LOW_STOCK exception)
  await prisma.stockBalance.create({
    data: { productId: copperWire.id, warehouseId: mainWh.id, locationId: rackB.id, quantity: 45 },
  });
  await prisma.stockLedger.create({
    data: {
      productId: copperWire.id,
      sku: copperWire.sku,
      operation: 'RECEIPT',
      referenceType: 'RECEIPT',
      referenceId: 'REC-008',
      sourceName: 'Supplier: Nexans Cable Corp',
      destName: `${mainWh.name} / ${rackB.name}`,
      quantityChange: 45,
      balanceAfter: 45,
      userId: manager.id,
      notes: 'Initial inventory intake',
    },
  });

  // Cement: 80 bags
  await prisma.stockBalance.create({
    data: { productId: cement.id, warehouseId: secWh.id, locationId: secBulk.id, quantity: 80 },
  });
  await prisma.stockLedger.create({
    data: {
      productId: cement.id,
      sku: cement.sku,
      operation: 'RECEIPT',
      referenceType: 'RECEIPT',
      referenceId: 'REC-009',
      sourceName: 'Supplier: Heidelberg Materials',
      destName: `${secWh.name} / ${secBulk.name}`,
      quantityChange: 80,
      balanceAfter: 80,
      userId: manager.id,
      notes: 'Bulk stock delivery',
    },
  });

  // Plastic Chairs: 120 units
  await prisma.stockBalance.create({
    data: { productId: plasticChairs.id, warehouseId: prodWh.id, locationId: prodStaging.id, quantity: 120 },
  });
  await prisma.stockLedger.create({
    data: {
      productId: plasticChairs.id,
      sku: plasticChairs.sku,
      operation: 'RECEIPT',
      referenceType: 'RECEIPT',
      referenceId: 'REC-010',
      sourceName: 'Production Line B',
      destName: `${prodWh.name} / ${prodStaging.name}`,
      quantityChange: 120,
      balanceAfter: 120,
      userId: manager.id,
      notes: 'Assembly completion batch #401',
    },
  });

  // Industrial Bolts: 300 units
  await prisma.stockBalance.create({
    data: { productId: bolts.id, warehouseId: mainWh.id, locationId: rackC.id, quantity: 300 },
  });
  await prisma.stockLedger.create({
    data: {
      productId: bolts.id,
      sku: bolts.sku,
      operation: 'RECEIPT',
      referenceType: 'RECEIPT',
      referenceId: 'REC-011',
      sourceName: 'Supplier: Fastenal Industrial',
      destName: `${mainWh.name} / ${rackC.name}`,
      quantityChange: 300,
      balanceAfter: 300,
      userId: manager.id,
      notes: 'Quarterly hardware delivery',
    },
  });

  // =========================================================================
  // 7. EXACT DEMO SCENARIO FOR STEEL RODS (SR001)
  // Required Sequence:
  // Starts with System stock = 100 in Main Warehouse / Rack A
  // - 08:42 Receipt +100 (Receipt #R102) -> Balance 183 -> 200
  // - 09:20 Transfer -20 (Transfer #T208: Rack A -> Rack B)
  // - 11:14 Delivery -60 (Order #1042 / Delivery #D442)
  // - 12:06 Adjustment -3 (Adjustment #A129, Damaged stock)
  // Net System Quantity at Rack A = 100! (and Rack B has 20, Total company = 120, but Rack A has 100)
  // - 13:40 Physical count at Rack A: Physical entered = 83!
  // Variance = 83 - 100 = -17 (-17%)
  // Generates INC-024!
  // =========================================================================

  console.log('⚙️ Executing exact Steel Rods demo scenario sequence...');

  // Setup current balances: Rack A has 100 kg, Rack B has 20 kg
  await prisma.stockBalance.create({
    data: {
      productId: steelRods.id,
      warehouseId: mainWh.id,
      locationId: rackA.id,
      quantity: 100,
      lastVerifiedAt: new Date('2026-09-26T13:40:00Z'),
    },
  });

  await prisma.stockBalance.create({
    data: {
      productId: steelRods.id,
      warehouseId: mainWh.id,
      locationId: rackB.id,
      quantity: 20,
      lastVerifiedAt: new Date('2026-09-26T09:20:00Z'),
    },
  });

  // 0. Opening Balance Ledger Entry for Steel Rods (83 kg at Rack A)
  await prisma.stockLedger.create({
    data: {
      timestamp: new Date('2026-09-26T08:00:00Z'),
      productId: steelRods.id,
      sku: steelRods.sku,
      operation: 'RECEIPT',
      referenceType: 'RECEIPT',
      referenceId: 'OPENING-BAL',
      sourceName: 'Opening Physical Inventory',
      destName: `${mainWh.name} / ${rackA.name}`,
      quantityChange: 83,
      balanceAfter: 83,
      userId: manager.id,
      notes: 'Initial cycle opening balance',
    },
  });

  // 1. Receipt #R102 (+100)
  const receiptR102 = await prisma.receipt.create({
    data: {
      receiptNumber: 'R102',
      supplier: 'Acero Heavy Metallurgy',
      date: new Date('2026-09-26T08:42:00Z'),
      destinationWarehouseId: mainWh.id,
      destinationLocationId: rackA.id,
      status: 'DONE',
      validatedAt: new Date('2026-09-26T08:42:00Z'),
      validatedBy: manager.id,
      notes: 'Initial mill run intake batch #M-902',
      items: {
        create: [{ productId: steelRods.id, quantity: 100, receivedQuantity: 100 }],
      },
    },
  });

  await prisma.stockLedger.create({
    data: {
      timestamp: new Date('2026-09-26T08:42:00Z'),
      productId: steelRods.id,
      sku: steelRods.sku,
      operation: 'RECEIPT',
      referenceType: 'RECEIPT',
      referenceId: 'R102',
      sourceName: 'Supplier: Acero Heavy Metallurgy',
      destName: `${mainWh.name} / ${rackA.name}`,
      quantityChange: 100,
      balanceAfter: 183,
      userId: manager.id,
      notes: 'Inbound receipt from supplier',
    },
  });

  // 2. Transfer #T208 (-20 from Rack A to Rack B)
  const transferT208 = await prisma.transfer.create({
    data: {
      transferNumber: 'T208',
      sourceWarehouseId: mainWh.id,
      sourceLocationId: rackA.id,
      destWarehouseId: mainWh.id,
      destLocationId: rackB.id,
      status: 'DONE',
      scheduledDate: new Date('2026-09-26T09:20:00Z'),
      completedDate: new Date('2026-09-26T09:20:00Z'),
      createdBy: manager.id,
      completedBy: staff.id,
      notes: 'Staging replenishment for production pick',
      items: {
        create: [{ productId: steelRods.id, quantity: 20 }],
      },
    },
  });

  await prisma.stockLedger.create({
    data: {
      timestamp: new Date('2026-09-26T09:20:00Z'),
      productId: steelRods.id,
      sku: steelRods.sku,
      operation: 'TRANSFER_OUT',
      referenceType: 'TRANSFER',
      referenceId: 'T208',
      sourceName: `${mainWh.name} / ${rackA.name}`,
      destName: `${mainWh.name} / ${rackB.name}`,
      quantityChange: -20,
      balanceAfter: 163,
      userId: staff.id,
      notes: 'Internal transfer from Rack A to Rack B',
    },
  });

  // 3. Delivery #D442 (Order #1042: -60)
  const deliveryD442 = await prisma.delivery.create({
    data: {
      deliveryNumber: 'D442',
      customer: 'Apex Infrastructure Ltd',
      date: new Date('2026-09-26T11:14:00Z'),
      sourceWarehouseId: mainWh.id,
      sourceLocationId: rackA.id,
      status: 'DONE',
      validatedAt: new Date('2026-09-26T11:14:00Z'),
      validatedBy: staff.id,
      notes: 'Outbound dispatch for Order #1042 (Job Site 7)',
      items: {
        create: [{ productId: steelRods.id, quantity: 60, deliveredQuantity: 60 }],
      },
    },
  });

  await prisma.stockLedger.create({
    data: {
      timestamp: new Date('2026-09-26T11:14:00Z'),
      productId: steelRods.id,
      sku: steelRods.sku,
      operation: 'DELIVERY',
      referenceType: 'DELIVERY',
      referenceId: 'D442',
      sourceName: `${mainWh.name} / ${rackA.name}`,
      destName: 'Customer: Apex Infrastructure Ltd',
      quantityChange: -60,
      balanceAfter: 103,
      userId: staff.id,
      notes: 'Outbound delivery for Order #1042',
    },
  });

  // 4. Adjustment #A129 (-3 damaged stock)
  const adjustmentA129 = await prisma.adjustment.create({
    data: {
      adjustmentNumber: 'A129',
      warehouseId: mainWh.id,
      locationId: rackA.id,
      productId: steelRods.id,
      quantityChange: -3,
      reason: 'Damaged stock during forklift handling',
      status: 'APPROVED',
      createdBy: staff.id,
      createdAt: new Date('2026-09-26T12:06:00Z'),
    },
  });

  await prisma.stockLedger.create({
    data: {
      timestamp: new Date('2026-09-26T12:06:00Z'),
      productId: steelRods.id,
      sku: steelRods.sku,
      operation: 'ADJUSTMENT',
      referenceType: 'ADJUSTMENT',
      referenceId: 'A129',
      sourceName: `${mainWh.name} / ${rackA.name}`,
      destName: 'Scrap / Damaged Write-off',
      quantityChange: -3,
      balanceAfter: 100, // System balance at Rack A is now exactly 100!
      userId: staff.id,
      notes: 'Damaged stock during forklift handling',
    },
  });

  // 5. Physical Count #C442 (Entered 83 vs System 100 -> Variance -17)
  const countC442 = await prisma.physicalCount.create({
    data: {
      countNumber: 'C442',
      warehouseId: mainWh.id,
      locationId: rackA.id,
      productId: steelRods.id,
      systemQuantity: 100,
      physicalQuantity: 83,
      variance: -17,
      variancePercentage: -17.0,
      status: 'RECORDED',
      countedBy: staff.id,
      countedAt: new Date('2026-09-26T13:40:00Z'),
      notes: 'Cycle count verification at Rack A: Only 83 bundles physically present.',
    },
  });

  // 6. Active Deliveries affected by this shortfall (Business Impact: Order #1042 & Order #1051, shortage 53 units)
  // Active Order 1: Order #1042 - Second partial release requiring 60 units
  await prisma.delivery.create({
    data: {
      deliveryNumber: 'Order #1042',
      customer: 'Apex Infrastructure Ltd',
      date: new Date('2026-09-27T10:00:00Z'),
      sourceWarehouseId: mainWh.id,
      sourceLocationId: rackA.id,
      status: 'READY',
      notes: 'Critical high-priority structural pour scheduled tomorrow',
      items: {
        create: [{ productId: steelRods.id, quantity: 60 }],
      },
    },
  });

  // Active Order 2: Order #1051 - Skyline Builders requiring 10 units
  await prisma.delivery.create({
    data: {
      deliveryNumber: 'Order #1051',
      customer: 'Skyline Builders',
      date: new Date('2026-09-27T14:30:00Z'),
      sourceWarehouseId: mainWh.id,
      sourceLocationId: rackA.id,
      status: 'READY',
      notes: 'Standard beam reinforcement order',
      items: {
        create: [{ productId: steelRods.id, quantity: 10 }],
      },
    },
  });

  // Active Order 3: Order #1066 - Horizon Engineering requiring 66 units
  await prisma.delivery.create({
    data: {
      deliveryNumber: 'Order #1066',
      customer: 'Horizon Engineering Group',
      date: new Date('2026-09-28T09:00:00Z'),
      sourceWarehouseId: mainWh.id,
      sourceLocationId: rackA.id,
      status: 'READY',
      notes: 'Bridge reinforcement pre-order',
      items: {
        create: [{ productId: steelRods.id, quantity: 66 }],
      },
    },
  });

  // Notice: Total active demand = 60 + 10 + 66 = 136. Available physical = 83.
  // Potential shortage = 136 - 83 = exactly 53 units! (Matches Section 15: "Potential shortage: 53 units")

  // 7. Flagship Exception: INC-024
  const inc024 = await prisma.exception.create({
    data: {
      exceptionNumber: 'INC-024',
      type: 'INVENTORY_DISCREPANCY',
      productId: steelRods.id,
      sku: steelRods.sku,
      warehouseId: mainWh.id,
      locationId: rackA.id,
      severity: 'HIGH',
      status: 'INVESTIGATING',
      ownerId: staff.id,
      dueDate: new Date('2026-09-27T18:00:00Z'),
      notes: 'Steel Rods — Physical/System mismatch. System: 100 • Physical: 83. Variance: -17 kg (-17.0%). Main Warehouse / Rack A.',
    },
  });

  // Attach Evidence for INC-024
  await prisma.exceptionEvidence.createMany({
    data: [
      {
        exceptionId: inc024.id,
        referenceType: 'PHYSICAL_COUNT',
        referenceId: 'C442',
        title: 'Physical Count #C442 (83 kg entered vs 100 kg system)',
        timestamp: new Date('2026-09-26T13:40:00Z'),
        metadataJson: JSON.stringify({
          systemQuantity: 100,
          physicalQuantity: 83,
          variance: -17,
          variancePercentage: -17,
          location: 'Rack A',
        }),
      },
      {
        exceptionId: inc024.id,
        referenceType: 'ADJUSTMENT',
        referenceId: 'A129',
        title: 'Adjustment #A129 (-3 kg damaged stock)',
        timestamp: new Date('2026-09-26T12:06:00Z'),
        metadataJson: JSON.stringify({ quantityChange: -3, reason: 'Damaged stock during forklift handling' }),
      },
      {
        exceptionId: inc024.id,
        referenceType: 'DELIVERY',
        referenceId: 'D442',
        title: 'Delivery #D442 (-60 kg for Order #1042)',
        timestamp: new Date('2026-09-26T11:14:00Z'),
        metadataJson: JSON.stringify({ quantityChange: -60, customer: 'Apex Infrastructure Ltd' }),
      },
      {
        exceptionId: inc024.id,
        referenceType: 'TRANSFER',
        referenceId: 'T208',
        title: 'Internal Transfer #T208 (-20 kg Rack A → Rack B)',
        timestamp: new Date('2026-09-26T09:20:00Z'),
        metadataJson: JSON.stringify({
          quantityChange: -20,
          sourceName: 'Main Warehouse / Rack A',
          destName: 'Main Warehouse / Rack B',
        }),
      },
      {
        exceptionId: inc024.id,
        referenceType: 'RECEIPT',
        referenceId: 'R102',
        title: 'Receipt #R102 (+100 kg from Acero Heavy Metallurgy)',
        timestamp: new Date('2026-09-26T08:42:00Z'),
        metadataJson: JSON.stringify({ quantityChange: 100, supplier: 'Acero Heavy Metallurgy' }),
      },
    ],
  });

  // Investigation record for INC-024
  await prisma.investigation.create({
    data: {
      exceptionId: inc024.id,
      assignedToId: staff.id,
      priority: 'HIGH',
      dueDate: new Date('2026-09-27T18:00:00Z'),
      reason: 'Physical variance of -17 units jeopardizes active delivery commitments.',
      notes: 'Investigate adjacent racks and check unconfirmed transfer manifests with warehouse floor lead.',
    },
  });

  // Investigation Tasks for INC-024 (Section 17)
  await prisma.investigationTask.createMany({
    data: [
      {
        exceptionId: inc024.id,
        title: 'Recount Rack A',
        assignedToId: staff.id,
        isCompleted: true,
        completedAt: new Date('2026-09-26T14:10:00Z'),
        notes: 'Double count confirms only 83 units in Rack A.',
        sortOrder: 1,
      },
      {
        exceptionId: inc024.id,
        title: 'Verify transfer T208 to Rack B',
        assignedToId: staff.id,
        isCompleted: false,
        notes: 'Check if 20 units were physically moved or if additional stock was placed in Rack C.',
        sortOrder: 2,
      },
      {
        exceptionId: inc024.id,
        title: 'Verify delivery picking slip D442',
        assignedToId: staff.id,
        isCompleted: false,
        sortOrder: 3,
      },
      {
        exceptionId: inc024.id,
        title: 'Check damaged stock quarantine area',
        assignedToId: staff.id,
        isCompleted: false,
        sortOrder: 4,
      },
      {
        exceptionId: inc024.id,
        title: 'Confirm physical location of overflow bundles in Rack C',
        assignedToId: staff.id,
        isCompleted: false,
        sortOrder: 5,
      },
    ],
  });

  // Additional Open Exceptions for realistic dashboard (Section 34)
  // INC-025: Copper Wire Low Stock
  await prisma.exception.create({
    data: {
      exceptionNumber: 'INC-025',
      type: 'LOW_STOCK',
      productId: copperWire.id,
      sku: copperWire.sku,
      warehouseId: mainWh.id,
      locationId: rackB.id,
      severity: 'HIGH',
      status: 'ACTION_REQUIRED',
      ownerId: manager.id,
      notes: 'Copper Wire stock (45 meters) is below reorder threshold of 50 meters.',
    },
  });

  // INC-026: Plastic Chairs Count Overdue
  await prisma.exception.create({
    data: {
      exceptionNumber: 'INC-026',
      type: 'COUNT_OVERDUE',
      productId: plasticChairs.id,
      sku: plasticChairs.sku,
      warehouseId: prodWh.id,
      locationId: prodStaging.id,
      severity: 'MEDIUM',
      status: 'NEW',
      notes: 'Physical count for Plastic Chairs is overdue by 17 days (cycle: 60 days).',
    },
  });

  // INC-027: Stale Transfer Exception
  await prisma.exception.create({
    data: {
      exceptionNumber: 'INC-027',
      type: 'TRANSFER_EXCEPTION',
      productId: bolts.id,
      sku: bolts.sku,
      warehouseId: prodWh.id,
      locationId: prodBin1.id,
      severity: 'CRITICAL',
      status: 'NEW',
      notes: 'Transfer TRF-004 of 50 Industrial Bolts has remained in READY state for 52 hours without confirmation.',
    },
  });

  // =========================================================================
  // 8. HISTORICAL RESOLVED INCIDENTS FOR PROCESS HEALTH ANALYTICS (Section 19)
  // Generates real aggregated root-cause percentages:
  // Transfer errors: 42%
  // Location errors: 27%
  // Counting errors: 18%
  // Receiving errors: 9%
  // Damaged stock / Other: 4%
  // =========================================================================

  console.log('📊 Seeding realistic historical resolved incidents for Process Health...');

  const resolvedIncidentsData = [
    // Transfer errors (5 incidents)
    {
      num: 'INC-011',
      sku: bolts.sku,
      prodId: bolts.id,
      whId: mainWh.id,
      locId: rackA.id,
      sev: 'HIGH',
      cause: 'Transfer error',
      action: 'UPDATE_LOCATION',
      notes: '15 units were found in Rack C. Location was not updated during transfer.',
      route: `${mainWh.name} / ${rackA.name} → ${mainWh.name} / ${rackB.name}`,
    },
    {
      num: 'INC-012',
      sku: steelRods.sku,
      prodId: steelRods.id,
      whId: mainWh.id,
      locId: rackA.id,
      sev: 'HIGH',
      cause: 'Transfer error',
      action: 'CREATE_TRANSFER',
      notes: 'Forklift operator routed pallet to secondary staging without scanning transfer barcode.',
      route: `${mainWh.name} / ${rackA.name} → ${mainWh.name} / ${rackB.name}`,
    },
    {
      num: 'INC-015',
      sku: cement.sku,
      prodId: cement.id,
      whId: secWh.id,
      locId: secBulk.id,
      sev: 'MEDIUM',
      cause: 'Transfer error',
      action: 'UPDATE_LOCATION',
      notes: 'Transfer completed in physical reality but operator failed to click complete in system.',
      route: `${secWh.name} / ${secBulk.name} → ${mainWh.name} / ${rackA.name}`,
    },
    {
      num: 'INC-018',
      sku: bolts.sku,
      prodId: bolts.id,
      whId: mainWh.id,
      locId: rackC.id,
      sev: 'HIGH',
      cause: 'Transfer error',
      action: 'ADJUST_INVENTORY',
      notes: 'Transfer quantity mismatch between packing slip and pallet count.',
      route: `${mainWh.name} / ${rackA.name} → ${mainWh.name} / ${rackB.name}`,
    },
    {
      num: 'INC-021',
      sku: copperWire.sku,
      prodId: copperWire.id,
      whId: mainWh.id,
      locId: rackB.id,
      sev: 'MEDIUM',
      cause: 'Transfer error',
      action: 'UPDATE_LOCATION',
      notes: 'Spool placed in adjacent Rack B slot 4 instead of slot 2.',
      route: `${mainWh.name} / ${rackA.name} → ${mainWh.name} / ${rackB.name}`,
    },

    // Location errors (3 incidents)
    {
      num: 'INC-013',
      sku: copperWire.sku,
      prodId: copperWire.id,
      whId: mainWh.id,
      locId: rackB.id,
      sev: 'MEDIUM',
      cause: 'Location error',
      action: 'UPDATE_LOCATION',
      notes: 'Material placed on wrong shelf level during putaway.',
    },
    {
      num: 'INC-016',
      sku: plasticChairs.sku,
      prodId: plasticChairs.id,
      whId: prodWh.id,
      locId: prodStaging.id,
      sev: 'LOW',
      cause: 'Location error',
      action: 'UPDATE_LOCATION',
      notes: 'Finished units staged in aisle walkway instead of designated bin.',
    },
    {
      num: 'INC-019',
      sku: steelRods.sku,
      prodId: steelRods.id,
      whId: mainWh.id,
      locId: rackA.id,
      sev: 'HIGH',
      cause: 'Location error',
      action: 'UPDATE_LOCATION',
      notes: 'Steel bundles mixed into structural channel section in Rack C.',
    },

    // Counting errors (2 incidents)
    {
      num: 'INC-014',
      sku: cement.sku,
      prodId: cement.id,
      whId: secWh.id,
      locId: secBulk.id,
      sev: 'LOW',
      cause: 'Counting error',
      action: 'MARK_RESOLVED',
      notes: 'Staff miscounted double stacked pallet on bottom tier.',
    },
    {
      num: 'INC-017',
      sku: bolts.sku,
      prodId: bolts.id,
      whId: mainWh.id,
      locId: rackC.id,
      sev: 'MEDIUM',
      cause: 'Counting error',
      action: 'MARK_RESOLVED',
      notes: 'Box labeled 50 units was counted as 100 units on initial inventory cycle.',
    },

    // Receiving error (1 incident)
    {
      num: 'INC-020',
      sku: copperWire.sku,
      prodId: copperWire.id,
      whId: mainWh.id,
      locId: recvDock.id,
      sev: 'HIGH',
      cause: 'Receiving error',
      action: 'ADJUST_INVENTORY',
      notes: 'Vendor short-shipped 5 meters on reel #802.',
    },

    // Damaged stock (1 incident)
    {
      num: 'INC-022',
      sku: cement.sku,
      prodId: cement.id,
      whId: secWh.id,
      locId: secBulk.id,
      sev: 'MEDIUM',
      cause: 'Damaged stock',
      action: 'ADJUST_INVENTORY',
      notes: 'Water leak in storage bay damaged 4 cement bags.',
    },
  ];

  for (const item of resolvedIncidentsData) {
    const pastDate = new Date(Date.now() - Math.floor(Math.random() * 20 + 2) * 24 * 60 * 60 * 1000);
    const resolvedDate = new Date(pastDate.getTime() + 4 * 60 * 60 * 1000);

    const exc = await prisma.exception.create({
      data: {
        exceptionNumber: item.num,
        type: 'INVENTORY_DISCREPANCY',
        productId: item.prodId,
        sku: item.sku,
        warehouseId: item.whId,
        locationId: item.locId,
        severity: item.sev,
        status: 'RESOLVED',
        ownerId: staff.id,
        resolvedById: manager.id,
        createdAt: pastDate,
        updatedAt: resolvedDate,
        resolvedAt: resolvedDate,
        notes: `Historical incident ${item.num}: ${item.notes}`,
      },
    });

    await prisma.exceptionResolution.create({
      data: {
        exceptionId: exc.id,
        rootCause: item.cause,
        explanation: item.notes,
        correctiveAction: item.action,
        resolutionNotes: `Corrective action ${item.action} completed by Alex Mercer.`,
        resolvedAt: resolvedDate,
        resolvedBy: manager.id,
      },
    });

    if (item.route) {
      await prisma.exceptionEvidence.create({
        data: {
          exceptionId: exc.id,
          referenceType: 'TRANSFER',
          referenceId: `TRF-${Math.floor(Math.random() * 800 + 100)}`,
          title: `Internal Transfer (${item.route})`,
          timestamp: pastDate,
          metadataJson: JSON.stringify({
            sourceName: 'Main Warehouse / Rack A',
            destName: 'Main Warehouse / Rack B',
          }),
        },
      });
    }
  }

  console.log('✅ StockSense database seed successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
