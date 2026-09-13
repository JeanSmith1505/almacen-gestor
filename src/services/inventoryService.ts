import { supabase } from '@/lib/supabase';
import {
  computeStockStatus,
  type InventoryItem,
  type InventoryRecord,
  type InventoryRecordInsert,
  type InventoryRecordUpdate,
  type InventoryRow,
} from '@/types/inventory';

type ItemWithInventory = InventoryItem & {
  inventory: InventoryRecord | InventoryRecord[] | null;
};


/**
 * Obtiene todos los artículos con su registro de inventario (join).
 * Requiere sesión autenticada (RLS solo concede SELECT a `authenticated`).
 */
export async function getInventoryRows(): Promise<InventoryRow[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*, inventory(*)')
    .order('created_at', { ascending: false });
    console.log(JSON.stringify(data, null, 2))

  if (error) {
    throw new Error(`No se pudo cargar el inventario: ${error.message}`);
  }

  return ((data ?? []) as ItemWithInventory[]).map((row) => {
    const inventory = Array.isArray(row.inventory)
      ? row.inventory[0] ?? null
      : row.inventory ?? null;

    const { inventory: _inventory, ...item } = row;

    return {
      item,
      inventory,
      status: inventory
        ? computeStockStatus(inventory.quantity, inventory.min_stock, inventory.max_stock)
        : 'SIN_INVENTARIO',
    };
  });
}

/**
 * Obtiene el registro de inventario de un artículo específico.
 */
export async function getInventoryByItemId(itemId: string): Promise<InventoryRecord | null> {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('item_id', itemId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo consultar el inventario: ${error.message}`);
  }

  return data;
}

/**
 * Crea el registro de inventario inicial de un artículo.
 * Cualquier usuario autenticado puede hacerlo (policy
 * `authenticated_can_insert_inventory` con WITH CHECK (true)).
 * No requiere RPC: no hay lógica transaccional que proteger aquí,
 * a diferencia de aprobar/rechazar movimientos.
 */
export async function createInventoryRecord(
  input: InventoryRecordInsert
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
    if (error.code === '23503') {
      throw new Error('El artículo indicado no existe.');
    }
    throw new Error(`No se pudo crear el registro de inventario: ${error.message}`);
  }

  return data;
}

/**
 * Actualiza `location`, `min_stock` y/o `max_stock` de un registro de
 * inventario. `quantity` se excluye del tipo a propósito: la policy de
 * UPDATE permite enviarla, pero la RLS check
 * (`is_admin() OR quantity = quantity_actual`) rechaza cualquier UPDATE
 * que intente cambiarla si quien lo hace no es admin. El stock solo
 * cambia mediante `approve_inventory_movement`.
 */
export async function updateInventoryRecord(
  id: string,
  input: Omit<InventoryRecordUpdate, 'quantity'>
): Promise<InventoryRecord> {
  const { data, error } = await supabase
    .from('inventory')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`No se pudo actualizar el inventario: ${error.message}`);
  }

  return data;
}

/**
 * Calcula los KPIs del dashboard a partir de las filas ya cargadas en memoria.
 */
export function calculateInventoryMetrics(rows: InventoryRow[]) {
  const totalItems = rows.length;

  const totalStock = rows.reduce((sum, row) => sum + (row.inventory?.quantity ?? 0), 0);

  const lowStockCount = rows.filter(
    (row) =>
      row.status === 'STOCK_BAJO' ||
      row.status === 'AGOTADO' ||
      row.status === 'SIN_INVENTARIO' ||
      row.status === 'SOBRESTOCK'
  ).length;

  const totalInventoryValue = rows.reduce(
    (sum, row) => sum + (row.inventory?.quantity ?? 0) * (row.item.cost ?? 0),
    0
  );

  return { totalItems, totalStock, lowStockCount, totalInventoryValue };
}