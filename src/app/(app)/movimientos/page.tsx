'use client';

import { useEffect, useState } from 'react';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/StateView';
import { ToastContainer, useToasts } from '@/components/ui/Toast';
import MovementsTable from '@/components/movements/MovementsTable';
import NewMovementModal from '@/components/movements/NewMovementModal';
import { useAuth } from '@/lib/auth-context';
import { getInventoryRows } from '@/services/inventoryService';
import {
  approveMovement,
  createMovement,
  getMovements,
  rejectMovement,
} from '@/services/movementService';
import type { InventoryMovementInput, InventoryRow, MovementRow } from '@/types/inventory';

export default function MovimientosPage() {
  const { isAdmin } = useAuth();
  const [movements, setMovements] = useState<MovementRow[] | null>(null);
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toasts, showToast, dismissToast } = useToasts();

  const reload = async () => {
    try {
      const [movementRows, inventoryRows] = await Promise.all([getMovements(), getInventoryRows()]);
      setMovements(movementRows);
      setRows(inventoryRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const handleCreate = async (input: InventoryMovementInput) => {
    await createMovement(input);
    setShowNewModal(false);
    showToast('success', 'Movimiento creado. Queda pendiente de aprobación.');
    await reload();
  };

  const handleApprove = async (movement: MovementRow) => {
    setProcessingId(movement.id);
    try {
      await approveMovement(movement.id);
      showToast('success', 'Movimiento aprobado. Stock actualizado.');
      await reload();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'No se pudo aprobar el movimiento.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (movement: MovementRow) => {
    setProcessingId(movement.id);
    try {
      await rejectMovement(movement.id);
      showToast('success', 'Movimiento rechazado.');
      await reload();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'No se pudo rechazar el movimiento.');
    } finally {
      setProcessingId(null);
    }
  };

  if (error) return <ErrorState message={error} />;
  if (!movements) return <LoadingState label="Cargando movimientos…" />;

  return (
    <div>
      <Panel action={<Button onClick={() => setShowNewModal(true)}>+ Nuevo movimiento</Button>}>
        <MovementsTable
          movements={movements}
          onApprove={handleApprove}
          onReject={handleReject}
          processingId={processingId}
          canModerate={isAdmin}
        />
      </Panel>

      {showNewModal && (
        <NewMovementModal
          rows={rows}
          onClose={() => setShowNewModal(false)}
          onSubmit={handleCreate}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}