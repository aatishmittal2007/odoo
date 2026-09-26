export interface User {
  id: string;
  name: string;
  email: string;
  role: 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF';
  department?: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string;
  isDefault: boolean;
  isActive?: boolean;
  locationsCount?: number;
  totalItemsCount?: number;
  totalStockQuantity?: number;
  openExceptionsCount?: number;
  locations?: Location[];
}

export interface Location {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  type?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  warehouse?: { id: string; name: string; code: string };
  stockBalances?: StockBalance[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  _count?: { products: number };
}

export interface StockBalance {
  id: string;
  productId: string;
  warehouseId: string;
  locationId: string;
  quantity: number;
  reservedQuantity: number;
  lastVerifiedAt?: string;
  warehouse: { id: string; code: string; name: string };
  location: { id: string; code: string; name: string; rack?: string; shelf?: string; bin?: string };
  product?: { id: string; name: string; sku: string; uom: string; category?: { name: string } };
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  uom: string;
  reorderLevel: number;
  reorderQuantity?: number;
  costPrice: number;
  countingPeriodDays: number;
  lastCountDate?: string;
  totalStock: number;
  openExceptionsCount: number;
  hasCriticalException: boolean;
  isLowStock: boolean;
  isActive?: boolean;
  confidenceScore: number;
  confidenceRating: 'HIGH' | 'MODERATE' | 'LOW' | 'CRITICAL';
  category?: Category;
  stockBalances?: StockBalance[];
}

export interface StockLedgerEntry {
  id: string;
  timestamp: string;
  productId: string;
  sku: string;
  operation: 'RECEIPT' | 'DELIVERY' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT' | 'COUNT_RECONCILE';
  referenceType: string;
  referenceId: string;
  sourceName?: string;
  destName?: string;
  quantityChange: number;
  balanceAfter: number;
  userId?: string;
  notes?: string;
  product?: { id: string; name: string; sku: string; uom: string };
  user?: { id: string; name: string; email: string };
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  supplier: string;
  date: string;
  destinationWarehouseId: string;
  destinationLocationId: string;
  status: 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELLED';
  notes?: string;
  validatedAt?: string;
  destinationWarehouse: Warehouse;
  destinationLocation: Location;
  items: {
    id: string;
    productId: string;
    quantity: number;
    receivedQuantity: number;
    product: Product;
  }[];
}

export interface Delivery {
  id: string;
  deliveryNumber: string;
  customer: string;
  date: string;
  sourceWarehouseId: string;
  sourceLocationId: string;
  status: 'DRAFT' | 'READY' | 'DONE' | 'CANCELLED';
  notes?: string;
  validatedAt?: string;
  sourceWarehouse: Warehouse;
  sourceLocation: Location;
  items: {
    id: string;
    productId: string;
    quantity: number;
    deliveredQuantity: number;
    product: Product;
  }[];
}

export interface Transfer {
  id: string;
  transferNumber: string;
  sourceWarehouseId: string;
  sourceLocationId: string;
  destWarehouseId: string;
  destLocationId: string;
  status: 'DRAFT' | 'READY' | 'IN_TRANSIT' | 'DONE' | 'CANCELLED';
  scheduledDate: string;
  completedDate?: string;
  notes?: string;
  sourceWarehouse: Warehouse;
  sourceLocation: Location;
  destWarehouse: Warehouse;
  destLocation: Location;
  items: {
    id: string;
    productId: string;
    quantity: number;
    product: Product;
  }[];
}

export interface Adjustment {
  id: string;
  adjustmentNumber: string;
  warehouseId: string;
  locationId: string;
  productId: string;
  quantityChange: number;
  reason: string;
  status: string;
  createdAt: string;
  warehouse: Warehouse;
  location: Location;
  product: Product;
  user?: { id: string; name: string; email?: string };
}

export interface PhysicalCount {
  id: string;
  countNumber: string;
  warehouseId: string;
  locationId: string;
  productId: string;
  systemQuantity: number;
  physicalQuantity: number;
  variance: number;
  variancePercentage: number;
  status: string;
  countedAt: string;
  notes?: string;
  warehouse: Warehouse;
  location: Location;
  product: Product;
  user?: { id: string; name: string };
}

export interface ExceptionEvidence {
  id: string;
  exceptionId: string;
  referenceType: string;
  referenceId: string;
  title: string;
  timestamp: string;
  metadataJson?: string;
}

export interface InvestigationTask {
  id: string;
  exceptionId: string;
  title: string;
  description?: string;
  dueDate?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  assignedToId?: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  sortOrder: number;
  assignedTo?: { id: string; name: string };
}

export interface ExceptionResolution {
  id: string;
  exceptionId: string;
  rootCause: string;
  explanation?: string;
  correctiveAction?: string;
  resolutionNotes?: string;
  resolvedAt: string;
  resolvedBy?: string;
}

export interface ExceptionItem {
  id: string;
  exceptionNumber: string;
  type: string;
  productId: string;
  sku: string;
  warehouseId: string;
  locationId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'INVESTIGATING' | 'ACTION_REQUIRED' | 'RESOLVED' | 'CLOSED';
  ownerId?: string;
  dueDate?: string;
  resolvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  product: { id: string; name: string; sku: string; uom: string };
  warehouse: { id: string; name: string; code: string };
  location: { id: string; name: string; code: string; rack?: string; shelf?: string };
  owner?: { id: string; name: string; email: string };
  resolution?: ExceptionResolution;
  tasks?: InvestigationTask[];
}

export interface ConfidenceFactor {
  factor: string;
  type: 'POSITIVE' | 'WARNING' | 'CRITICAL';
  impactPoints: number;
  description: string;
}

export interface ConfidenceData {
  score: number;
  rating: 'HIGH' | 'MODERATE' | 'LOW' | 'CRITICAL';
  factors: ConfidenceFactor[];
  description: string;
}

export interface ControlTowerData {
  metrics: {
    totalProducts: number;
    totalStock: number;
    lowStockCount: number;
    openExceptions: number;
    criticalExceptions: number;
    pendingReceipts: number;
    pendingDeliveries: number;
    pendingTransfers: number;
  };
  confidence: ConfidenceData;
  needsAttention: ExceptionItem[];
  recentMovements: StockLedgerEntry[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadataJson?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}
