import Modal from '@/components/ui/Modal';
import { StockStatusBadge } from '@/components/ui/Badge';
import type { InventoryRow } from '@/types/inventory';
import styles from './ItemDetailModal.module.css';

function formatMoney(value: number | null): string {
  if (value === null) return '—';
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ItemDetailModal({
  row,
  onClose,
}: {
  row: InventoryRow;
  onClose: () => void;
}) {
  const { item, inventory, status } = row;

  return (
    <Modal title={item.name} onClose={onClose} width={560}>
      <div className={styles.headerRow}>
        <span className={styles.sku}>{item.sku}</span>
        <StockStatusBadge status={status} />
      </div>

      {item.description && <p className={styles.description}>{item.description}</p>}

      <div className={styles.grid}>
        <div className={styles.field}>
          <span className={styles.label}>Categoría</span>
          <span>{item.category ?? '—'}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Proveedor</span>
          <span>{item.supplier ?? '—'}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Precio</span>
          <span>{formatMoney(item.price)}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Costo</span>
          <span>{formatMoney(item.cost)}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Dimensiones (L×A×A)</span>
          <span>
            {item.length ?? '—'} × {item.width ?? '—'} × {item.height ?? '—'} cm
          </span>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Peso</span>
          <span>{item.weight ?? '—'} kg</span>
        </div>
      </div>

      <hr className={styles.divider} />

      <h4 className={styles.subtitle}>Inventario</h4>
      {inventory ? (
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.label}>Stock actual</span>
            <span>{inventory.quantity}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Ubicación</span>
            <span>{inventory.location ?? '—'}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Stock mínimo</span>
            <span>{inventory.min_stock}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Stock máximo</span>
            <span>{inventory.max_stock}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Última actualización</span>
            <span>{formatDate(inventory.updated_at)}</span>
          </div>
        </div>
      ) : (
        <p className={styles.description}>
          Este artículo aún no tiene un registro de inventario. Créalo desde la sección
          &quot;Inventario&quot;.
        </p>
      )}
    </Modal>
  );
}
