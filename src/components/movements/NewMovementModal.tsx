'use client';

import { useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import type { InventoryMovementInput, InventoryRow, MovementType } from '@/types/inventory';
import formStyles from '@/components/ui/formInputs.module.css';

interface NewMovementModalProps {
  rows: InventoryRow[];
  onClose: () => void;
  onSubmit: (input: InventoryMovementInput) => Promise<void>;
}

const TYPE_OPTIONS: { value: MovementType; label: string }[] = [
  { value: 'ENTRADA', label: 'Entrada' },
  { value: 'SALIDA', label: 'Salida' },
  { value: 'AJUSTE', label: 'Ajuste' },
];

export default function NewMovementModal({ rows, onClose, onSubmit }: NewMovementModalProps) {
  // Solo artículos con registro de inventario pueden tener movimientos
  const eligibleRows = useMemo(() => rows.filter((r) => r.inventory !== null), [rows]);

  const [itemId, setItemId] = useState(eligibleRows[0]?.item.id ?? '');
  const [movementType, setMovementType] = useState<MovementType>('ENTRADA');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedRow = eligibleRows.find((r) => r.item.id === itemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedRow || !selectedRow.inventory) {
      setError('Selecciona un artículo válido.');
      return;
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError('La cantidad debe ser mayor que cero.');
      return;
    }
    if (!reason.trim()) {
      setError('El motivo es obligatorio.');
      return;
    }

    if (movementType === 'SALIDA' && selectedRow.inventory && qty > selectedRow.inventory.quantity) {
      setError(`Stock insuficiente. Disponible: ${selectedRow.inventory.quantity}.`);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        item_id: selectedRow.item.id,
        inventory_id: selectedRow.inventory.id,
        movement_type: movementType,
        quantity: qty,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  if (eligibleRows.length === 0) {
    return (
      <Modal title="Nuevo movimiento" onClose={onClose} width={480}>
        <p style={{ fontSize: 13.5, color: 'var(--color-text-secondary)' }}>
          No hay artículos con registro de inventario. Primero crea un registro de inventario
          desde la sección &quot;Inventario&quot;.
        </p>
      </Modal>
    );
  }

  return (
    <Modal title="Nuevo movimiento" onClose={onClose} width={480}>
      <form className={formStyles.form} onSubmit={handleSubmit}>
        <FormField label="Artículo" required>
          <select
            className={formStyles.select}
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
          >
            {eligibleRows.map((row) => (
              <option key={row.item.id} value={row.item.id}>
                {row.item.sku} — {row.item.name} (stock: {row.inventory?.quantity})
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Tipo" required>
          <div className={formStyles.radioGroup}>
            {TYPE_OPTIONS.map((opt) => (
              <label key={opt.value} className={formStyles.radioOption}>
                <input
                  type="radio"
                  name="movement_type"
                  value={opt.value}
                  checked={movementType === opt.value}
                  onChange={() => setMovementType(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </FormField>

        <FormField
            label={movementType === 'AJUSTE' ? 'Cantidad a ajustar (se suma al stock)' : 'Cantidad'}
          required
        >
          <input
            type="number"
            min={1}
            className={formStyles.input}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </FormField>

        <FormField label="Motivo" required>
          <input
            className={formStyles.input}
            placeholder="Ej. Compra de mercadería"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </FormField>

        <FormField label="Notas">
          <textarea
            className={formStyles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormField>

        {error && <p style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</p>}

        <div className={formStyles.formActions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Crear movimiento
          </Button>
        </div>
      </form>
    </Modal>
  );
}
