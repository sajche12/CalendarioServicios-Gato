-- Esquema SQL Inicial para TourFlow

-- 1. Tabla de Colaboradores
create table if not exists colaboradores (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  telefono text,
  color text, -- Código hexadecimal o clase CSS para visualización en calendario
  activo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabla de Proveedores
create table if not exists proveedores (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  servicio text,
  telefono text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabla de Plantillas de Itinerario
create table if not exists plantillas_itinerario (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  ruta_origen text not null,
  ruta_destino text not null,
  puntos_intermedios text[],
  hora_sugerida time,
  notas_predeterminadas text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabla de Servicios Diarios
create table if not exists servicios_diarios (
  id uuid default gen_random_uuid() primary key,
  fecha date not null,
  hora time,
  cliente_grupo text not null,
  cliente_telefono text,
  pax_count integer not null default 1,
  ruta_origen text not null,
  ruta_destino text not null,
  logistica_transporte text,
  colaborador_id uuid references colaboradores(id) on delete set null,
  proveedor_id uuid references proveedores(id) on delete set null,
  monto_servicio numeric(10,2) default 0.00,
  estado_pago text check (estado_pago in ('Pendiente', 'Abono Parcial', 'Pagado Total')) default 'Pendiente',
  estado_ruta text check (estado_ruta in ('No Iniciado', 'En Ruta', 'Retrasado', 'Completado')) default 'No Iniciado',
  notas_adicionales text,
  comprobante_url text,
  monto_pagado_colaborador numeric(10,2) default 0.00,
  monto_total_colaborador numeric(10,2) default 0.00,
  estado_pago_colaborador text check (estado_pago_colaborador in ('Pendiente', 'Abono Parcial', 'Pagado Total')) default 'Pendiente',
  divisa text check (divisa in ('GTQ', 'USD')) default 'GTQ',
  tasa_cambio numeric(10,4) default 7.8000,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Habilitar Realtime para las tablas
begin;
  -- Eliminar tablas de la publicación si ya existían para evitar conflictos
  alter publication supabase_realtime drop table if exists colaboradores, proveedores, plantillas_itinerario, servicios_diarios;
  -- Añadir las tablas a la publicación de realtime
  alter publication supabase_realtime add table colaboradores, proveedores, plantillas_itinerario, servicios_diarios;
commit;

-- 6. Configurar Bucket de Almacenamiento para Comprobantes
insert into storage.buckets (id, name, public)
values ('comprobantes-bucket', 'comprobantes-bucket', true)
on conflict (id) do nothing;

-- Crear política de lectura pública para el bucket de comprobantes
create policy "Comprobantes public read" on storage.objects
  for select using (bucket_id = 'comprobantes-bucket');

-- Crear política de inserción pública para subir comprobantes (bypasseada por service_role)
create policy "Comprobantes public insert" on storage.objects
  for insert with check (bucket_id = 'comprobantes-bucket');
