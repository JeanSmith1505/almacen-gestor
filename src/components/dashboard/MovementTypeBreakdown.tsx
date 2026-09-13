import styles from './MovementTypeBreakdown.module.css';

const CONFIG = [
  { key: 'ENTRADA', label: 'Entradas', tone: 'success' as const },
  { key: 'SALIDA', label: 'Salidas', tone: 'danger' as const },
  { key: 'AJUSTE', label: 'Ajustes', tone: 'warning' as const },
];

export default function MovementTypeBreakdown({
  counts,
}: {
  counts: Record<'ENTRADA' | 'SALIDA' | 'AJUSTE', number>;
}) {
  const total = counts.ENTRADA + counts.SALIDA + counts.AJUSTE;

  return (
    <ul className={styles.list}>
      {CONFIG.map(({ key, label, tone }) => {
        const count = counts[key as keyof typeof counts];
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <li key={key} className={styles.row}>
            <span className={styles.label}>{label}</span>
            <div className={styles.track}>
              <div className={`${styles.bar} ${styles[tone]}`} style={{ width: `${pct}%` }} />
            </div>
            <span className={styles.value}>{count}</span>
          </li>
        );
      })}
    </ul>
  );
}