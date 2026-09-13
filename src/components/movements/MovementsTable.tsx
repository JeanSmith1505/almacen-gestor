import type { MovementRow } from '@/types/inventory';
import { MovementStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/StateView';
import tableStyles from '@/components/inventory/InventoryTable.module.css';
import styles from './MovementsTable.module.css';

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  ENTRADA: 'Entrada',
  SALIDA: 'Salida',
  AJUSTE: 'Ajuste',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
}

interface MovementsTableProps {
  movements: MovementRow[];
  onApprove: (movement: MovementRow) => void;
  onReject: (movement: MovementRow) => void;
  processingId: string | null;
  canModerate: boolean;
}

export default function MovementsTable({
  movements,
  onApprove,
  onReject,
  processingId,
  canModerate,
}: MovementsTableProps) {
  if (movements.length === 0) {
    return <EmptyState title="Sin movimientos" message="Aún no se registraron movimientos de inventario." />;
  }

  return (
    <div className={tableStyles.tableWrapper}>
      <table className={tableStyles.table}>
        <thead>
          <tr>
            <th>N#</th>
            <th>Fecha</th>
            <th>SKU</th>
            <th>Artículo</th>
            <th>Tipo</th>
            <th>Cantidad</th>
            <th>Motivo</th>
            <th>Estado</th>
            <th className={tableStyles.actionsHeader}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => ( //indexarlo, aca x table o desde supabase xq esta generando i
            <tr key={m.id}>
              <td>//id</td>
              <td>{formatDate(m.created_at)}</td>
              <td className={tableStyles.sku}>{m.item_sku}</td>
              <td>{m.item_name}</td>
              <td>
                <span className={`${styles.typeTag} ${styles[m.movement_type.toLowerCase()]}`}>
                  {MOVEMENT_TYPE_LABELS[m.movement_type]}
                </span>
              </td>
              <td>{m.quantity}</td>
              <td>{m.reason ?? '—'}</td>
              <td>
                <MovementStatusBadge status={m.status} />
              </td>
              <td>
                {m.status === 'PENDIENTE' && canModerate ? (
                  <div className={tableStyles.actions}>
                    <button
                      className={tableStyles.actionBtn}
                      disabled={processingId === m.id}
                      onClick={() => onApprove(m)}
                    >
                      Aprobar
                    </button>
                    <button
                      className={`${tableStyles.actionBtn} ${tableStyles.actionDanger}`}
                      disabled={processingId === m.id}
                      onClick={() => onReject(m)}
                    >
                      Rechazar
                    </button>
                  </div>
                ) : m.status === 'PENDIENTE' ? (
                  <span className={styles.noAction}>Esperando admin</span>
                ) : (
                  <span className={styles.noAction}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}