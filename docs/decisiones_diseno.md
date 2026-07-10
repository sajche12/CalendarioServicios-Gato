# Registro de Decisiones de Diseño de Arquitectura (ADR)

Este documento recopila las decisiones de arquitectura más importantes tomadas durante el diseño y desarrollo de **TourFlow**, detallando el contexto, las alternativas evaluadas, los motivos de cada elección y sus implicaciones técnicas.

---

## Índice de Decisiones

1.  [ADR-01: Elección de Next.js (App Router) + React 19](#adr-01-elección-de-nextjs-app-router--react-19)
2.  [ADR-02: Integración de Supabase como Plataforma Backend (BaaS)](#adr-02-integración-de-supabase-como-plataforma-backend-baas)
3.  [ADR-03: Enfoque Offline-First con Progressive Web App (PWA)](#adr-03-enfoque-offline-first-con-progressive-web-app-pwa)
4.  [ADR-04: Autenticación Ligera Mediante Código de Acceso del Servidor](#adr-04-autenticación-ligera-mediante-código-de-acceso-del-servidor)
5.  [ADR-05: Protocolo VAPID para Notificaciones Push Web](#adr-05-protocolo-vapid-para-notificaciones-push-web)
6.  [ADR-06: Aislamiento del Entorno con Docker y pnpm](#adr-06-aislamiento-del-entorno-con-docker-y-pnpm)

---

## ADR-01: Elección de Next.js (App Router) + React 19

- **Estado:** Aprobado.
- **Contexto:**
  El sistema requiere dos interfaces de usuario altamente diferenciadas: un panel de control con un calendario interactivo complejo para el administrador de escritorio, y una vista cronológica simplificada y táctil para los conductores móviles. Además, se requiere un flujo de renderizado del lado del servidor para proteger variables de entorno sensibles (APIs) y ofrecer carga rápida.
- **Decisión:**
  Se adopta **Next.js 16 (App Router)** como framework unificado junto con **React 19**.
- **Consecuencias:**
  - **Positivas:**
    - Los componentes pesados (calendario, dashboards) pueden beneficiarse de carga optimizada.
    - Los Server Actions simplifican la comunicación segura entre el cliente y Supabase sin escribir controladores REST tradicionales.
    - La modularidad del App Router facilita separar rutas administrativas y rutas del feed móvil.
  - **Negativas:**
    - Curva de aprendizaje ligeramente superior respecto a un SPA puro en React debido a la distinción entre Server y Client Components.

---

## ADR-02: Integración de Supabase como Plataforma Backend (BaaS)

- **Estado:** Aprobado.
- **Contexto:**
  El desarrollo cuenta con recursos de tiempo limitados y debe priorizar la sincronización instantánea de datos. Si un administrador reasigna un tour en el calendario, el conductor en ruta debe ver el cambio al instante. Escribir un servidor WebSockets propio (ej. Socket.io) e implementar almacenamiento seguro de archivos (comprobantes de pago) desde cero incrementaría drásticamente la complejidad y el mantenimiento del backend.
- **Decisión:**
  Utilizar **Supabase** como backend en la nube, aprovechando su motor de base de datos PostgreSQL, canal Realtime y servicio de Storage.
- **Consecuencias:**
  - **Positivas:**
    - **Tiempo Real Nativo:** Con un simple script de base de datos (`ALTER PUBLICATION add table...`), se habilita la sincronización por WebSockets de forma inmediata.
    - **Storage Integrado:** Subida directa de comprobantes de pago desde dispositivos móviles a un bucket público seguro de Supabase.
    - **PostgreSQL Relacional:** Estructuración de datos limpia con integridad referencial e índices de alto rendimiento.
  - **Negativas:**
    - Dependencia del proveedor (vendor lock-in) con Supabase Cloud. Sin embargo, al ser open-source, permite migrar a una instancia auto-alojada si fuera necesario en el futuro.

---

## ADR-03: Enfoque Offline-First con Progressive Web App (PWA)

- **Estado:** Aprobado.
- **Contexto:**
  Los conductores operan en el altiplano, carreteras o rutas de montaña donde la cobertura de red móvil es inestable o inexistente. Si la aplicación fallara o se bloqueara al perder cobertura, el conductor no podría visualizar los detalles de su traslado, afectando gravemente la operación del negocio.
- **Decisión:**
  Configurar la aplicación como una PWA instalable en dispositivos celulares utilizando `@ducanh2912/next-pwa`, implementando un Service Worker con estrategia de almacenamiento en caché `NetworkFirst` con fallback local para un historial operativo de 30 días de la base de datos.
- **Consecuencias:**
  - **Positivas:**
    - La aplicación sigue cargando y funcionando bajo condiciones extremas de nula conectividad a internet.
    - Instalación nativa directa en el celular del conductor (sin pasar por App Stores) con icono en pantalla de inicio.
    - Reducción drástica del consumo de datos móviles al cachear recursos estáticos y de API.
  - **Negativas:**
    - Complejidad en la invalidación de la caché local cuando hay cambios importantes y necesidad de instruir a los usuarios sobre cómo actualizar la aplicación si hay cambios de código.

---

## ADR-04: Autenticación Ligera Mediante Código de Acceso del Servidor

- **Estado:** Aprobado.
- **Contexto:**
  El sistema está diseñado para un único coordinador administrativo y un grupo pequeño de colaboradores internos. Implementar un flujo completo de autenticación de usuarios por correo/contraseña con OAuth, registro público, recuperación de contraseña y roles jerárquicos añade complejidad innecesaria para un sistema privado.
- **Decisión:**
  Implementar una verificación simplificada pero robusta basada en un código de acceso administrativo (`APP_PASSCODE`) definido de forma segura como variable de entorno en el servidor. Tras ingresarlo correctamente, se firma una cookie segura de sesión que protege las rutas internas.
- **Consecuencias:**
  - **Positivas:**
    - Implementación extremadamente ligera, reduciendo el código de autenticación a pocas líneas de Server Actions.
    - Excelente experiencia de usuario: no se requieren registros, correos de confirmación ni inicios de sesión tediosos para el único administrador general.
  - **Negativas:**
    - No hay auditoría individual (todos los cambios administrativos se registran bajo el mismo perfil general). Si el negocio crece y requiere múltiples sub-coordinadores con permisos detallados, esta autenticación deberá evolucionar a un esquema basado en Supabase Auth.

---

## ADR-05: Protocolo VAPID para Notificaciones Push Web

- **Estado:** Aprobado.
- **Contexto:**
  Cuando el administrador cambia una ruta o cancela un traslado asignado a un conductor a mitad del día, es imperativo notificarle de inmediato. Las alertas vía WhatsApp o SMS manuales dependen de que el administrador lo haga al instante. Las notificaciones push web pueden automatizarse desde el servidor, incluso si el conductor tiene el navegador o la PWA cerrada.
- **Decisión:**
  Utilizar la API de notificaciones Web Push nativa de los navegadores utilizando claves de identificación VAPID y la librería `web-push` en Node.js, almacenando los endpoints de suscripción del dispositivo de cada conductor en la tabla `suscripciones_push`.
- **Consecuencias:**
  - **Positivas:**
    - Entrega de notificaciones directamente al sistema operativo del celular del conductor en segundo plano.
    - Costo de infraestructura cero, a diferencia de los servicios de envío de SMS masivos o plataformas push propietarias de pago.
  - **Negativas:**
    - Las notificaciones Push web requieren que el dispositivo del conductor tenga conexión a internet en el momento del envío para recibirlas (no se entregan si está completamente offline en la carretera, aunque se encolan para su recepción al recuperar red).

---

## ADR-06: Aislamiento del Entorno con Docker y pnpm

- **Estado:** Aprobado.
- **Contexto:**
  Para asegurar la profesionalidad del desarrollo, el sistema debe poder instalarse localmente de manera homogénea y limpia. El uso de diferentes versiones locales de Node.js o administradores de paquetes tradicionales (como npm) puede generar inconsistencias en las dependencias y en el rendimiento de compilación de Next.js.
- **Decisión:**
  Contenerizar la aplicación mediante un `Dockerfile` multietapa optimizado e integrarlo con un archivo `docker-compose.yml`, utilizando **pnpm** como el gestor de paquetes principal debido a su almacenamiento de dependencias sumamente eficiente.
- **Consecuencias:**
  - **Positivas:**
    - **Instalación con un Comando:** Permite compilar y levantar todo el sistema con `docker compose up -d`.
    - **Compilaciones Ligeras y Rápidas:** El uso de pnpm reduce los tiempos de instalación de dependencias en más de un 50% y Docker aísla la compilación de producción.
    - Las variables de compilación públicas de Next.js (`NEXT_PUBLIC_*`) se inyectan limpiamente en tiempo de build a través de los argumentos (`args`) de Docker Compose.
  - **Negativas:**
    - Añade un consumo mínimo de recursos de CPU y memoria en el entorno de pruebas local debido a la virtualización de Docker.
