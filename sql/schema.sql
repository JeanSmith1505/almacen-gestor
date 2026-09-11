-- =========================================================
-- Sistema de Gestión de Inventario - Esquema de Base de Datos
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 1. inventory_items — información maestra de artículos
-- ---------------------------------------------------------
create table if not exists inventory_items (
  id          uuid primary key default gen_random_uuid(),
  sku         text not null unique,
  name        text not null,
  description text,
  category    text,
  weight      numeric check (weight >= 0),
  length      numeric check (length >= 0),
  width       numeric check (width >= 0),
  height      numeric check (height >= 0),
  price       numeric not null default 0 check (price >= 0),
  cost        numeric not null default 0 check (cost >= 0),
  supplier    text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_inventory_items_category on inventory_items (category);
create index if not exists idx_inventory_items_supplier on inventory_items (supplier);

-- ---------------------------------------------------------
-- 2. inventory — stock actual (relación 1:1 con inventory_items)
-- ---------------------------------------------------------
create table if not exists inventory (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references inventory_items (id) on delete restrict,
  quantity   integer not null default 0 check (quantity >= 0),
  location   text,
  min_stock  integer not null default 0 check (min_stock >= 0),
  max_stock  integer not null default 0 check (max_stock >= 0),
  updated_at timestamptz not null default now(),
  constraint uq_inventory_item unique (item_id),
  constraint chk_max_gte_min check (max_stock >= min_stock)
);

-- ---------------------------------------------------------
-- 3. inventory_movements — historial de movimientos
-- ---------------------------------------------------------
create table if not exists inventory_movements (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid not null references inventory_items (id) on delete restrict,
  inventory_id  uuid not null references inventory (id) on delete restrict,
  movement_type text not null check (movement_type in ('ENTRADA', 'SALIDA', 'AJUSTE')),
  quantity      integer not null check (quantity > 0),
  reason        text,
  status        text not null default 'PENDIENTE' check (status in ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
  created_at    timestamptz not null default now(),
  approved_at   timestamptz,
  notes         text
);

create index if not exists idx_movements_item on inventory_movements (item_id);
create index if not exists idx_movements_status on inventory_movements (status);
create index if not exists idx_movements_created_at on inventory_movements (created_at desc);

-- Un movimiento aprobado siempre debe tener approved_at; uno pendiente/rechazado no.
alter table inventory_movements
  add constraint chk_approved_at_consistency check (
    (status = 'APROBADO' and approved_at is not null) or
    (status <> 'APROBADO' and approved_at is null)
  );

-- Mantener updated_at de inventory sincronizado en cada UPDATE directo
create or replace function set_inventory_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_inventory_updated_at on inventory;
create trigger trg_inventory_updated_at
  before update on inventory
  for each row
  execute function set_inventory_updated_at();

-- =========================================================
-- Función RPC: aprobar movimiento
-- Actualiza inventory y inventory_movements de forma atómica.
-- AJUSTE se trata como delta con signo: quantity puede
-- interpretarse junto con movement_type; aquí ENTRADA y AJUSTE
-- positivo suman, SALIDA resta. Para mantener 'quantity > 0'
-- como constraint, AJUSTE usa un parámetro adicional de dirección.
-- =========================================================
create or replace function approve_movement(p_movement_id uuid)
returns inventory_movements as $$
declare
  v_movement   inventory_movements%rowtype;
  v_inventory  inventory%rowtype;
  v_new_qty    integer;
begin
  select * into v_movement
  from inventory_movements
  where id = p_movement_id
  for update;

  if not found then
    raise exception 'Movimiento % no encontrado', p_movement_id;
  end if;

  if v_movement.status <> 'PENDIENTE' then
    raise exception 'El movimiento ya fue procesado (estado actual: %)', v_movement.status;
  end if;

  select * into v_inventory
  from inventory
  where id = v_movement.inventory_id
  for update;

  if not found then
    raise exception 'Registro de inventario % no encontrado', v_movement.inventory_id;
  end if;

  if v_movement.movement_type = 'ENTRADA' then
    v_new_qty := v_inventory.quantity + v_movement.quantity;
  elsif v_movement.movement_type = 'SALIDA' then
    v_new_qty := v_inventory.quantity - v_movement.quantity;
    if v_new_qty < 0 then
      raise exception 'Stock insuficiente: disponible %, solicitado %', v_inventory.quantity, v_movement.quantity;
    end if;
  elsif v_movement.movement_type = 'AJUSTE' then
    -- AJUSTE: quantity representa el nuevo stock absoluto.
    v_new_qty := v_movement.quantity;
  else
    raise exception 'Tipo de movimiento inválido: %', v_movement.movement_type;
  end if;

  update inventory
  set quantity = v_new_qty
  where id = v_inventory.id;

  update inventory_movements
  set status = 'APROBADO',
      approved_at = now()
  where id = v_movement.id
  returning * into v_movement;

  return v_movement;
end;
$$ language plpgsql security definer;

-- Función RPC: rechazar movimiento (no toca inventory)
create or replace function reject_movement(p_movement_id uuid)
returns inventory_movements as $$
declare
  v_movement inventory_movements%rowtype;
begin
  select * into v_movement
  from inventory_movements
  where id = p_movement_id
  for update;

  if not found then
    raise exception 'Movimiento % no encontrado', p_movement_id;
  end if;

  if v_movement.status <> 'PENDIENTE' then
    raise exception 'El movimiento ya fue procesado (estado actual: %)', v_movement.status;
  end if;

  update inventory_movements
  set status = 'RECHAZADO'
  where id = v_movement.id
  returning * into v_movement;

  return v_movement;
end;
$$ language plpgsql security definer;