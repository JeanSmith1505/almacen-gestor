import { supabase } from '@/lib/supabase';
import type { InventoryItem, InventoryItemInput } from '@/types/inventory';

export async function getItems(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getItemById(id: string): Promise<InventoryItem | null> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createItem(input: InventoryItemInput): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert(input)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un artículo con ese SKU.');
    }
    throw new Error(error.message);
  }
  return data;
}

export async function updateItem(
  id: string,
  input: Partial<InventoryItemInput>
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un artículo con ese SKU.');
    }
    throw new Error(error.message);
  }
  return data;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('inventory_items').delete().eq('id', id);

  if (error) {
    if (error.code === '23503') {
      throw new Error(
        'No se puede eliminar: el artículo tiene registros de inventario o movimientos asociados.'
      );
    }
    throw new Error(error.message);
  }
}

export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('category')
    .not('category', 'is', null);

  if (error) throw new Error(error.message);
  return Array.from(new Set((data ?? []).map((r) => r.category as string))).sort();
}

export async function getSuppliers(): Promise<string[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('supplier')
    .not('supplier', 'is', null);

  if (error) throw new Error(error.message);
  return Array.from(new Set((data ?? []).map((r) => r.supplier as string))).sort();
}