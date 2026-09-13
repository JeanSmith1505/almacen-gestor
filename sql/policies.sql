BEGIN;

-- =========================================================
-- 1. ACTIVAR RLS
-- =========================================================

ALTER TABLE public.roles
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inventory_items
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inventory
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inventory_movements
ENABLE ROW LEVEL SECURITY;


-- =========================================================
-- 2. PERMISOS PARA authenticated
-- =========================================================

-- ---------------------------------------------------------
-- ROLES
-- ---------------------------------------------------------

GRANT SELECT
ON public.roles
TO authenticated;


-- ---------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------

GRANT SELECT
ON public.profiles
TO authenticated;


-- ---------------------------------------------------------
-- INVENTORY ITEMS
-- ---------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.inventory_items
TO authenticated;


-- ---------------------------------------------------------
-- INVENTORY
-- ---------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.inventory
TO authenticated;


-- ---------------------------------------------------------
-- INVENTORY MOVEMENTS
-- ---------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.inventory_movements
TO authenticated;


-- =========================================================
-- 3. POLICIES: ROLES
-- =========================================================

CREATE POLICY "authenticated_can_read_roles"
ON public.roles
FOR SELECT
TO authenticated
USING (true);


-- =========================================================
-- 4. POLICIES: PROFILES
-- =========================================================

CREATE POLICY "users_can_read_own_profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
    OR public.is_admin()
);


-- =========================================================
-- 5. POLICIES: INVENTORY ITEMS
-- =========================================================
-- USER y ADMIN tienen CRUD completo.

CREATE POLICY "authenticated_can_select_items"
ON public.inventory_items
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY "authenticated_can_insert_items"
ON public.inventory_items
FOR INSERT
TO authenticated
WITH CHECK (true);


CREATE POLICY "authenticated_can_update_items"
ON public.inventory_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);


CREATE POLICY "authenticated_can_delete_items"
ON public.inventory_items
FOR DELETE
TO authenticated
USING (true);


-- =========================================================
-- 6. POLICIES: INVENTORY
-- =========================================================

-- ---------------------------------------------------------
-- SELECT
-- ---------------------------------------------------------

CREATE POLICY "authenticated_can_select_inventory"
ON public.inventory
FOR SELECT
TO authenticated
USING (true);


-- ---------------------------------------------------------
-- INSERT
-- ---------------------------------------------------------
-- Cualquier usuario autenticado puede crear un registro
-- de inventario.

CREATE POLICY "authenticated_can_insert_inventory"
ON public.inventory
FOR INSERT
TO authenticated
WITH CHECK (true);


-- ---------------------------------------------------------
-- UPDATE
-- ---------------------------------------------------------
--
-- ADMIN:
-- Puede modificar cualquier campo.
--
-- USER:
-- Puede modificar información del inventario,
-- pero NO puede modificar quantity.
--
-- Esto evita saltarse el workflow de aprobación.
-- ---------------------------------------------------------

CREATE POLICY "authenticated_can_update_inventory"
ON public.inventory
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
    public.is_admin()
    OR quantity = (
        SELECT i.quantity
        FROM public.inventory AS i
        WHERE i.id = inventory.id
    )
);


-- ---------------------------------------------------------
-- DELETE
-- ---------------------------------------------------------
--
-- Se permite CRUD sobre inventory según el requisito.
--
-- Las FK impiden eliminar un registro que tenga
-- movimientos asociados.
-- ---------------------------------------------------------

CREATE POLICY "authenticated_can_delete_inventory"
ON public.inventory
FOR DELETE
TO authenticated
USING (true);


-- =========================================================
-- 7. POLICIES: INVENTORY MOVEMENTS
-- =========================================================

-- ---------------------------------------------------------
-- SELECT
-- ---------------------------------------------------------
-- USER y ADMIN pueden consultar movimientos.

CREATE POLICY "authenticated_can_select_movements"
ON public.inventory_movements
FOR SELECT
TO authenticated
USING (true);


-- ---------------------------------------------------------
-- INSERT
-- ---------------------------------------------------------
-- Todo movimiento nuevo debe comenzar como PENDIENTE.
--
-- Nadie puede crear directamente un movimiento APROBADO
-- o RECHAZADO.

CREATE POLICY "authenticated_can_insert_movements"
ON public.inventory_movements
FOR INSERT
TO authenticated
WITH CHECK (
    status = 'PENDIENTE'
);


-- ---------------------------------------------------------
-- UPDATE
-- ---------------------------------------------------------
--
-- USER:
--     Solo puede actualizar movimientos PENDIENTES.
--
-- ADMIN:
--     Puede actualizar movimientos.
--
-- Un USER no puede cambiar PENDIENTE -> APROBADO.
-- Un USER no puede cambiar PENDIENTE -> RECHAZADO.
--
-- La aprobación/rechazo se realiza mediante las funciones
-- correspondientes.
-- ---------------------------------------------------------

CREATE POLICY "authenticated_can_update_movements"
ON public.inventory_movements
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
    OR status = 'PENDIENTE'
)
WITH CHECK (
    public.is_admin()
    OR status = 'PENDIENTE'
);


-- ---------------------------------------------------------
-- DELETE
-- ---------------------------------------------------------
--
-- Solo se pueden eliminar movimientos PENDIENTES.
--
-- Los movimientos APROBADOS o RECHAZADOS quedan como
-- historial y no pueden eliminarse.
-- ---------------------------------------------------------

CREATE POLICY "authenticated_can_delete_pending_movements"
ON public.inventory_movements
FOR DELETE
TO authenticated
USING (
    status = 'PENDIENTE'
);


-- =========================================================
-- 8. FUNCIONES DE APROBACIÓN / RECHAZO
-- =========================================================
--
-- Las funciones son SECURITY DEFINER porque necesitan
-- ejecutar la operación controlada sobre el stock.
--
-- La propia función comprueba que auth.uid() sea ADMIN.
-- =========================================================

GRANT EXECUTE
ON FUNCTION public.approve_inventory_movement(uuid)
TO authenticated;


GRANT EXECUTE
ON FUNCTION public.reject_inventory_movement(uuid, text)
TO authenticated;


COMMIT;