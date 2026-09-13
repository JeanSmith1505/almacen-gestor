# InvenTrack — Sistema de Gestión de Inventario

Prueba técnica para puesto de practicante: aplicación web de gestión de inventario conectada en tiempo real a Supabase/PostgreSQL.

---

## 1. Descripción del proyecto

InvenTrack permite administrar el catálogo de artículos de un almacén, su stock actual y el historial de movimientos (entradas, salidas y ajustes), con un workflow de aprobación en dos pasos: cualquier usuario autenticado puede **crear** un movimiento, pero solo un **administrador** puede **aprobarlo o rechazarlo**. El stock nunca cambia hasta que el movimiento es aprobado.

Todas las operaciones (crear, editar, eliminar, aprobar, rechazar) persisten realmente en Supabase — no hay datos mockeados ni `localStorage` como fuente de información.

//Datos de prueba admin/user ---> xdeadpi123@gmail.com / xdeadpipi@gmail.com 
//Password en ambos: 123456
---

## 2. Tecnologías utilizadas

- **Next.js** (App Router)
- **CSS Modules** para todos los estilos (sin Tailwind, sin shadcn/ui)
- **Supabase** (Auth + PostgreSQL + Row Level Security)
- **`@supabase/supabase-js`** para la comunicación cliente-backend
- Sin librerías de estado global (Redux, Zustand, etc.) — solo `useState`/`useContext`

---

## 3. Arquitectura

```
app/
├── page.tsx                 # Login (sin modo invitado)
├── (app)/
│   ├── layout.tsx           # Sidebar + Header + AuthProvider
│   ├── dashboard/page.tsx   # KPIs, stock crítico, movimientos recientes
│   ├── items/page.tsx       # CRUD de artículos
│   ├── inventario/page.tsx  # Stock, ubicación, mínimos/máximos
│   └── movimientos/page.tsx # Crear / aprobar / rechazar movimientos

components/                  # Presentación pura (sin lógica de datos)
├── dashboard/  items/  inventory/  movements/  layout/  ui/

services/                    # Único punto de acceso a Supabase
├── itemService.ts
├── inventoryService.ts
└── movementService.ts

lib/
├── supabase.ts               # Cliente único de Supabase
├── auth-context.tsx           # Sesión + rol (isAdmin vía RPC is_admin())
└── format.ts

types/
└── inventory.ts               # Tipos + helpers de dominio (status, filtros)
```

**Separación de responsabilidades:** los componentes de `components/` nunca llaman a Supabase directamente — siempre pasan por `services/`, que son los únicos módulos con `import { supabase }`. Los tipos y funciones de dominio (cálculo de estado de stock, filtrado) viven en `types/inventory.ts` para evitar lógica duplicada entre páginas.

---

## 4. Instalación

```bash
npm install
```

---

## 5. Variables de entorno

Crear un archivo `.env.local` en la raíz (no se sube a git):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-clave-anon-publica
```

> Tras crear o modificar `.env.local`, reiniciar `npm run dev` — Next.js no recarga variables de entorno en caliente.

---

## 6. Configuración de Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. Ejecutar `sql/schema.sql` en el SQL Editor (tablas, funciones, triggers).
3. Ejecutar `sql/policies.sql` (RLS, grants, políticas).
4. Ejecutar `sql/seed.sql` (datos inciales).
5. En **Authentication → Providers**, dejar habilitado Email/Password.
6. Los usuarios se crean **manualmente** desde el dashboard de Supabase (Authentication → Users → Add user). No existe autoregistro público en la aplicación.
7. Todo usuario nuevo comienza con rol `USER` (vía trigger `handle_new_user_profile`). Para ascender a `ADMIN`:
   ```sql
   UPDATE public.profiles
   SET role_id = (SELECT id FROM public.roles WHERE name = 'ADMIN')
   WHERE id = '<uuid-del-usuario>';
   ```
   o manualmente
---

## 7. Estructura de base de datos

### `inventory_items` — información maestra del artículo
`id, sku (UNIQUE), name, description, category, weight, length, width, height, price, cost, supplier, created_at`

### `inventory` — stock actual (1:1 con `inventory_items`)
`id, item_id (FK, UNIQUE), quantity, location, min_stock, max_stock, updated_at`

### `inventory_movements` — historial de movimientos (N:1 con `inventory`)
`id, item_id (FK), inventory_id (FK), movement_type, quantity, reason, status, created_at, approved_at, rejected_at, notes`

**Restricciones clave:** SKU único · cantidades, precio y costo no negativos · `max_stock >= min_stock` · `quantity` de movimiento `> 0` · `movement_type ∈ {ENTRADA, SALIDA, AJUSTE}` · `status ∈ {PENDIENTE, APROBADO, RECHAZADO}` · `ON DELETE RESTRICT` en las FKs de `inventory_movements`, para nunca dejar historial huérfano.

---

## 8. Relaciones entre tablas

```
inventory_items  1 ────── 1  inventory  1 ────── N  inventory_movements
```

Un artículo tiene como máximo un registro de inventario (`UNIQUE` en `inventory.item_id`), y ese registro puede tener muchos movimientos asociados. `inventory_movements` mantiene además una referencia directa a `item_id` (redundante mas no innecesaria: permite validar en una sola FK compuesta que `inventory_id` y `item_id` sean coherentes entre sí).

---

## 9. Ejecución local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`, iniciar sesión con un usuario creado en Supabase.

---

## 10. Funcionalidades implementadas

- **Dashboard:** KPIs (artículos, stock total, stock crítico, valor del inventario), lista de artículos en estado crítico y movimientos recientes.
- **Artículos:** listado con búsqueda (nombre/SKU) y filtros combinables (categoría, proveedor, estado de stock), crear, editar, eliminar (bloqueado por FK si tiene inventario/movimientos asociados, con mensaje claro).
- **Inventario:** ver stock por artículo, registrar inventario inicial, modificar ubicación/mínimo/máximo. La cantidad (`quantity`) **nunca** se edita directamente aquí — solo cambia al aprobar un movimiento.
- **Movimientos:** crear (ENTRADA/SALIDA/AJUSTE) con validación de stock disponible para salidas, listado con estado, motivo y artículo (vía join).
- Estados de carga, error, vacío y confirmación de borrado en todas las vistas.

---

## 11. Bonus implementado — Workflow de aprobación

Todo movimiento nace en estado `PENDIENTE` y **no** modifica el stock. Un administrador puede:

- **Aprobar** → ejecuta la función RPC `approve_inventory_movement(movement_id)`, que dentro de una única transacción en PostgreSQL bloquea (`FOR UPDATE`) el movimiento y el registro de inventario, calcula el nuevo stock, lo actualiza y marca el movimiento como `APROBADO`. Si el stock resultante sería negativo, la transacción completa se revierte.
- **Rechazar** → ejecuta `reject_inventory_movement(movement_id, reason)`. El stock permanece intacto y `approved_at` queda `NULL`.

Ambas funciones son `SECURITY DEFINER` y validan `is_admin()` internamente — un usuario `USER` que intente invocarlas directamente vía API recibe un error, independientemente de lo que muestre la UI.

**Semántica de `ENTRADA`/`SALIDA`/`AJUSTE` al aprobar:**
- `ENTRADA`: `stock += quantity`
- `SALIDA`: `stock -= quantity` (rechazada si el resultado sería negativo)
- `AJUSTE`: `stock += quantity` (mismo cálculo que `ENTRADA`; se decidió mantener `AJUSTE` como una cantidad positiva a sumar, no como un valor absoluto de reemplazo, para no relajar la restricción `quantity > 0` de la tabla. Un ajuste hacia abajo se modela como `SALIDA` con el motivo correspondiente).

---

## 12. Decisiones técnicas importantes

- **Aprobación vía RPC, no vía dos `UPDATE` desde el cliente.** Evita el escenario de actualizar `inventory` y que falle el `UPDATE` de `inventory_movements` (o viceversa), dejando el sistema inconsistente. Toda la operación vive en una sola transacción de PostgreSQL.
- **Protección de `quantity` a nivel de RLS, no de columna.** La policy de `UPDATE` sobre `inventory` permite el `UPDATE` únicamente si `quantity` no cambia (o si quien lo ejecuta es admin): `WITH CHECK (is_admin() OR quantity = quantity_actual)`. En el frontend, el tipo `Omit<InventoryRecordUpdate, 'quantity'>` impide además que se intente enviar ese campo desde la edición de inventario.
- **Sin autenticación anónima ni autoregistro público.** Los usuarios se aprovisionan manualmente en Supabase; la pantalla de login no ofrece "modo invitado" ni "crear cuenta", acorde al flujo real de uso previsto.
- **Rol resuelto contra la base, no inferido de la sesión.** `isAdmin` se obtiene llamando al RPC `is_admin()` (que consulta `profiles.role_id → roles.name`) cada vez que cambia la sesión, en vez de asumir que toda sesión activa es admin.
- **Normalización de relaciones 1:1 en PostgREST.** Al consultar `inventory_items` con `select('*, inventory(*)')`, PostgREST puede devolver la relación `inventory` como objeto plano o como array de un elemento, dependiendo de si detecta la relación como 1:1 (vía el `UNIQUE` en `item_id`). El servicio normaliza ambos casos con `Array.isArray()` para no depender de ese comportamiento.
- **Estado `SIN_INVENTARIO`.** Un artículo sin registro de inventario no se trata como `AGOTADO` (serían semánticamente distintos: uno nunca tuvo stock configurado, el otro sí y llegó a cero), lo cual evita ambigüedad en el dashboard y en los filtros.
- **`AJUSTE` como cantidad aditiva.** Ver punto 11 — decisión tomada para no relajar el `CHECK (quantity > 0)` de `inventory_movements`, manteniendo el modelo simple para el alcance de esta prueba.