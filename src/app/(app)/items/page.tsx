'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/StateView';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ToastContainer, useToasts } from '@/components/ui/Toast';

import SearchFilterBar from '@/components/inventory/SearchFilterBar';
import InventoryTable from '@/components/inventory/InventoryTable';

import ItemFormModal from '@/components/items/ItemFormModal';
import ItemDetailModal from '@/components/items/ItemDetailModal';

import { filterInventory } from '@/types/inventory';

import { getInventoryRows } from '@/services/inventoryService';

import {
  createItem,
  deleteItem,
  extractUniqueCategories,
  extractUniqueSuppliers,
  updateItem,
} from '@/services/itemService';

import type {
  InventoryFilters,
  InventoryItem,
  InventoryItemInput,
  InventoryRow,
} from '@/types/inventory';

const EMPTY_FILTERS: InventoryFilters = {
  search: '',
  category: null,
  supplier: null,
  status: null,
};

type ModalState =
  | { type: 'none' }
  | { type: 'view'; row: InventoryRow }
  | { type: 'create' }
  | { type: 'edit'; item: InventoryItem }
  | { type: 'delete'; row: InventoryRow };

export default function ItemsPage() {
  const [rows, setRows] = useState<InventoryRow[] | null>(null);

  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<InventoryFilters>(EMPTY_FILTERS);

  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const [deleting, setDeleting] = useState(false);

  const { toasts, showToast, dismissToast } = useToasts();

  /**
   * Carga los artículos junto con su inventario.
   *
   * Las categorías y proveedores se obtienen de los datos ya cargados,
   * evitando consultas adicionales a Supabase.
   */
  const reload = useCallback(async () => {
    try {
      setError(null);

      const inventoryRows = await getInventoryRows();
      setRows(inventoryRows);

      const items = inventoryRows.map((row) => row.item);

      setCategories(extractUniqueCategories(items));
      setSuppliers(extractUniqueSuppliers(items));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  /**
   * Aplica los filtros sobre los datos que ya están cargados en memoria.
   */
  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return filterInventory(rows, filters);
  }, [rows, filters]);

  /**
   * Crea un nuevo artículo.
   */
  const handleCreate = async (input: InventoryItemInput) => {
    try {
      await createItem(input);

      setModal({ type: 'none' });
      showToast('success', 'Artículo creado correctamente.');

      await reload();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'No se pudo crear el artículo.');
    }
  };

  /**
   * Actualiza un artículo existente.
   */
  const handleUpdate = async (id: string, input: InventoryItemInput) => {
    try {
      await updateItem(id, input);

      setModal({ type: 'none' });
      showToast('success', 'Artículo actualizado correctamente.');

      await reload();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'No se pudo actualizar el artículo.');
    }
  };

  /**
   * Elimina un artículo.
   */
  const handleDelete = async (row: InventoryRow) => {
    setDeleting(true);

    try {
      await deleteItem(row.item.id);

      showToast('success', 'Artículo eliminado correctamente.');
      setModal({ type: 'none' });

      await reload();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'No se pudo eliminar el artículo.');
    } finally {
      setDeleting(false);
    }
  };

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!rows) {
    return <LoadingState label="Cargando artículos…" />;
  }

  return (
    <div>
      <Panel
        action={
          <Button onClick={() => setModal({ type: 'create' })}>+ Nuevo artículo</Button>
        }
      >
        <SearchFilterBar
          filters={filters}
          categories={categories}
          suppliers={suppliers}
          onChange={setFilters}
        />

        <InventoryTable
          rows={filteredRows}
          onView={(row) => setModal({ type: 'view', row })}
          onEdit={(row) => setModal({ type: 'edit', item: row.item })}
          onDelete={(row) => setModal({ type: 'delete', row })}
        />
      </Panel>

      {modal.type === 'view' && (
        <ItemDetailModal row={modal.row} onClose={() => setModal({ type: 'none' })} />
      )}

      {modal.type === 'create' && (
        <ItemFormModal onClose={() => setModal({ type: 'none' })} onSubmit={handleCreate} />
      )}

      {modal.type === 'edit' && (
        <ItemFormModal
          item={modal.item}
          onClose={() => setModal({ type: 'none' })}
          onSubmit={(input) => handleUpdate(modal.item.id, input)}
        />
      )}

      {modal.type === 'delete' && (
        <ConfirmDialog
          title="Eliminar artículo"
          message={`¿Estás seguro de que deseas eliminar "${modal.row.item.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          danger
          loading={deleting}
          onConfirm={() => handleDelete(modal.row)}
          onCancel={() => setModal({ type: 'none' })}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}