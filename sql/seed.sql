-- =========================================================
-- Datos de prueba
-- =========================================================

insert into inventory_items (id, sku, name, description, category, weight, length, width, height, price, cost, supplier)
values
  ('11111111-1111-1111-1111-111111111101', 'ELE-001', 'Mouse inalámbrico',        'Mouse óptico inalámbrico 2.4GHz', 'Electrónica', 0.12, 11, 6, 4,   25.90, 14.50, 'TechSupply SAC'),
  ('11111111-1111-1111-1111-111111111102', 'ELE-002', 'Teclado mecánico',          'Teclado mecánico switches rojos', 'Electrónica', 0.95, 44, 13, 3.5, 149.90, 95.00, 'TechSupply SAC'),
  ('11111111-1111-1111-1111-111111111103', 'ELE-003', 'Monitor 24"',               'Monitor LED Full HD 24 pulgadas', 'Electrónica', 3.60, 54, 20, 40,  649.00, 480.00, 'Distribuidora Andina'),
  ('11111111-1111-1111-1111-111111111104', 'OFI-001', 'Silla ergonómica',          'Silla de oficina con soporte lumbar', 'Mobiliario', 14.00, 65, 65, 115, 459.00, 310.00, 'Muebles del Sur'),
  ('11111111-1111-1111-1111-111111111105', 'OFI-002', 'Escritorio ajustable',      'Escritorio con altura regulable', 'Mobiliario', 32.00, 140, 70, 75,  899.00, 640.00, 'Muebles del Sur'),
  ('11111111-1111-1111-1111-111111111106', 'PAP-001', 'Resma de papel A4',         'Papel bond 75g, 500 hojas', 'Papelería', 2.50, 30, 21, 5,       15.50, 9.80, 'Papelería Central'),
  ('11111111-1111-1111-1111-111111111107', 'PAP-002', 'Caja de lapiceros',         'Caja x50 lapiceros tinta azul', 'Papelería', 1.10, 20, 15, 10,     22.00, 12.00, 'Papelería Central'),
  ('11111111-1111-1111-1111-111111111108', 'ELE-004', 'Webcam Full HD',            'Webcam 1080p con micrófono', 'Electrónica', 0.18, 9, 6, 6,        79.90, 48.00, 'Distribuidora Andina'),
  ('11111111-1111-1111-1111-111111111109', 'LIM-001', 'Desinfectante multiusos',   'Desinfectante 1L aroma cítrico', 'Limpieza', 1.05, 8, 8, 24,       12.90, 7.20, 'Insumos Higiene EIRL'),
  ('11111111-1111-1111-1111-111111111110', 'ELE-005', 'Disco SSD 1TB',             'SSD NVMe M.2 1TB', 'Electrónica', 0.05, 8, 2.2, 0.3,             289.00, 210.00, 'TechSupply SAC')
on conflict (sku) do nothing;

insert into inventory (item_id, quantity, location, min_stock, max_stock)
values
  ('11111111-1111-1111-1111-111111111101', 120, 'Almacén A - Estante 1', 20, 200),
  ('11111111-1111-1111-1111-111111111102', 8,   'Almacén A - Estante 2', 10, 80),
  ('11111111-1111-1111-1111-111111111103', 15,  'Almacén B - Estante 1', 5,  50),
  ('11111111-1111-1111-1111-111111111104', 0,   'Almacén B - Estante 3', 5,  30),
  ('11111111-1111-1111-1111-111111111105', 12,  'Almacén B - Estante 3', 4,  25),
  ('11111111-1111-1111-1111-111111111106', 300, 'Almacén C - Estante 1', 50, 500),
  ('11111111-1111-1111-1111-111111111107', 40,  'Almacén C - Estante 1', 15, 100),
  ('11111111-1111-1111-1111-111111111108', 25,  'Almacén A - Estante 4', 10, 60),
  ('11111111-1111-1111-1111-111111111109', 60,  'Almacén C - Estante 2', 20, 150),
  ('11111111-1111-1111-1111-111111111110', 3,   'Almacén A - Estante 5', 5,  40)
on conflict (item_id) do nothing;

-- Movimientos de ejemplo (usando subconsultas para obtener inventory_id real)
insert into inventory_movements (item_id, inventory_id, movement_type, quantity, reason, status, approved_at, notes)
select
  i.item_id, i.id, 'ENTRADA', 50, 'Compra de mercadería', 'APROBADO', now() - interval '5 days', 'Ingreso inicial de stock'
from inventory i where i.item_id = '11111111-1111-1111-1111-111111111101';

insert into inventory_movements (item_id, inventory_id, movement_type, quantity, reason, status, approved_at, notes)
select
  i.item_id, i.id, 'SALIDA', 5, 'Venta a cliente', 'APROBADO', now() - interval '3 days', null
from inventory i where i.item_id = '11111111-1111-1111-1111-111111111102';

insert into inventory_movements (item_id, inventory_id, movement_type, quantity, reason, status, approved_at, notes)
select
  i.item_id, i.id, 'SALIDA', 10, 'Pedido pendiente de revisión', 'PENDIENTE', null, 'Confirmar con almacén'
from inventory i where i.item_id = '11111111-1111-1111-1111-111111111103';

insert into inventory_movements (item_id, inventory_id, movement_type, quantity, reason, status, approved_at, notes)
select
  i.item_id, i.id, 'ENTRADA', 20, 'Reposición de stock', 'PENDIENTE', null, null
from inventory i where i.item_id = '11111111-1111-1111-1111-111111111104';

insert into inventory_movements (item_id, inventory_id, movement_type, quantity, reason, status, approved_at, notes)
select
  i.item_id, i.id, 'SALIDA', 100, 'Solicitud excesiva', 'RECHAZADO', null, 'No hay stock suficiente disponible'
from inventory i where i.item_id = '11111111-1111-1111-1111-111111111106';

insert into inventory_movements (item_id, inventory_id, movement_type, quantity, reason, status, approved_at, notes)
select
  i.item_id, i.id, 'AJUSTE', 2, 'Ajuste por inventario físico', 'PENDIENTE', null, 'Diferencia detectada en conteo'
from inventory i where i.item_id = '11111111-1111-1111-1111-111111111110';

insert into inventory_movements (item_id, inventory_id, movement_type, quantity, reason, status, approved_at, notes)
select
  i.item_id, i.id, 'ENTRADA', 15, 'Compra de mercadería', 'APROBADO', now() - interval '1 day', null
from inventory i where i.item_id = '11111111-1111-1111-1111-111111111108';