import type { MovementStatus, MovementType, StockStatus } from '@/types/inventory';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-PE').format(value);
}

export function formatDateTime(isoDate: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(isoDate)
  );
}

const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  AGOTADO: 'Agotado',
  STOCK_BAJO: 'Stock bajo',
  STOCK_NORMAL: 'Stock normal',
  SOBRESTOCK: 'Sobrestock',
  SIN_INVENTARIO: 'Sin inventario'
};

const STOCK_STATUS_TONE: Record<StockStatus, 'danger' | 'warning' | 'success' | 'primary'| 'xd'> = {
  AGOTADO: 'danger',
  STOCK_BAJO: 'warning',
  STOCK_NORMAL: 'success',
  SOBRESTOCK: 'primary',
  SIN_INVENTARIO: 'xd'
};

export function stockStatusLabel(status: StockStatus): string {
  return STOCK_STATUS_LABEL[status];
}

export function stockStatusTone(status: StockStatus) {
  return STOCK_STATUS_TONE[status];
}

const MOVEMENT_TYPE_LABEL: Record<MovementType, string> = {
  ENTRADA: 'Entrada',
  SALIDA: 'Salida',
  AJUSTE: 'Ajuste',
};

const MOVEMENT_TYPE_TONE: Record<MovementType, 'success' | 'danger' | 'primary'> = {
  ENTRADA: 'success',
  SALIDA: 'danger',
  AJUSTE: 'primary',
};

export function movementTypeLabel(type: MovementType): string {
  return MOVEMENT_TYPE_LABEL[type];
}

export function movementTypeTone(type: MovementType) {
  return MOVEMENT_TYPE_TONE[type];
}

const MOVEMENT_STATUS_LABEL: Record<MovementStatus, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};

const MOVEMENT_STATUS_TONE: Record<MovementStatus, 'warning' | 'success' | 'danger'> = {
  PENDIENTE: 'warning',
  APROBADO: 'success',
  RECHAZADO: 'danger',
};

export function movementStatusLabel(status: MovementStatus): string {
  return MOVEMENT_STATUS_LABEL[status];
}

export function movementStatusTone(status: MovementStatus) {
  return MOVEMENT_STATUS_TONE[status];
}