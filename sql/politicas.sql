-- =========================================================
-- Row Level Security
-- Prueba técnica sin autenticación: se habilita RLS y se
-- otorga acceso a través del rol 'anon' (clave pública),
-- que es el único que el frontend puede usar.
--
-- Si más adelante se agrega Supabase Auth, reemplazar las
-- policies "anon" por policies basadas en auth.uid() /
-- auth.role() = 'authenticated', y mover las operaciones
-- de escritura sensibles (aprobar/rechazar) a rutas server-side
-- con el service_role, nunca expuestas al navegador.
-- =========================================================

alter table inventory_items enable row level security;
alter table inventory enable row level security;
alter table inventory_movements enable row level security;

-- inventory_items: lectura y escritura pública (clave anon)
create policy "inventory_items_select" on inventory_items
  for select using (true);
create policy "inventory_items_insert" on inventory_items
  for insert with check (true);
create policy "inventory_items_update" on inventory_items
  for update using (true) with check (true);
create policy "inventory_items_delete" on inventory_items
  for delete using (true);

-- inventory
create policy "inventory_select" on inventory
  for select using (true);
create policy "inventory_insert" on inventory
  for insert with check (true);
create policy "inventory_update" on inventory
  for update using (true) with check (true);

-- inventory_movements: no se permite UPDATE directo desde el cliente;
-- aprobar/rechazar se hace exclusivamente vía RPC (security definer),
-- que corre con los privilegios del owner de la función.
create policy "inventory_movements_select" on inventory_movements
  for select using (true);
create policy "inventory_movements_insert" on inventory_movements
  for insert with check (status = 'PENDIENTE' and approved_at is null);

grant execute on function approve_movement(uuid) to anon, authenticated;
grant execute on function reject_movement(uuid) to anon, authenticated;