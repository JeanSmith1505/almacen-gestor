// components/dashboard/CriticalStockList.tsx
import Link from 'next/link';
import type { InventoryRow } from '@/types/inventory';
import { StockStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/StateView';
import styles from './CriticalStockList.module.css';

export default function CriticalStockList({ rows }: { rows: InventoryRow[] }) {
  if (rows.length === 0) {
    return <EmptyState title="Todo en orden" message="Ningún artículo está por debajo de su stock mínimo." />;
  }

  return (
    <ul className={styles.list}>
      {rows.map((row) => (
        <li key={row.item.id} className={styles.item}>
          <div className={styles.itemMain}>
            <span className={styles.sku}>{row.item.sku}</span>
            <span className={styles.name}>{row.item.name}</span>
          </div>
          <div className={styles.itemRight}>
            <span className={styles.quantity}>
              {row.inventory ? `${row.inventory.quantity} un.` : 'Sin inventario'}
            </span>
            <StockStatusBadge status={row.status} />
          </div>
        </li>
      ))}
      <li>
        <Link href="/inventario" className={styles.link}>Ver inventario completo →</Link>
      </li>
    </ul>
  );
}