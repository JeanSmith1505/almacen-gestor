import { supabase } from '@/lib/supabase';
import type { InventoryMovement, InventoryMovementInput, MovementRow } from '@/types/inventory';

type MovementWithItem = InventoryMovement & {
  inventory_items: { name: string; sku: string } | null;
};

export async function getMovements(): Promise<MovementRow[]> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*, inventory_items(name, sku)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as MovementWithItem[]).map((row) => {
    const { inventory_items, ...movement } = row;
    return {
      ...movement,
      item_name: inventory_items?.name ?? 'Artículo eliminado',
      item_sku: inventory_items?.sku ?? '—',
    };
  });
}

export async function getRecentMovements(limit = 5): Promise<MovementRow[]> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*, inventory_items(name, sku)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return ((data ?? []) as MovementWithItem[]).map((row) => {
    const { inventory_items, ...movement } = row;
    return {
      ...movement,
      item_name: inventory_items?.name ?? 'Artículo eliminado',
      item_sku: inventory_items?.sku ?? '—',
    };
  });
}

export async function createMovement(input: InventoryMovementInput): Promise<InventoryMovement> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .insert({
      item_id: input.item_id,
      inventory_id: input.inventory_id,
      movement_type: input.movement_type,
      quantity: input.quantity,
      reason: input.reason,
      notes: input.notes ?? null,
      status: 'PENDIENTE',
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Aprueba un movimiento mediante la función RPC 'approve_movement'.
 * Toda la lógica (actualizar stock + cambiar estado) corre de forma
 * atómica dentro de PostgreSQL, evitando estados inconsistentes.
 */
export async function approveMovement(movementId: string): Promise<InventoryMovement> {
  const { data, error } = await supabase.rpc('approve_movement', {
    p_movement_id: movementId,
  });

  if (error) throw new Error(error.message);
  return data as InventoryMovement;
}

export async function rejectMovement(movementId: string): Promise<InventoryMovement> {
  const { data, error } = await supabase.rpc('reject_movement', {
    p_movement_id: movementId,
  });

  if (error) throw new Error(error.message);
  return data as InventoryMovement;
}