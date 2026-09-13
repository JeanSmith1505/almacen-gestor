import styles from './Panel.module.css';

interface PanelProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export default function Panel({ title, action, children }: PanelProps) {
  return (
    <section className={styles.panel}>
      {(title || action) && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {action}
        </div>
      )}
      <div>{children}</div>
    </section>
  );
}
