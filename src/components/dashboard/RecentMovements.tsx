import type { MovementRow } from '@/types/inventory';
import { MovementStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/StateView';
import styles from './RecentMovements.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  ENTRADA: 'Entrada',
  SALIDA: 'Salida',
  AJUSTE: 'Ajuste',
};

export default function RecentMovements({ movements }: { movements: MovementRow[] }) {
  if (movements.length === 0) {
    return <EmptyState title="Sin movimientos" message="Aún no se registraron movimientos." />;
  }

  return (
    <ul className={styles.list}>
      {movements.map((m) => (
        <li key={m.id} className={styles.item}>
          <div className={styles.itemMain}>
            <span className={styles.itemName}>
              {MOVEMENT_TYPE_LABELS[m.movement_type]} · {m.item_name}
            </span>
            <span className={styles.itemMeta}>
              {m.reason ?? 'Sin motivo especificado'} · {formatDate(m.created_at)}
            </span>
          </div>
          <MovementStatusBadge status={m.status} />
        </li>
      ))}
    </ul>
  );
}