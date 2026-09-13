import styles from './StateView.module.css';

export function EmptyState({
  title = 'Sin resultados',
  message = 'No se encontraron registros con los filtros actuales.',
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className={styles.state}>
      <div className={styles.icon}>▢</div>
      <p className={styles.title}>{title}</p>
      <p className={styles.message}>{message}</p>
    </div>
  );
}

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className={styles.state}>
      <div className={styles.spinner} />
      <p className={styles.message}>{label}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className={styles.state}>
      <div className={styles.iconError}>!</div>
      <p className={styles.title}>Ocurrió un error</p>
      <p className={styles.message}>{message}</p>
    </div>
  );
}