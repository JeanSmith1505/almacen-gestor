import type { Metadata } from 'next';
import AppShell from '@/components/layout/Appshell';
import './globals.css';

export const metadata: Metadata = {
  title: 'InvenTrack — Gestión de Inventario',
  description: 'Sistema administrativo de gestión de inventario',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}