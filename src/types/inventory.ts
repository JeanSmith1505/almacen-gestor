import type { Database } from './types';

// ============================================================
// TIPOS DERIVADOS DE SUPABASE
// ============================================================

export type InventoryItem =
  Database['public']['Tables']['inventory_items']['Row'];

export type InventoryItemInsert =
  Database['public']['Tables']['inventory_items']['Insert'];

export type InventoryItemUpdate =
  Database['public']['Tables']['inventory_items']['Update'];

export type InventoryRecord =
  Database['public']['Tables']['inventory']['Row'];

export type InventoryRecordInsert =
  Database['public']['Tables']['inventory']['Insert'];

export type InventoryRecordUpdate =
  Database['public']['Tables']['inventory']['Update'];

export type InventoryMovement =
  Database['public']['Tables']['inventory_movements']['Row'];

export type InventoryMovementInsert =
  Database['public']['Tables']['inventory_movements']['Insert'];

export type InventoryMovementUpdate =
  Database['public']['Tables']['inventory_movements']['Update'];


// ============================================================
// TIPOS DE DOMINIO
// ============================================================

export type MovementType =
  'ENTRADA' | 'SALIDA' | 'AJUSTE';

export type MovementStatus =
  'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export type StockStatus =
  'AGOTADO' |
  'STOCK_BAJO' |
  'STOCK_NORMAL' |
  'SOBRESTOCK' |
  'SIN_INVENTARIO';


// ============================================================
// TIPOS COMPUESTOS PARA LA APLICACIÓN
// ============================================================

/**
 * Fila combinada utilizada en la tabla principal
 * de inventario y en el dashboard.
 */
export interface InventoryRow {
  item: InventoryItem;
  inventory: InventoryRecord | null;
  status: StockStatus;
}

/**
 * Fila combinada utilizada en la tabla de movimientos.
 */
export interface MovementRow extends InventoryMovement {
  item_name: string;
  item_sku: string;
}

/**
 * KPIs utilizados en el dashboard.
 */
export interface DashboardKpis {
  totalItems: number;
  totalStock: number;
  lowStockCount: number;
  totalInventoryValue: number;
  recentMovements: MovementRow[];
}

/**
 * Filtros de inventario.
 */
export interface InventoryFilters {
  search: string;
  category: string | null;
  supplier: string | null;
  status: StockStatus | null;
}


// ============================================================
// INPUTS DE LA APLICACIÓN
// ============================================================

export interface InventoryItemInput {
  sku: string;
  name: string;
  description?: string | null;
  category?: string | null;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  price?: number | null;
  cost?: number | null;
  supplier?: string | null;
}

export interface InventoryMovementInput {
  item_id: string;
  inventory_id: string;
  movement_type: MovementType;
  quantity: number;
  reason?: string | null;
  notes?: string | null;
}


// ============================================================
// HELPERS — STOCK
// ============================================================

export function computeStockStatus(
  quantity: number,
  minStock: number,
  maxStock: number
): StockStatus {
  if (quantity <= 0) {
    return 'AGOTADO';
  }

  if (quantity <= minStock) {
    return 'STOCK_BAJO';
  }

  if (maxStock > 0 && quantity > maxStock) {
    return 'SOBRESTOCK';
  }

  return 'STOCK_NORMAL';
}

export function getStockStatusLabel(
  status: StockStatus
): string {
  const labels: Record<StockStatus, string> = {
    AGOTADO: 'Agotado',
    STOCK_BAJO: 'Stock bajo',
    STOCK_NORMAL: 'Stock normal',
    SOBRESTOCK: 'Sobrestock',
    SIN_INVENTARIO: 'Sin inventario',
  };

  return labels[status];
}

export function getStockStatusColor(
  status: StockStatus
): string {
  const colors: Record<StockStatus, string> = {
    AGOTADO: 'red',
    STOCK_BAJO: 'yellow',
    STOCK_NORMAL: 'green',
    SOBRESTOCK: 'blue',
    SIN_INVENTARIO: 'gray',
  };

  return colors[status];
}


// ============================================================
// HELPERS — MOVIMIENTOS
// ============================================================

export function getMovementTypeLabel(
  type: MovementType
): string {
  const labels: Record<MovementType, string> = {
    ENTRADA: 'Entrada',
    SALIDA: 'Salida',
    AJUSTE: 'Ajuste',
  };

  return labels[type];
}

export function getMovementStatusLabel(
  status: MovementStatus
): string {
  const labels: Record<MovementStatus, string> = {
    PENDIENTE: 'Pendiente',
    APROBADO: 'Aprobado',
    RECHAZADO: 'Rechazado',
  };

  return labels[status];
}


// ============================================================
// HELPERS — INVENTARIO
// ============================================================

export function calculateInventoryValue(
  quantity: number,
  cost: number | null
): number {
  if (cost === null) {
    return 0;
  }

  return quantity * cost;
}

export function isLowStock(
  quantity: number,
  minStock: number
): boolean {
  return quantity > 0 && quantity <= minStock;
}

export function isOutOfStock(
  quantity: number
): boolean {
  return quantity <= 0;
}

export function isOverstock(
  quantity: number,
  maxStock: number
): boolean {
  return maxStock > 0 && quantity > maxStock;
}

export interface CategoryStock {
  category: string;
  totalQuantity: number;
}

export function calculateCategoryBreakdown(rows: InventoryRow[]): CategoryStock[] {
  const map = new Map<string, number>();

  rows.forEach((row) => {
    const category = row.item.category?.trim() || 'Sin categoría';
    const quantity = row.inventory?.quantity ?? 0;
    map.set(category, (map.get(category) ?? 0) + quantity);
  });

  return Array.from(map.entries())
    .map(([category, totalQuantity]) => ({ category, totalQuantity }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 6);
}

// ============================================================
// HELPERS — FILTROS
// ============================================================

export function filterInventory(
  rows: InventoryRow[],
  filters: InventoryFilters
): InventoryRow[] {
  const search = filters.search.trim().toLowerCase();

  return rows.filter(({ item, status }) => {
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search) ||
      item.sku.toLowerCase().includes(search);

    const matchesCategory =
      !filters.category ||
      item.category === filters.category;

    const matchesSupplier =
      !filters.supplier ||
      item.supplier === filters.supplier;

    const matchesStatus =
      !filters.status ||
      status === filters.status;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesSupplier &&
      matchesStatus
    );
  });
}