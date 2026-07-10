# 🗺️ TourFlow - Sistema de Gestión Logística para Turismo

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-emerald?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![PWA](https://img.shields.io/badge/PWA-Offline_Ready-purple?style=for-the-badge&logo=progressive-web-apps)](https://web.dev/explore/progressive-web-apps)

**TourFlow** es una solución digital avanzada diseñada para reemplazar flujos de trabajo manuales e ineficientes (como la coordinación mediante archivos de Word y capturas de pantalla de celular) en la gestión logística diaria de viajes y tours.

Este sistema centraliza la programación y visualización macro de operaciones para un único coordinador (administrador general) en su computadora de escritorio, mientras se sincroniza en tiempo real con dispositivos móviles en ruta mediante capacidades nativas sin conexión a internet.

---

## ✨ Características Clave

- 📅 **Calendario Inteligente (Escritorio):** Visualización macro mensual y semanal de servicios. Código de colores automático por colaborador asignado y estados de pago mediante insignias dinámicas (`Badges`).
- 📱 **Diseño Móvil Optimizado (PWA):** Interfaz vertical tipo feed cronológico táctil con navegación intuitiva y acceso instantáneo con un solo dedo.
- ✈️ **Acciones Rápidas en Ruta:**
  - **Enlace directo a WhatsApp:** Genera de forma dinámica un mensaje formateado con los detalles del tour/traslado para el cliente con un solo toque.
  - **Llamadas directas:** Accesos directos telefónicos (`tel:[numero]`) para contactar inmediatamente a colaboradores y proveedores.
- 💾 **Soporte Offline:** Service Workers configurados para almacenar en caché datos de Supabase de los próximos 30 días, permitiendo consultar los itinerarios en carretera sin señal de internet.
- 📸 **Carga de Archivos:** Adjuntar imágenes de comprobantes de pago directamente desde el celular, almacenados en un bucket público de Supabase Storage.
- 🔔 **Notificaciones Push:** Sistema integrado de suscripción para alertar a los dispositivos móviles de los colaboradores sobre cambios de último minuto.

---

## 🛠️ Stack Tecnológico

- **Frontend & Lógica:** Next.js 16 (App Router) + React 19 + TypeScript.
- **Estilos y UI:** Tailwind CSS v4 + Shadcn/ui (Calendar, Popover, Dialog, Badges, Tabs, Cards).
- **Backend & Tiempo Real:** Supabase (Base de Datos PostgreSQL + Realtime Engine).
- **Almacenamiento de Archivos:** Supabase Storage.
- **Capacidad PWA:** `@ducanh2912/next-pwa` con almacenamiento en caché inteligente.
- **Despliegue de Producción:** Vercel.

---

## 🚀 Guía de Instalación Rápida

### Opción A: Con Docker Compose (Un solo comando 🐳)

Esta opción es ideal para levantar el proyecto de forma rápida sin preocuparte por las dependencias de Node.js instaladas localmente.

1. **Clonar el repositorio:**

   ```bash
   git clone <URL_DEL_REPOSITORIO> tourflow
   cd tourflow
   ```

2. **Configurar el archivo de entorno:**
   Copia el archivo de ejemplo y rellena con tus credenciales de Supabase (mira la sección [Variables de Entorno](#-variables-de-entorno)):

   ```bash
   cp .env.example .env.local
   ```

3. **Levantar el contenedor:**
   ```bash
   docker compose up -d --build
   ```
   _La aplicación compilará y estará disponible en `http://localhost:3000`._

---

### Opción B: Ejecución Local Tradicional (pnpm ⚡)

Este proyecto está configurado para ejecutarse con **pnpm**. Si no lo tienes instalado, puedes obtenerlo mediante `npm install -g pnpm`.

1. **Clonar el repositorio e instalar dependencias:**

   ```bash
   git clone <URL_DEL_REPOSITORIO> tourflow
   cd tourflow
   pnpm install
   ```

2. **Configurar variables de entorno:**

   ```bash
   cp .env.example .env.local
   ```

   _Edita `.env.local` con tus datos de Supabase._

3. **Ejecutar el servidor de desarrollo:**
   ```bash
   pnpm run dev
   ```
   _Abre `http://localhost:3000` en tu navegador._

---

## 🔑 Variables de Entorno

El archivo `.env.local` requiere las siguientes variables de configuración para el correcto funcionamiento de la aplicación:

| Variable                        | Tipo     | Descripción                                                                                                           | Obligatorio |
| :------------------------------ | :------- | :-------------------------------------------------------------------------------------------------------------------- | :---------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `string` | URL del endpoint de tu proyecto en Supabase.                                                                          | **Sí**      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `string` | Clave API pública anónima de Supabase.                                                                                | **Sí**      |
| `APP_PASSCODE`                  | `string` | Código de seguridad de acceso para la aplicación.(Por el momento solo la persona que lo está utilizando tiene acceso) | No          |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`  | `string` | Clave VAPID pública para notificaciones Push.                                                                         | No          |
| `VAPID_PRIVATE_KEY`             | `string` | Clave VAPID privada para notificaciones Push.                                                                         | No          |
| `CRON_SECRET`                   | `string` | Clave Bearer token para autorizar la petición de cron reminders.                                                      | No          |

---

## 🗄️ Esquema de Base de Datos (Supabase)

Para inicializar la base de datos de Supabase, ejecuta las consultas del archivo [schema.sql](supabase\schema.sql) en el **SQL Editor** de tu panel de Supabase.

El esquema creará y configurará las siguientes tablas principales:

1.  **`colaboradores`**: Administra a los encargados de la operación de tours (ej: Alex, Fausto, Gato).
2.  **`proveedores`**: Registro de proveedores de servicios externos (lanchas, pickups 4x4, etc.).
3.  **`plantillas_itinerario`**: Catálogo de rutas frecuentes para precargar formularios rápidamente.
4.  **`servicios_diarios`**: Núcleo del sistema. Contiene los traslados y tours programados con estados de pago, asignaciones, montos y enlaces a comprobantes.
5.  **`suscripciones_push`**: Registra los endpoints autorizados para el envío de notificaciones push a dispositivos celulares.

> [!TIP]
> **Habilitación de Realtime:**
> El script `schema.sql` añade automáticamente las tablas a la publicación de replicación en tiempo real de Supabase (`supabase_realtime`), asegurando que cualquier cambio se refleje al instante en la pantalla del administrador.
