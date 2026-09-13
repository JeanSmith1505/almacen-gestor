import styles from './KpiCard.module.css';

type Tone = 'primary' | 'success' | 'warning' | 'danger';

interface KpiCardProps {
  label: string;
  value: string;
  tone: Tone;
}

export default function KpiCard({ label, value, tone }: KpiCardProps) {
  return (
    <div className={`${styles.card} ${styles[tone]}`}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}