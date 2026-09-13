'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import type { InventoryItem, InventoryRecord } from '@/types/inventory';
import formStyles from '@/components/ui/formInputs.module.css';

interface InventoryRecordModalProps {
  item: InventoryItem;
  record: InventoryRecord | null;
  onClose: () => void;
  onSubmit: (values: {
    quantity: number;
    location: string;
    min_stock: number;
    max_stock: number;
  }) => Promise<void>;
}

export default function InventoryRecordModal({
  item,
  record,
  onClose,
  onSubmit,
}: InventoryRecordModalProps) {
  const [quantity, setQuantity] = useState(record?.quantity.toString() ?? '0');
  const [location, setLocation] = useState(record?.location ?? '');
  const [minStock, setMinStock] = useState(record?.min_stock.toString() ?? '0');
  const [maxStock, setMaxStock] = useState(record?.max_stock.toString() ?? '0');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const q = Number(quantity);
    const min = Number(minStock);
    const max = Number(maxStock);

    if (!record && q < 0) {
      setError('Las cantidades no pueden ser negativas.');
      return;
    }
    if (min < 0 || max < 0) {
      setError('Las cantidades no pueden ser negativas.');
      return;
    }
    if (max < min) {
      setError('El stock máximo debe ser mayor o igual al stock mínimo.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ quantity: q, location: location.trim(), min_stock: min, max_stock: max });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={record ? `Editar inventario — ${item.name}` : `Registrar inventario — ${item.name}`}
      onClose={onClose}
      width={480}
    >
      <form className={formStyles.form} onSubmit={handleSubmit}>
        <div className={formStyles.row2}>
          <FormField label="SKU">
            <input className={formStyles.input} value={item.sku} disabled />
          </FormField>
          <FormField label="Ubicación">
            <input
              className={formStyles.input}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Stock actual" required>
          <input
            type="number"
            className={formStyles.input}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={!!record}
          />
          {record && (
            <p className={formStyles.hint}>
              El stock solo cambia al aprobar un movimiento de entrada, salida o ajuste.
            </p>
          )}
        </FormField>

        <div className={formStyles.row2}>
          <FormField label="Stock mínimo" required>
            <input
              type="number"
              className={formStyles.input}
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
            />
          </FormField>
          <FormField label="Stock máximo" required>
            <input
              type="number"
              className={formStyles.input}
              value={maxStock}
              onChange={(e) => setMaxStock(e.target.value)}
            />
          </FormField>
        </div>

        {error && <p style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</p>}

        <div className={formStyles.formActions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
