'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import type { InventoryItem, InventoryItemInput } from '@/types/inventory';
import formStyles from '@/components/ui/formInputs.module.css';

interface ItemFormModalProps {
  item?: InventoryItem;
  onClose: () => void;
  onSubmit: (input: InventoryItemInput) => Promise<void>;
}

type FormState = {
  sku: string;
  name: string;
  category: string;
  description: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  price: string;
  cost: string;
  supplier: string;
};

function toFormState(item?: InventoryItem): FormState {
  return {
    sku: item?.sku ?? '',
    name: item?.name ?? '',
    category: item?.category ?? '',
    description: item?.description ?? '',
    weight: item?.weight?.toString() ?? '',
    length: item?.length?.toString() ?? '',
    width: item?.width?.toString() ?? '',
    height: item?.height?.toString() ?? '',
    price: item?.price?.toString() ?? '',
    cost: item?.cost?.toString() ?? '',
    supplier: item?.supplier ?? '',
  };
}

export default function ItemFormModal({ item, onClose, onSubmit }: ItemFormModalProps) {
  const [form, setForm] = useState<FormState>(toFormState(item));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
  
    if (!form.sku.trim()) nextErrors.sku = 'El SKU es obligatorio.';
    if (!form.name.trim()) nextErrors.name = 'El nombre es obligatorio.';
  
    const numericFields: (keyof FormState)[] = [
      'weight', 'length', 'width', 'height', 'price', 'cost',
    ];
    numericFields.forEach((key) => {
      if (form[key] && Number(form[key]) < 0) {
        nextErrors[key] = 'No puede ser negativo.';
      }
    });
  
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
  
    setSubmitting(true);
    try {
      await onSubmit({
        sku: form.sku.trim(),
        name: form.name.trim(),
        category: form.category.trim() || null,
        description: form.description.trim() || null,
        weight: form.weight ? Number(form.weight) : null,
        length: form.length ? Number(form.length) : null,
        width: form.width ? Number(form.width) : null,
        height: form.height ? Number(form.height) : null,
        price: form.price ? Number(form.price) : null,
        cost: form.cost ? Number(form.cost) : null,
        supplier: form.supplier.trim() || null,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={item ? 'Editar artículo' : 'Crear artículo'} onClose={onClose} width={620}>
      <form className={formStyles.form} onSubmit={handleSubmit}>
        <div className={formStyles.row2}>
          <FormField label="SKU" required error={errors.sku}>
            <input
              className={formStyles.input}
              value={form.sku}
              onChange={(e) => setField('sku', e.target.value)}
            />
          </FormField>
          <FormField label="Nombre" required error={errors.name}>
            <input
              className={formStyles.input}
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          </FormField>
        </div>

        <div className={formStyles.row2}>
          <FormField label="Categoría">
            <input
              className={formStyles.input}
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
            />
          </FormField>
          <FormField label="Proveedor">
            <input
              className={formStyles.input}
              value={form.supplier}
              onChange={(e) => setField('supplier', e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Descripción">
          <textarea
            className={formStyles.textarea}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />
        </FormField>

        <div className={formStyles.row4}>
          <FormField label="Peso (kg)">
            <input
              type="number"
              step="0.01"
              className={formStyles.input}
              value={form.weight}
              onChange={(e) => setField('weight', e.target.value)}
            />
          </FormField>
          <FormField label="Largo (cm)">
            <input
              type="number"
              step="0.01"
              className={formStyles.input}
              value={form.length}
              onChange={(e) => setField('length', e.target.value)}
            />
          </FormField>
          <FormField label="Ancho (cm)">
            <input
              type="number"
              step="0.01"
              className={formStyles.input}
              value={form.width}
              onChange={(e) => setField('width', e.target.value)}
            />
          </FormField>
          <FormField label="Alto (cm)">
            <input
              type="number"
              step="0.01"
              className={formStyles.input}
              value={form.height}
              onChange={(e) => setField('height', e.target.value)}
            />
          </FormField>
        </div>

        <div className={formStyles.row2}>
          <FormField label="Precio" error={errors.price}>
            <input
              type="number"
              step="0.01"
              className={formStyles.input}
              value={form.price}
              onChange={(e) => setField('price', e.target.value)}
            />
          </FormField>
          <FormField label="Costo" error={errors.cost}>
            <input
              type="number"
              step="0.01"
              className={formStyles.input}
              value={form.cost}
              onChange={(e) => setField('cost', e.target.value)}
            />
          </FormField>
        </div>

        {submitError && <p style={{ color: 'var(--color-danger)', fontSize: 13 }}>{submitError}</p>}

        <div className={formStyles.formActions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            {item ? 'Guardar cambios' : 'Crear artículo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
