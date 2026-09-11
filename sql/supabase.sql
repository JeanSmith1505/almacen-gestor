BEGIN;

-- =========================================================
-- 1. Función para actualizar updated_at automáticamente
-- =========================================================

CREATE OR REPLACE FUNCTION public.set_inventory_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- 2. Tabla inventory_items
-- =========================================================

CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  sku text NOT NULL,
  name text NOT NULL,
  description text,
  category text,

  weight numeric,
  length numeric,
  width numeric,
  height numeric,
  price numeric,
  cost numeric,

  supplier text,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT inventory_items_sku_key
    UNIQUE (sku),

  CONSTRAINT inventory_items_weight_nonnegative
    CHECK (weight IS NULL OR weight >= 0),

  CONSTRAINT inventory_items_length_nonnegative
    CHECK (length IS NULL OR length >= 0),

  CONSTRAINT inventory_items_width_nonnegative
    CHECK (width IS NULL OR width >= 0),

  CONSTRAINT inventory_items_height_nonnegative
    CHECK (height IS NULL OR height >= 0),

  CONSTRAINT inventory_items_price_nonnegative
    CHECK (price IS NULL OR price >= 0),

  CONSTRAINT inventory_items_cost_nonnegative
    CHECK (cost IS NULL OR cost >= 0)
);

COMMENT ON TABLE public.inventory_items IS
  'Catálogo principal de artículos del inventario';

-- =========================================================
-- 3. Tabla inventory
-- =========================================================

CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  item_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  location text,
  min_stock integer NOT NULL DEFAULT 0,
  max_stock integer NOT NULL,

  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT inventory_item_id_key
    UNIQUE (item_id),

  CONSTRAINT inventory_quantity_nonnegative
    CHECK (quantity >= 0),

  CONSTRAINT inventory_min_stock_nonnegative
    CHECK (min_stock >= 0),

  CONSTRAINT inventory_max_stock_valid
    CHECK (max_stock >= min_stock),

  CONSTRAINT inventory_item_id_fkey
    FOREIGN KEY (item_id)
    REFERENCES public.inventory_items (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT inventory_id_item_id_key
    UNIQUE (id, item_id)
);

COMMENT ON TABLE public.inventory IS
  'Existencia actual y configuración de stock por artículo';

-- =========================================================
-- 4. Tabla inventory_movements
-- =========================================================

CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  item_id uuid NOT NULL,
  inventory_id uuid NOT NULL,

  movement_type text NOT NULL,
  quantity integer NOT NULL,

  reason text,
  status text NOT NULL DEFAULT 'PENDIENTE',

  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  notes text,

  CONSTRAINT inventory_movements_quantity_positive
    CHECK (quantity > 0),

  CONSTRAINT inventory_movements_type_check
    CHECK (movement_type IN ('ENTRADA', 'SALIDA', 'AJUSTE')),

  CONSTRAINT inventory_movements_status_check
    CHECK (status IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),

  CONSTRAINT inventory_movements_item_id_fkey
    FOREIGN KEY (item_id)
    REFERENCES public.inventory_items (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT inventory_movements_inventory_id_fkey
    FOREIGN KEY (inventory_id)
    REFERENCES public.inventory (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  /*
   * Garantiza que el item_id del movimiento corresponda
   * al mismo artículo de su registro de inventory.
   */
  CONSTRAINT inventory_movements_inventory_item_fkey
    FOREIGN KEY (inventory_id, item_id)
    REFERENCES public.inventory (id, item_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

COMMENT ON TABLE public.inventory_movements IS
  'Historial de entradas, salidas y ajustes de inventario';

-- =========================================================
-- 5. Trigger de updated_at
-- =========================================================

CREATE TRIGGER inventory_set_updated_at
BEFORE UPDATE ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.set_inventory_updated_at();

-- =========================================================
-- 6. Índices
-- =========================================================

-- inventory.item_id ya está indexado por inventory_item_id_key,
-- que además garantiza la relación 1:1.

-- inventory_items.sku ya está indexado por inventory_items_sku_key,
-- que además garantiza que el SKU sea único.

CREATE INDEX inventory_movements_item_id_idx
  ON public.inventory_movements (item_id);

CREATE INDEX inventory_movements_inventory_id_idx
  ON public.inventory_movements (inventory_id);

CREATE INDEX inventory_movements_created_at_idx
  ON public.inventory_movements (created_at);

CREATE INDEX inventory_movements_status_idx
  ON public.inventory_movements (status);

CREATE INDEX inventory_items_category_idx
  ON public.inventory_items (category);

CREATE INDEX inventory_items_supplier_idx
  ON public.inventory_items (supplier);

-- =========================================================
-- 7. Row Level Security
-- =========================================================

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 8. Permisos para el frontend autenticado
-- =========================================================

GRANT SELECT, INSERT, UPDATE
ON TABLE public.inventory_items
TO authenticated;

GRANT SELECT, INSERT, UPDATE
ON TABLE public.inventory
TO authenticated;

GRANT SELECT, INSERT, UPDATE
ON TABLE public.inventory_movements
TO authenticated;

-- No se conceden permisos DELETE a authenticated.
-- service_role conserva su comportamiento administrativo
-- y no debe exponerse en el frontend.

-- =========================================================
-- 9. Policies para inventory_items
-- =========================================================

CREATE POLICY inventory_items_authenticated_select
ON public.inventory_items
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY inventory_items_authenticated_insert
ON public.inventory_items
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY inventory_items_authenticated_update
ON public.inventory_items
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL)
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- =========================================================
-- 10. Policies para inventory
-- =========================================================

CREATE POLICY inventory_authenticated_select
ON public.inventory
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY inventory_authenticated_insert
ON public.inventory
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY inventory_authenticated_update
ON public.inventory
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL)
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- =========================================================
-- 11. Policies para inventory_movements
-- =========================================================

CREATE POLICY inventory_movements_authenticated_select
ON public.inventory_movements
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY inventory_movements_authenticated_insert
ON public.inventory_movements
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY inventory_movements_authenticated_update
ON public.inventory_movements
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL)
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

COMMIT;