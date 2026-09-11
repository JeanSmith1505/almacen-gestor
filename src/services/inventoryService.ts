import { supabase } from '@/lib/supabase';
import {
  computeStockStatus,
  type InventoryItem,
  type InventoryRecord,
  type InventoryRecordInput,
  type InventoryRecordUpdate,
  type InventoryRow,
} from '@/types/inventory';

type ItemWithInventory = InventoryItem & { inventory: InventoryRecord[] | null };

/** Trae todos los artículos con su registro de inventario (join). */
export async function getInventoryRows(): Promise<InventoryRow[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*, inventory(*)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as ItemWithInventory[]).map((row) => {
    const inv = row.inventory?.[0] ?? null;
    const { inventory: _omit, ...item } = row;
    return {
      item,
      inventory: inv,
      status: inv
        ? computeStockStatus(inv.quantity, inv.min_stock, inv.max_stock)
        : 'AGOTADO',
    };
  });
}

export async function getInventoryByItemId(itemId: string): Promise<InventoryRecord | null> {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('item_id', itemId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createInventoryRecord(
  input: InventoryRecordInput
): Promise<InventoryRecord> {
  const { data, error } = await supabase
    .from('inventory')
    .insert(input)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Este artículo ya tiene un registro de inventario.');
    }
    throw new Error(error.message);
  }
  return data;
}

export async function updateInventoryRecord(
  id: string,
  input: InventoryRecordUpdate
): Promise<InventoryRecord> {
  const { data, error } = await supabase
    .from('inventory')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}