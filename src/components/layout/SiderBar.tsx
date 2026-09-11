'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../../styles/Sidebar.module.css';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '◱' },
  { href: '/items', label: 'Artículos', icon: '▤' },
  { href: '/inventario', label: 'Inventario', icon: '⬒' },
  { href: '/movimientos', label: 'Movimientos', icon: '⇄' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>IT</span>
        <span className={styles.brandName}>InvenTrack</span>
      </div>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}