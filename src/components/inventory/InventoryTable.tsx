import type { InventoryRow } from '@/types/inventory';
import { StockStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/StateView';
import styles from './InventoryTable.module.css';

interface InventoryTableProps {
  rows: InventoryRow[];
  onView: (row: InventoryRow) => void;
  onEdit: (row: InventoryRow) => void;
  onDelete: (row: InventoryRow) => void;
}

function formatMoney(value: number | null): string {
  if (value === null) return '—';
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InventoryTable({ rows, onView, onEdit, onDelete }: InventoryTableProps) {
  if (rows.length === 0) {
    return <EmptyState title="No hay artículos" message="No se encontraron artículos con los filtros aplicados." />;
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Artículo</th>
            <th>Categoría</th>
            <th>Stock</th>
            <th>Costo</th>
            <th>Precio</th>
            <th>Proveedor</th>
            <th>Estado</th>
            <th className={styles.actionsHeader}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.item.id}>
              <td className={styles.sku}>{row.item.sku}</td>
              <td>{row.item.name}</td>
              <td>{row.item.category ?? '—'}</td>
              <td>{row.inventory ? row.inventory.quantity : '—'}</td>
              <td>{formatMoney(row.item.cost)}</td>
              <td>{formatMoney(row.item.price)}</td>
              <td>{row.item.supplier ?? '—'}</td>
              <td>
                <StockStatusBadge status={row.status} />
              </td>
              <td>
                <div className={styles.actions}>
                  <button className={styles.actionBtn} onClick={() => onView(row)}>
                    Ver
                  </button>
                  <button className={styles.actionBtn} onClick={() => onEdit(row)}>
                    Editar
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.actionDanger}`}
                    onClick={() => onDelete(row)}
                  >
                    Eliminar
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
