'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import styles from '../../styles/Header.module.css';

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Resumen general del inventario',
  },
  '/items': {
    title: 'Artículos',
    subtitle: 'Administra el catálogo maestro de productos',
  },
  '/inventario': {
    title: 'Inventario',
    subtitle: 'Consulta y actualiza el stock disponible',
  },
  '/movimientos': {
    title: 'Movimientos',
    subtitle: 'Entradas, salidas y ajustes de stock',
  },
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, signOut } = useAuth();

  const meta = TITLES[pathname] ?? {
    title: 'InvenTrack',
    subtitle: '',
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{meta.title}</h1>
        <p className={styles.subtitle}>{meta.subtitle}</p>
      </div>

      <div className={styles.session}>
        <span className={isAdmin ? styles.roleTag : styles.roleTagUser}>
          {isAdmin ? 'Administrador' : 'Usuario'} · {user?.email}
        </span>

        <button
          className={styles.signOutBtn}
          onClick={handleSignOut}
        >
          Salir
        </button>
      </div>
    </header>
  );
}