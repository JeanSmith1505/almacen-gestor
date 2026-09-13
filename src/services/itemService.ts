import { supabase } from '@/lib/supabase';
import type { InventoryItem, InventoryItemInput } from '@/types/inventory';

/**
 * Obtiene todos los artículos registrados.
 */
export async function getItems(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar los artículos: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Obtiene un artículo por su ID.
 */
export async function getItemById(id: string): Promise<InventoryItem | null> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo consultar el artículo: ${error.message}`);
  }

  return data;
}

/**
 * Crea un nuevo artículo.
 * Requiere sesión autenticada (usuario o admin); RLS lo exige.
 */
export async function createItem(input: InventoryItemInput): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert(input)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`El SKU "${input.sku}" ya está en uso. Elige un SKU distinto.`);
    }
    throw new Error(`No se pudo crear el artículo: ${error.message}`);
  }

  return data;
}

/**
 * Actualiza un artículo existente.
 */
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
      throw new Error(`El SKU "${input.sku ?? ''}" ya está en uso. Elige un SKU distinto.`);
    }
    throw new Error(`No se pudo actualizar el artículo: ${error.message}`);
  }

  return data;
}

/**
 * Elimina un artículo.
 * La base de datos impide eliminarlo si existen movimientos asociados
 * (ON DELETE RESTRICT en inventory_movements.item_id).
 */
export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('inventory_items').delete().eq('id', id);

  if (error) {
    if (error.code === '23503') {
      throw new Error(
        'No se puede eliminar el artículo: tiene registros de inventario o movimientos asociados.'
      );
    }
    throw new Error(`No se pudo eliminar el artículo: ${error.message}`);
  }
}

/**
 * Obtiene las categorías únicas a partir de los artículos ya cargados en memoria.
 */
export function extractUniqueCategories(items: InventoryItem[]): string[] {
  return Array.from(
    new Set(
      items.map((item) => item.category).filter((c): c is string => Boolean(c?.trim()))
    )
  ).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Obtiene los proveedores únicos a partir de los artículos ya cargados en memoria.
 */
export function extractUniqueSuppliers(items: InventoryItem[]): string[] {
  return Array.from(
    new Set(
      items.map((item) => item.supplier).filter((s): s is string => Boolean(s?.trim()))
    )
  ).sort((a, b) => a.localeCompare(b, 'es'));
}