export type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE';
export type MovementStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type StockStatus = 'AGOTADO' | 'STOCK_BAJO' | 'STOCK_NORMAL' | 'SOBRESTOCK';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  price: number;
  cost: number;
  supplier: string | null;
  created_at: string;
}

export type InventoryItemInput = Omit<InventoryItem, 'id' | 'created_at'>;

export interface InventoryRecord {
  id: string;
  item_id: string;
  quantity: number;
  location: string | null;
  min_stock: number;
  max_stock: number;
  updated_at: string;
}

export type InventoryRecordInput = Omit<InventoryRecord, 'id' | 'updated_at'>;
export type InventoryRecordUpdate = Partial<Omit<InventoryRecord, 'id' | 'item_id' | 'updated_at'>>;

export interface InventoryMovement {
  id: string;
  item_id: string;
  inventory_id: string;
  movement_type: MovementType;
  quantity: number;
  reason: string | null;
  status: MovementStatus;
  created_at: string;
  approved_at: string | null;
  notes: string | null;
}

export type InventoryMovementInput = {
  item_id: string;
  inventory_id: string;
  movement_type: MovementType;
  quantity: number;
  reason: string;
  notes?: string;
};

/** Fila combinada usada en la tabla principal de inventario y en el dashboard */
export interface InventoryRow {
  item: InventoryItem;
  inventory: InventoryRecord | null;
  status: StockStatus;
}

/** Fila combinada usada en la tabla de movimientos (con datos del artículo) */
export interface MovementRow extends InventoryMovement {
  item_name: string;
  item_sku: string;
}

export interface DashboardKpis {
  totalItems: number;
  totalStock: number;
  lowStockCount: number;
  totalInventoryValue: number;
  recentMovements: MovementRow[];
}

export interface InventoryFilters {
  search: string;
  category: string | null;
  supplier: string | null;
  status: StockStatus | null;
}

export function computeStockStatus(
  quantity: number,
  minStock: number,
  maxStock: number
): StockStatus {
  if (quantity === 0) return 'AGOTADO';
  if (quantity <= minStock) return 'STOCK_BAJO';
  if (maxStock > 0 && quantity > maxStock) return 'SOBRESTOCK';
  return 'STOCK_NORMAL';
}