'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Panel from '@/components/ui/Panel';
import { LoadingState, ErrorState } from '@/components/ui/StateView';
import { ToastContainer, useToasts } from '@/components/ui/Toast';

import SearchFilterBar from '@/components/inventory/SearchFilterBar';
import StockTable from '@/components/inventory/StockTable';
import InventoryRecordModal from '@/components/inventory/InventoryRecordModal';

import { filterInventory } from '@/types/inventory';

import {
createInventoryRecord,
getInventoryRows,
updateInventoryRecord,
} from '@/services/inventoryService';

import {
extractUniqueCategories,
extractUniqueSuppliers,
} from '@/services/itemService';

import type {
InventoryFilters,
InventoryRow,
} from '@/types/inventory';

export default function InventarioPage() {

  const EMPTY_FILTERS: InventoryFilters = {
    search: '',
    category: null,
    supplier: null,
    status: null,
  };

const [rows, setRows] = useState<InventoryRow[] | null>(null);

const [categories, setCategories] = useState<string[]>([]);
const [suppliers, setSuppliers] = useState<string[]>([]);

const [error, setError] = useState<string | null>(null);

const [filters, setFilters] =
useState<InventoryFilters>(EMPTY_FILTERS);

const [editingRow, setEditingRow] =
useState<InventoryRow | null>(null);

const {
toasts,
showToast,
dismissToast,
} = useToasts();

/**

* Carga nuevamente el inventario y actualiza
* las opciones de los filtros.
  */
  const reload = useCallback(async () => {
  try {
  setError(null);

  const inventoryRows = await getInventoryRows();

  setRows(inventoryRows);

  /*

  * Las categorías y proveedores se obtienen
  * de los artículos que ya fueron cargados.
  *
  * No hacemos consultas adicionales a Supabase.
    */
    const items = inventoryRows.map((row) => row.item);
    setCategories(
    extractUniqueCategories(items)
    );

  setSuppliers(
  extractUniqueSuppliers(items)
  );
  } catch (err) {
  setError(
  err instanceof Error
  ? err.message
  : 'Ocurrió un error inesperado.'
  );
  }
  }, []);

/**

* Carga inicial.
  */
  useEffect(() => {
  void reload();
  }, [reload]);

/**

* Aplica los filtros sobre los datos
* que ya están cargados en memoria.
  */
  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return filterInventory(rows, filters);
  }, [rows, filters]);

/**

* Guarda el registro de inventario.
*
* Si el artículo todavía no tiene registro:
* -> se crea el inventario inicial.
*
* Si ya tiene registro:
* -> solamente se actualiza configuración.
*
* La cantidad NO se modifica directamente cuando
* el registro ya existe, porque los cambios de stock
* deben realizarse mediante movimientos.
  */
  const handleSubmit = async (values: {
  quantity: number;
  location: string;
  min_stock: number;
  max_stock: number;
  }) => {
  if (!editingRow) {
  return;
  }


try {


  if (editingRow.inventory) {
    await updateInventoryRecord(
      editingRow.inventory.id,
      {
        location: values.location,
        min_stock: values.min_stock,
        max_stock: values.max_stock,
      }
    );

    showToast(
      'success',
      'Configuración del inventario actualizada correctamente.'
    );
  } else {
    await createInventoryRecord({
      item_id: editingRow.item.id,
      quantity: values.quantity,
      location: values.location,
      min_stock: values.min_stock,
      max_stock: values.max_stock,
    });

    showToast(
      'success',
      'Inventario registrado correctamente.'
    );
  }

  setEditingRow(null);

  await reload();
} catch (err) {
  showToast(
    'error',
    err instanceof Error
      ? err.message
      : 'No se pudo guardar el inventario.'
  );
}


};

/**

* Estado de error.
  */
  if (error) {
  return <ErrorState message={error} />;
  }

/**

* Estado de carga.
  */
  if (!rows) {
  return <LoadingState label="Cargando inventario…" />;
  }

return (
<div>
<Panel>
<SearchFilterBar        filters={filters}        categories={categories}        suppliers={suppliers}        onChange={setFilters}      />

    <StockTable
      rows={filteredRows}
      onEdit={setEditingRow}
    />
  </Panel>

  {editingRow && (
    <InventoryRecordModal
      item={editingRow.item}
      record={editingRow.inventory}
      onClose={() => setEditingRow(null)}
      onSubmit={handleSubmit}
    />
  )}

  <ToastContainer
    toasts={toasts}
    onDismiss={dismissToast}
  />
</div>


);
}
