'use client';

import { usePathname } from 'next/navigation';
import styles from '../../styles/Header.module.css';

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Resumen general del inventario' },
  '/items': { title: 'Artículos', subtitle: 'Administra el catálogo maestro de productos' },
  '/inventario': { title: 'Inventario', subtitle: 'Consulta y actualiza el stock disponible' },
  '/movimientos': { title: 'Movimientos', subtitle: 'Entradas, salidas y ajustes de stock' },
};

export default function Header() {
  const pathname = usePathname();
  const meta = TITLES[pathname] ?? { title: 'InvenTrack', subtitle: '' };

  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{meta.title}</h1>
        <p className={styles.subtitle}>{meta.subtitle}</p>
      </div>
    </header>
  );
}