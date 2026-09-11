import styles from './Badge.module.css';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

const STOCK_STATUS_LABELS: Record<string, { label: string; tone: Tone }> = {
  AGOTADO: { label: 'Agotado', tone: 'danger' },
  STOCK_BAJO: { label: 'Stock bajo', tone: 'warning' },
  STOCK_NORMAL: { label: 'Stock normal', tone: 'success' },
  SOBRESTOCK: { label: 'Sobrestock', tone: 'primary' },
};

const MOVEMENT_STATUS_LABELS: Record<string, { label: string; tone: Tone }> = {
  PENDIENTE: { label: 'Pendiente', tone: 'warning' },
  APROBADO: { label: 'Aprobado', tone: 'success' },
  RECHAZADO: { label: 'Rechazado', tone: 'danger' },
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}

export function StockStatusBadge({ status }: { status: string }) {
  const meta = STOCK_STATUS_LABELS[status] ?? { label: status, tone: 'neutral' as Tone };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function MovementStatusBadge({ status }: { status: string }) {
  const meta = MOVEMENT_STATUS_LABELS[status] ?? { label: status, tone: 'neutral' as Tone };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}