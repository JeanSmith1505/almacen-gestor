'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/Appshell';
import { useAuth } from '@/lib/auth-context';
import { LoadingState } from '@/components/ui/StateView';

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <LoadingState label="Verificando sesión…" />;
  }

  return <AppShell>{children}</AppShell>;
}