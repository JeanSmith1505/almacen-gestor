BEGIN;

WITH input(sku, name, supplier, quantity, movement_type, movement_quantity, location, status, category, min_stock, movement_date) AS (
  VALUES
    ('ZAP-001','Nike Air Max 90','Proveedor Andino',120,'ENTRADA',30,'Almacen A','PENDIENTE','Running',15,'2026-09-08'),
    ('ZAP-002','Adidas Runfalcon 3','Importadora Lima',85,'ENTRADA',50,'Almacen A','APROBADO','Running',10,'2026-09-08'),
    ('ZAP-003','Puma Smash v2','Sport House',60,'SALIDA',12,'Bodega B','APROBADO','Casual',8,'2026-09-07'),
    ('ZAP-004','Converse Chuck Taylor','Proveedor Andino',45,'SALIDA',8,'Bodega B','PENDIENTE','Casual',5,'2026-09-07'),
    ('ZAP-005','New Balance 574','Importadora Lima',70,'ENTRADA',40,'Almacen A','APROBADO','Lifestyle',10,'2026-09-06'),
    ('ZAP-006','Vans Old Skool','Sport House',55,'SALIDA',15,'Bodega C','PENDIENTE','Casual',7,'2026-09-06'),
    ('ZAP-007','Nike Revolution 7','Nike Peru',90,'ENTRADA',60,'Almacen A','APROBADO','Running',12,'2026-09-05'),
    ('ZAP-008','Adidas Superstar','Adidas Peru',35,'SALIDA',10,'Bodega B','RECHAZADO','Casual',6,'2026-09-05'),
    ('ZAP-009','Reebok Club C 85','Importadora Lima',48,'ENTRADA',30,'Almacen A','PENDIENTE','Casual',6,'2026-09-04'),
    ('ZAP-010','Asics Gel Contend','Sport House',25,'SALIDA',5,'Bodega C','APROBADO','Running',5,'2026-09-04'),
    ('ZAP-011','Fila Disruptor II','Proveedor Andino',32,'ENTRADA',25,'Almacen A','APROBADO','Lifestyle',5,'2026-09-03'),
    ('ZAP-012','Under Armour Charged','Importadora Lima',18,'SALIDA',7,'Bodega B','PENDIENTE','Running',4,'2026-09-03'),
    ('ZAP-013','Nike Court Vision','Nike Peru',52,'ENTRADA',20,'Almacen A','APROBADO','Casual',7,'2026-09-02'),
    ('ZAP-014','Puma Future Rider','Sport House',20,'SALIDA',4,'Bodega C','PENDIENTE','Lifestyle',5,'2026-09-01'),
    ('ZAP-015','New Balance Fresh Foam','Importadora Lima',15,'ENTRADA',35,'Almacen A','PENDIENTE','Running',4,'2026-08-31'),
    ('ZAP-016','Vans Authentic','Sport House',40,'SALIDA',9,'Bodega B','APROBADO','Casual',6,'2026-08-30'),
    ('ZAP-017','Adidas Ultraboost','Adidas Peru',22,'ENTRADA',18,'Almacen A','PENDIENTE','Running',5,'2026-08-29'),
    ('ZAP-018','Converse Run Star','Proveedor Andino',27,'SALIDA',6,'Bodega C','RECHAZADO','Lifestyle',5,'2026-08-28'),
    ('ZAP-019','Nike Pegasus','Nike Peru',8,'ENTRADA',25,'Almacen A','APROBADO','Running',10,'2026-08-27'),
    ('ZAP-020','Puma Suede Classic','Sport House',95,'SALIDA',20,'Bodega B','PENDIENTE','Casual',12,'2026-08-26')
), inserted_items AS (
  INSERT INTO public.inventory_items (sku, name, category, supplier)
  SELECT sku, name, category, supplier
  FROM input
  RETURNING id, sku
), inserted_inventory AS (
  INSERT INTO public.inventory (item_id, quantity, location, min_stock, max_stock)
  SELECT ii.id, i.quantity, i.location, i.min_stock, GREATEST(i.quantity, i.min_stock)
  FROM input i
  JOIN inserted_items ii ON ii.sku = i.sku
  RETURNING id, item_id
)
INSERT INTO public.inventory_movements (
  item_id,
  inventory_id,
  movement_type,
  quantity,
  status,
  created_at
)
SELECT
  ii.id,
  inv.id,
  i.movement_type,
  i.movement_quantity,
  i.status,
  i.movement_date::date::timestamptz
FROM input i
JOIN inserted_items ii ON ii.sku = i.sku
JOIN inserted_inventory inv ON inv.item_id = ii.id;

COMMIT;