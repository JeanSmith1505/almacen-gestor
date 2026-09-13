import type { InventoryRow } from '@/types/inventory';
import { StockStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/StateView';
import tableStyles from '@/components/inventory/InventoryTable.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function StockTable({
  rows,
  onEdit,
}: {
  rows: InventoryRow[];
  onEdit: (row: InventoryRow) => void;
}) {
  if (rows.length === 0) {
    return <EmptyState title="No hay registros" message="No se encontraron artículos con los filtros aplicados." />;
  }

  return (
    <div className={tableStyles.tableWrapper}>
      <table className={tableStyles.table}>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Artículo</th>
            <th>Ubicación</th>
            <th>Stock</th>
            <th>Mínimo</th>
            <th>Máximo</th>
            <th>Estado</th>
            <th>Actualizado</th>
            <th className={tableStyles.actionsHeader}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.item.id}>
              <td className={tableStyles.sku}>{row.item.sku}</td>
              <td>{row.item.name}</td>
              <td>{row.inventory?.location ?? '—'}</td>
              <td>{row.inventory ? row.inventory.quantity : '—'}</td>
              <td>{row.inventory ? row.inventory.min_stock : '—'}</td>
              <td>{row.inventory ? row.inventory.max_stock : '—'}</td>
              <td>
                <StockStatusBadge status={row.status} />
              </td>
              <td>{row.inventory ? formatDate(row.inventory.updated_at) : '—'}</td>
              <td>
                <div className={tableStyles.actions}>
                  <button className={tableStyles.actionBtn} onClick={() => onEdit(row)}>
                    {row.inventory ? 'Editar' : 'Registrar'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
