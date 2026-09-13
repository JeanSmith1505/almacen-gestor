import type { CategoryStock } from '@/types/inventory';
import { EmptyState } from '@/components/ui/StateView';
import styles from './CategoryStockChart.module.css';

export default function CategoryStockChart({ data }: { data: CategoryStock[] }) {
  if (data.length === 0) {
    return <EmptyState title="Sin datos" message="No hay stock registrado todavía." />;
  }

  const max = Math.max(...data.map((d) => d.totalQuantity), 1);

  return (
    <ul className={styles.list}>
      {data.map((d) => (
        <li key={d.category} className={styles.row}>
          <span className={styles.label}>{d.category}</span>
          <div className={styles.track}>
            <div className={styles.bar} style={{ width: `${(d.totalQuantity / max) * 100}%` }} />
          </div>
          <span className={styles.value}>{d.totalQuantity}</span>
        </li>
      ))}
    </ul>
  );
}