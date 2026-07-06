---
trigger: always_on
---

# Especificación del Proyecto: Sistema de Gestión Logística para Turismo (TourFlow)

## 📌 Contexto del Proyecto

El objetivo es reemplazar un flujo de trabajo manual ineficiente basado en archivos de Microsoft Word y capturas de pantalla móviles. La aplicación será utilizada por **un único usuario administrador** (coordinador general) para programar, visualizar y gestionar la logística diaria de viajes y tours a futuro.

El sistema debe operar de forma centralizada en la computadora de escritorio (casa/oficina) y sincronizarse en tiempo real con su teléfono celular en ruta a través de capacidades móviles nativas.

## 🛠️ Stack Tecnológico Autorizado

- **Frontend Framework:** Next.js (App Router, React) optimizado para renderizado dinámico.
- **Estilos y UI:** Tailwind CSS + Shadcn/ui (para componentes interactivos y accesibles).
- **Base de Datos y Backend:** Supabase (PostgreSQL) con sincronización Realtime habilitada y Supabase Storage para archivos.
- **Capacidad Móvil:** Progressive Web App (PWA) utilizando `@ducanh2912/next-pwa` con soporte de lectura de datos Offline (Caché).
- **Despliegue/Hosting:** Vercel.

---

## 🗄️ Modelo de Datos (Esquema de Base de Datos - Supabase SQL)

El sistema operará bajo una arquitectura mono-usuario. Los encargados de ruta (Alex, Fausto, Gato, etc.) y los proveedores de servicios de transporte se manejarán como registros relacionales o etiquetas, no como usuarios con login.

### 1. Tabla: `colaboradores`

```sql
create table colaboradores (
  id uuid default gen_random_uuid() primary key,
  nombre text not null, -- Ejemplo: "Alex", "Fausto", "Gato"
  telefono text,
  activo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

```

### 2. Tabla: `proveedores`

```sql
create table proveedores (
  id uuid default gen_random_uuid() primary key,
  nombre text not null, -- Ejemplo: "Don Pedro Sayaxhe", "William 4x4"
  servicio text, -- Ejemplo: "Lancha", "Pick-up 4x4"
  telefono text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

```

### 3. Tabla: `plantillas_itinerario`

```sql
create table plantillas_itinerario (
  id uuid default gen_random_uuid() primary key,
  titulo text not null, -- Ejemplo: "Tour Semuc Champey"
  ruta_origen text not null, -- Ejemplo: "Cobán"
  ruta_destino text not null, -- Ejemplo: "Semuc"
  puntos_intermedios text[], -- Array de destinos intermedios
  hora_sugerida time, -- Ejemplo: "08:00:00"
  notas_predeterminadas text, -- Ejemplo: "Coordinar lancha o 4x4"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

```

### 4. Tabla: `servicios_diarios`

```sql
create table servicios_diarios (
  id uuid default gen_random_uuid() primary key,
  fecha date not null, -- Ejemplo: 2026-08-01
  hora time, -- Ejemplo: 21:30:00 o 08:00:00
  cliente_grupo text not null, -- Ejemplo: "Zimmerman Corine" o "Grupo Schanstra"
  pax_count integer not null default 1, -- Cantidad de pasajeros (X3, X4)
  ruta_origen text not null,
  ruta_destino text not null,
  logistica_transporte text, -- Ejemplo: "vuelo UA1551" o "vuelo tag de flores"
  colaborador_id uuid references colaboradores(id) on delete set null, -- Quién opera el tour
  proveedor_id uuid references proveedores(id) on delete set null, -- Proveedor externo involucrado
  monto_servicio numeric(10,2) default 0.00,
  estado_pago text check (estado_pago in ('Pendiente', 'Abono Parcial', 'Pagado Total')) default 'Pendiente',
  estado_ruta text check (estado_ruta in ('No Iniciado', 'En Ruta', 'Retrasado', 'Completado')) default 'No Iniciado',
  notas_adicionales text,
  comprobante_url text, -- URL pública del archivo en Supabase Storage
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

```

---

## 🎨 Especificaciones de Interfaz de Usuario (UI/UX)

La aplicación debe ser **totalmente responsiva**. En escritorio se priorizará la densidad de datos y la visualización macro; en dispositivos móviles se priorizará el acceso rápido con un solo dedo y la navegación vertical.

### Componentes de Shadcn/ui Mandatorios:

- `Calendar` / `Popover` para la gestión de fechas.
- `Dialog` (Modal) para el formulario de inserción y edición de registros rápidos.
- `Badge` para reflejar visualmente los códigos de color por Estado de Pago y Estado de Ruta.
- `Card` para la renderización de itinerarios en la vista móvil.
- `Tabs` para alternar entre vistas de Calendario, Dashboard e Historial.

---

## ⚡ Requerimientos Funcionales y Features Clave

### 1. Vista de Calendario Inteligente (Desktop Core)

- Renderizar una cuadrícula mensual/semanal donde cada celda muestre resúmenes de los servicios programados para ese día.
- Cada evento debe destacar visualmente el color asignado al colaborador en ruta y el estado de su pago (`Badge`).
- Al hacer clic en un día vacío, se abrirá un `Dialog` para crear un nuevo registro. Debe permitir precargar datos seleccionando una opción del catálogo de `plantillas_itinerario`.

### 2. Vista de Lista Optimizada (Mobile Core)

- Interfaz móvil tipo feed vertical cronológico.
- **Filtros rápidos en la cabecera:** Permitir filtrar la lista del día por "Colaborador Asignado" (ej: ver sólo lo de Alex) o por "Estado de Pago" (ver pendientes de cobro).

### 3. Botones de Acción Rápida Móviles (Integración con el Teléfono)

Dentro de la tarjeta de cada servicio en la vista móvil, incluir:

- **Botón WhatsApp Link:** Abre la API de WhatsApp Web/App con un mensaje formateado dinámicamente:
- _Texto:_ `"Hola [Cliente], te saludamos de TourFlow. Te recordamos que tu traslado programado para el día [Fecha] a las [Hora] con ruta [Origen] hacia [Destino] está listo. Tu encargado asignado es [Colaborador]. ¡Buen viaje!"`

- **Botón Teléfono Directo:** Un enlace `tel:[numero]` para marcar directamente al colaborador o proveedor asociado si se encuentra registrado en el sistema.

### 4. Módulo de Archivos Adjuntos (Fotos)

- Permitir cargar archivos de imagen (`.jpg`, `.png`) desde el formulario de creación/edición. Las imágenes se guardarán en un bucket público en Supabase Storage (`comprobantes-bucket`) y su enlace se asociará al registro del servicio diario.

### 5. Configuración PWA y Estrategia Offline

- Configurar el Service Worker para almacenar en caché las solicitudes GET hacia el endpoint de Supabase que lee los servicios de los próximos 30 días.
- Si el dispositivo pierde la conectividad a internet en carretera, la interfaz móvil debe seguir mostrando las tarjetas informativas de los itinerarios ya descargados de forma legible.

---
