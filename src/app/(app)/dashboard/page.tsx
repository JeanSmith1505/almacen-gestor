'use client';

import { useEffect, useMemo, useState } from 'react';

import KpiCard from '@/components/dashboard/KpiCard';
import RecentMovements from '@/components/dashboard/RecentMovements';
import CriticalStockList from '@/components/dashboard/CriticalStockList';
import CategoryStockChart from '@/components/dashboard/CategoryStockChart';
import MovementTypeBreakdown from '@/components/dashboard/MovementTypeBreakdown';

import { LoadingState, ErrorState } from '@/components/ui/StateView';

import {
  calculateInventoryMetrics,
  getInventoryRows,
} from '@/services/inventoryService';
import { fetchRecentMovements, fetchMovementTypeCounts } from '@/services/movementService';
import { calculateCategoryBreakdown } from '@/types/inventory';
import { formatCurrency, formatNumber } from '@/lib/format';

import type { InventoryRow, MovementRow, MovementType } from '@/types/inventory';

import styles from './page.module.css';

export default function DashboardPage() {
  const [rows, setRows] = useState<InventoryRow[] | null>(null);
  const [recentMovements, setRecentMovements] = useState<MovementRow[]>([]);
  const [movementCounts, setMovementCounts] = useState<Record<MovementType, number>>({
    ENTRADA: 0,
    SALIDA: 0,
    AJUSTE: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [inventoryRows, movements, counts] = await Promise.all([
          getInventoryRows(),
          fetchRecentMovements(5),
          fetchMovementTypeCounts(),
        ]);
        setRows(inventoryRows);
        setRecentMovements(movements);
        setMovementCounts(counts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado al consultar Supabase.');
      }
    })();
  }, []);

  const metrics = useMemo(() => (rows ? calculateInventoryMetrics(rows) : null), [rows]);

  const criticalRows = useMemo(() => {
    if (!rows) return [];
    return rows
      .filter(
        (row) =>
          row.status === 'STOCK_BAJO' ||
          row.status === 'AGOTADO' ||
          row.status === 'SIN_INVENTARIO' ||
          row.status === 'SOBRESTOCK'
      )
      .slice(0, 5);
  }, [rows]);

  const categoryBreakdown = useMemo(() => (rows ? calculateCategoryBreakdown(rows) : []), [rows]);

  if (error) return <ErrorState message={error} />;
  if (!rows || !metrics) return <LoadingState label="Cargando dashboard…" />;

  return (
    <div className={styles.page}>
      <div className={styles.kpiRow}>
        <KpiCard label="Artículos registrados" value={formatNumber(metrics.totalItems)} tone="primary" />
        <KpiCard label="Stock total" value={formatNumber(metrics.totalStock)} tone="success" />
        <KpiCard label="Stock crítico" value={formatNumber(metrics.lowStockCount)} tone="warning" />
        <KpiCard label="Valor del inventario" value={formatCurrency(metrics.totalInventoryValue)} tone="danger" />
      </div>

      <div className={styles.columns}>
        <section className={styles.column}>
          <h2 className={styles.sectionTitle}>Stock crítico</h2>
          <CriticalStockList rows={criticalRows} />
        </section>

        <section className={styles.column}>
          <h2 className={styles.sectionTitle}>Movimientos recientes</h2>
          <RecentMovements movements={recentMovements} />
        </section>
      </div>

      <div className={styles.columns}>
        <section className={styles.column}>
          <h2 className={styles.sectionTitle}>Stock por categoría</h2>
          <CategoryStockChart data={categoryBreakdown} />
        </section>

        <section className={styles.column}>
          <h2 className={styles.sectionTitle}>Movimientos por tipo</h2>
          <MovementTypeBreakdown counts={movementCounts} />
        </section>
      </div>
    </div>
  );
}