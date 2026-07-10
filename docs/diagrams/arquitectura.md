# Arquitectura General del Sistema

Este documento describe la arquitectura general de **TourFlow** y la comunicación entre sus componentes de frontend, backend y servicios de base de datos distribuidos en la nube.

---

## 1. Diagrama de Arquitectura General

El siguiente diagrama muestra los componentes principales del sistema y cómo se comunican entre sí durante la operación ordinaria:

```mermaid
graph TD
    %% Definición de estilos
    classDef cliente fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef backend fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef db fill:#d1fae5,stroke:#059669,stroke-width:2px,color:#065f46;
    classDef ext fill:#f3e8ff,stroke:#7c3aed,stroke-width:2px,color:#5b21b6;

    subgraph Dispositivo ["Dispositivo Cliente (Navegador / Celular PWA)"]
        UI["Interfaz de Usuario (React + Tailwind CSS)"]
        SW["Service Worker (Caché Offline / Workbox)"]
        UI -->|Interacciones / Cargas| SW
    end
    class UI,SW cliente;

    subgraph Servidor ["Servidor Next.js (Vercel)"]
        SA["Server Actions (Lógica & Seguridad)"]
        API["API Routes (/api/push, /api/cron-reminders)"]
        WP["Módulo Web-Push (Node.js)"]
        API --> WP
    end
    class SA,API,WP backend;

    subgraph Supabase ["Servicios de Supabase Cloud"]
        DB[("PostgreSQL Database")]
        Realtime["Realtime Engine (WebSockets)"]
        Storage["Storage (comprobantes-bucket)"]
    end
    class DB,Realtime,Storage db;

    subgraph Externos ["Servicios de Terceros"]
        PushService["Gateway de Notificaciones Push (Mozilla/Google/Apple)"]
        WhatsApp["Enlace dinámico a WhatsApp"]
    end
    class PushService,WhatsApp ext;

    %% Conexiones e interacción
    SW -->|"1. Lectura / Escritura (Online)"| SA
    SW -->|"2. Fallback local si no hay señal (Offline)"| SW
    SW -->|"3. Subida directa de imágenes"| Storage
    SA -->|"4. Consultas SQL e inserción"| DB
    DB -.->|"5. Disparador de eventos"| Realtime
    Realtime -.->|"6. Sincronización dinámica via WS"| UI
    WP -->|"7. Disparo de Notificaciones"| PushService
    PushService -.->|"8. Entrega de alerta push"| SW
    UI -->|"9. Redirección de mensajería"| WhatsApp
```

---

## 2. Diagrama de Flujo: Realtime y Soporte Offline

El siguiente flujo detalla el comportamiento del sistema cuando el administrador registra un cambio y cómo se refleja de inmediato en los clientes o se gestiona la pérdida de conectividad:

```mermaid
sequenceDiagram
    autonumber
    actor Administrador
    participant ClienteUI as Cliente Web (React)
    participant SW as Service Worker (Caché local)
    participant NextServer as Next.js Server (Actions)
    participant DB as Supabase Postgres
    participant Realtime as Supabase Realtime
    actor Colaborador as Colaborador Móvil

    %% Caso 1: Actualización Realtime
    Note over Administrador, Colaborador: Caso 1: Sincronización en Tiempo Real (Online)
    Administrador->>ClienteUI: Modifica/Asigna servicio
    ClienteUI->>NextServer: Invoca Server Action (Mutar Datos)
    NextServer->>DB: UPDATE / INSERT en Tabla 'servicios_diarios'
    DB->>Realtime: Notifica cambio en la fila (Triggers Postgres)
    Realtime-->>Colaborador: Empuja actualización vía WebSocket
    Note over Colaborador: Interfaz del móvil se actualiza<br>sin recargar pantalla

    %% Caso 2: Operación Offline
    Note over Colaborador: Caso 2: Operación en Carretera (Sin Señal)
    Colaborador->>SW: Intenta consultar itinerario
    SW->>NextServer: Petición HTTP (Falla por falta de red)
    SW->>SW: Recupera datos desde Caché Local (30 días de historial)
    SW-->>Colaborador: Muestra datos guardados sin interrumpir operación
```

---

## 3. Descripción de los Componentes

### A. Capa de Presentación (Frontend / PWA)

- **Next.js (App Router):** Estructura y renderiza las vistas. El panel administrativo del organizador se sirve de forma dinámica, mientras que las vistas táctiles móviles para colaboradores están optimizadas para un acceso móvil directo.
- **Service Worker (`next-pwa`):** intercepta las solicitudes de red. Si el dispositivo tiene internet, consulta las Server Actions; si está desconectado, recupera de inmediato la última instantánea guardada en la caché local del navegador (con vigencia de hasta 30 días para datos de Supabase).

### B. Capa de Servidor (Backend Next.js)

- **Server Actions:** Canal seguro para realizar peticiones a Supabase usando variables de entorno que nunca se exponen al cliente. Valida la sesión y el código de acceso antes de procesar las operaciones.
- **Rutas de API (`api/`):** Expone endpoints específicos para tareas del sistema, como el servicio de notificaciones y la activación periódica de recordatorios (`cron-reminders`).

### C. Capa de Datos e Infraestructura (Supabase Cloud)

- **PostgreSQL:** Almacén persistente de datos relacionales con llaves foráneas e índices estructurados.
- **Realtime Engine:** Servicio que escucha el log de transacciones (`Write-Ahead Log`) de PostgreSQL y transmite inmediatamente cualquier inserción o actualización mediante canales WebSocket (`supabase_realtime`) a los navegadores web suscritos.
- **Storage Bucket (`comprobantes-bucket`):** Contenedor de objetos estáticos para las imágenes y fotografías de depósitos o transferencias bancarias de los servicios que se cargan desde dispositivos móviles.
