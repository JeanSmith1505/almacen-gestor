import { supabase } from '@/lib/supabase';
import type { InventoryMovement, InventoryMovementInput, MovementRow, MovementType  } from '@/types/inventory';

interface MovementQueryRow extends InventoryMovement {
  inventory_items: { name: string; sku: string } | null;
}

function toMovementRow(row: MovementQueryRow): MovementRow {
  const { inventory_items, ...movement } = row;
  return {
    ...movement,
    item_name: inventory_items?.name ?? 'Artículo eliminado',
    item_sku: inventory_items?.sku ?? '—',
  };
}

/**
 * Obtiene todos los movimientos. Cualquier autenticado (usuario o admin)
 * ve todos; un invitado (anon) también, en solo lectura.
 */
export async function getMovements(): Promise<MovementRow[]> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*, inventory_items ( name, sku )')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar los movimientos: ${error.message}`);
  }
  return ((data ?? []) as MovementQueryRow[]).map(toMovementRow);
}

/**
 * Obtiene los `limit` movimientos más recientes (para el dashboard).
 */
export async function fetchRecentMovements(limit: number): Promise<MovementRow[]> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*, inventory_items ( name, sku )')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`No se pudieron cargar los movimientos recientes: ${error.message}`);
  }
  return ((data ?? []) as MovementQueryRow[]).map(toMovementRow);
}

/**
 * Crea un movimiento en estado PENDIENTE.
 * Requiere sesión autenticada (usuario o admin).
 */
export async function createMovement(input: InventoryMovementInput): Promise<InventoryMovement> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .insert({ ...input, status: 'PENDIENTE' })
    .select()
    .single();

  if (error) {
    throw new Error(`No se pudo crear el movimiento: ${error.message}`);
  }
  return data;
}

/**
 * Aprueba un movimiento mediante la función RPC `approve_inventory_movement`,
 * que actualiza el stock y el estado del movimiento dentro de una única
 * transacción en PostgreSQL. Solo un admin puede ejecutarla; la función lo
 * valida internamente (`is_admin()`).
 */
export async function approveMovement(movementId: string): Promise<InventoryMovement> {
  const { data, error } = await supabase.rpc('approve_inventory_movement', {
    p_movement_id: movementId,
  });

  if (error) {
    throw new Error(`No se pudo aprobar el movimiento: ${error.message}`);
  }
  return data;
}

/**
 * Rechaza un movimiento mediante la función RPC `reject_inventory_movement`.
 * El stock no se modifica. `reason` es opcional y se guarda en `notes`.
 */
export async function rejectMovement(
  movementId: string,
  reason?: string
): Promise<InventoryMovement> {
  const { data, error } = await supabase.rpc('reject_inventory_movement', {
    p_movement_id: movementId,
    p_reason: reason ?? null,
  });

  if (error) {
    throw new Error(`No se pudo rechazar el movimiento: ${error.message}`);
  }
  return data;
}

export async function fetchMovementTypeCounts(limit = 100): Promise<Record<MovementType, number>> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('movement_type')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`No se pudo calcular la distribución de movimientos: ${error.message}`);
  }

  const counts: Record<MovementType, number> = { ENTRADA: 0, SALIDA: 0, AJUSTE: 0 };
  (data ?? []).forEach((m) => {
    counts[m.movement_type as MovementType] += 1;
  });
  return counts;
}