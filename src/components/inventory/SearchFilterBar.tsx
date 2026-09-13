'use client';

import type { InventoryFilters, StockStatus } from '@/types/inventory';
import formStyles from '@/components/ui/formInputs.module.css';
import styles from './SearchFilterBar.module.css';

const STATUS_OPTIONS: { value: StockStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'AGOTADO', label: 'Agotado' },
  { value: 'STOCK_BAJO', label: 'Stock bajo' },
  { value: 'STOCK_NORMAL', label: 'Stock normal' },
  { value: 'SOBRESTOCK', label: 'Sobrestock' },
  { value: 'SIN_INVENTARIO', label: 'Sin inventario' },
];

interface SearchFilterBarProps {
  filters: InventoryFilters;
  categories: string[];
  suppliers: string[];
  onChange: (filters: InventoryFilters) => void;
}

export default function SearchFilterBar({
  filters,
  categories,
  suppliers,
  onChange,
}: SearchFilterBarProps) {
  return (
    <div className={styles.bar}>
  <input
    className={`${formStyles.input} ${styles.search}`}
    placeholder="Buscar por nombre o SKU…"
    value={filters.search}
    onChange={(e) => onChange({ ...filters, search: e.target.value })}
  />

  <div className={styles.selectGroup}>
    <select
      className={formStyles.select}
      value={filters.category ?? 'ALL'}
      onChange={(e) =>
        onChange({ ...filters, category: e.target.value === 'ALL' ? null : e.target.value })
      }
    >
      <option value="ALL">Toda categoría</option>
      {categories.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>

    <select
      className={formStyles.select}
      value={filters.supplier ?? 'ALL'}
      onChange={(e) =>
        onChange({ ...filters, supplier: e.target.value === 'ALL' ? null : e.target.value })
      }
    >
      <option value="ALL">Todo proveedor</option>
      {suppliers.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>

    <select
      className={formStyles.select}
      value={filters.status ?? 'ALL'}
      onChange={(e) =>
        onChange({
          ...filters,
          status: e.target.value === 'ALL' ? null : (e.target.value as StockStatus),
        })
      }
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
    </div>
  );
}
