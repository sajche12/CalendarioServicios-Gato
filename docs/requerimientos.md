# Especificación de Requerimientos de Software

## 1. Introducción

Este documento define los requerimientos funcionales y no funcionales de **TourFlow**, un sistema PWA (Progressive Web App) y web interactivo para la gestión logística de servicios turísticos y de transporte. El sistema centraliza la administración, programación y visualización de rutas diarias para un coordinador general, mientras permite a los colaboradores en ruta visualizar y actualizar sus itinerarios en tiempo real, incluso en condiciones de baja o nula conectividad a internet.

---

## 2. Requerimientos Funcionales (RF)

Los requerimientos funcionales especifican los servicios, acciones y comportamientos que el sistema debe proveer y permitir realizar a los usuarios.

### 2.1. Gestión de Entidades Base (CRUD)

| ID       | Requerimiento                           | Descripción                                                                                                                                                                                                                                                       |
| :------- | :-------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RF-1** | **Gestión de Colaboradores**            | El sistema debe permitir registrar, listar, editar y desactivar colaboradores (conductores, guías, etc.). Cada registro incluye: nombre completo, teléfono de contacto, color personalizado (para identificación en el calendario) y estado activo/inactivo.      |
| **RF-2** | **Gestión de Proveedores**              | El sistema debe permitir registrar, listar, editar y eliminar proveedores externos de servicios complementarios (ej. lancheros, transporte de apoyo). Incluye: nombre del proveedor, servicio que ofrece y teléfono de contacto.                                  |
| **RF-3** | **Gestión de Plantillas de Itinerario** | El sistema debe permitir crear plantillas para rutas y servicios recurrentes con el fin de acelerar la programación diaria. Cada plantilla incluye: título, ruta de origen, ruta de destino, puntos intermedios (paradas), hora sugerida y notas predeterminadas. |

### 2.2. Planificación y Gestión de Operaciones

| ID       | Requerimiento                         | Descripción                                                                                                                                                                                                                                                                                                                                                 |
| :------- | :------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RF-4** | **Programación de Servicios Diarios** | El administrador debe poder crear, modificar y eliminar servicios para fechas específicas. Cada servicio incluye:<br>• Fecha y hora.<br>• Nombre del cliente/grupo y teléfono de contacto.<br>• Cantidad de pasajeros (pax).<br>• Ruta de origen y destino.<br>• Logística del transporte.<br>• Colaborador y/o proveedor asignado.<br>• Notas adicionales. |
| **RF-5** | **Control de Estados del Servicio**   | El sistema debe permitir cambiar el estado de ruta de un servicio para realizar el seguimiento en tiempo real. Los estados soportados son: `No Iniciado`, `En Ruta`, `Retrasado` y `Completado`.                                                                                                                                                            |

### 2.3. Panel de Control y Vistas Dinámicas

| ID       | Requerimiento                              | Descripción                                                                                                                                                                                                                                                                     |
| :------- | :----------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **RF-6** | **Calendario de Operaciones (Escritorio)** | El administrador debe disponer de un calendario mensual y semanal donde se visualicen los servicios asignados. Cada servicio se identificará visualmente mediante el color representativo del colaborador asignado y mostrará estados mediante distintivos visuales (`Badges`). |
| **RF-7** | **Feed Cronológico (Móvil)**               | Los colaboradores que accedan desde dispositivos móviles deben visualizar una interfaz simplificada tipo feed vertical con los servicios que tienen asignados para el día actual y futuros, ordenados cronológicamente.                                                         |
| **RF-8** | **Filtrado Avanzado**                      | El sistema debe permitir filtrar los servicios listados en el panel por Colaborador asignado, Estado de Pago, y Estado de la Ruta.                                                                                                                                              |

### 2.4. Gestión Financiera y Control de Pagos

| ID        | Requerimiento                   | Descripción                                                                                                                                                                                                                                                        |
| :-------- | :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RF-9**  | **Control de Cobro al Cliente** | Cada servicio diario debe incluir un registro financiero que contenga: monto total del servicio, divisa (`GTQ` o `USD`), tasa de cambio aplicada, y estado de pago del cliente (`Pendiente`, `Abono Parcial`, `Pagado Total`).                                     |
| **RF-10** | **Liquidación a Colaboradores** | El sistema debe permitir gestionar el pago interno al colaborador asignado por el servicio realizado. Incluye: monto total a pagar al colaborador, monto pagado hasta el momento, y estado del pago al colaborador (`Pendiente`, `Abono Parcial`, `Pagado Total`). |
| **RF-11** | **Carga de Comprobantes**       | El sistema debe permitir adjuntar imágenes o fotografías de comprobantes de pago (desde el móvil o el escritorio) asociadas a cada servicio, almacenando los archivos en un repositorio en la nube.                                                                |

### 2.5. Comunicación y Notificaciones

| ID        | Requerimiento                         | Descripción                                                                                                                                                                                                                             |
| :-------- | :------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RF-12** | **Acciones de Contacto Rápido**       | El feed móvil debe proporcionar botones interactivos de marcación telefónica directa (`tel:`) para colaboradores y proveedores asignados.                                                                                               |
| **RF-13** | **Integración con WhatsApp**          | El sistema debe generar dinámicamente enlaces a la API de WhatsApp con mensajes pre-redactados que resuman la información del servicio (ruta, horarios, cantidad de pasajeros) para enviarlo directamente al cliente con un solo toque. |
| **RF-14** | **Suscripción y Notificaciones Push** | Los usuarios móviles deben poder suscribir sus dispositivos para recibir notificaciones push en tiempo real cuando el administrador realice modificaciones críticas sobre sus itinerarios.                                              |

### 2.6. Seguridad y Control de Acceso

| ID        | Requerimiento                    | Descripción                                                                                                                                                                         |
| :-------- | :------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RF-15** | **Autenticación Administrativa** | El acceso a las pantallas de gestión y datos del dashboard debe estar restringido mediante un código de acceso administrativo configurado en las variables de entorno del servidor. |

---

## 3. Requerimientos No Funcionales (RNF)

Los requerimientos no funcionales definen los atributos de calidad, restricciones y propiedades del sistema.

### 3.1. Rendimiento y Concurrencia

- **RNF-1 (Sincronización en Tiempo Real):** Cualquier inserción, eliminación o actualización sobre las tablas del sistema en la base de datos debe reflejarse inmediatamente en el dashboard del administrador activo sin necesidad de recargar la página, utilizando tecnologías de WebSockets (Supabase Realtime).
- **RNF-2 (Optimización en Redes Móviles):** El peso inicial de la aplicación y las respuestas del servidor deben estar optimizados para permitir una carga y visualización rápida bajo conexiones de datos móviles limitadas (3G y 4G).

### 3.2. Disponibilidad y Resiliencia (Offline First)

- **RNF-3 (Soporte Offline):** La aplicación debe operar como una PWA instalable. En ausencia de señal de internet, los colaboradores deben poder visualizar los itinerarios cargados previamente.
- **RNF-4 (Estrategia de Caché):** Los datos de los servicios de los próximos 30 días deben almacenarse localmente en la caché del navegador (`NetworkFirst` con fallback a caché local) para garantizar la disponibilidad operacional en carreteras y zonas remotas.

### 3.3. Usabilidad y Diseño

- **RNF-5 (Interfaz Adaptable / Responsive):** La aplicación debe contar con un diseño adaptativo fluido. La vista de escritorio prioriza la administración en pantallas anchas (diseño de rejilla de calendario), mientras que la vista móvil prioriza la manipulación táctil con un solo dedo (diseño móvil-primero vertical).
- **RNF-6 (Accesibilidad y Visualización):** Los colores asignados a los colaboradores deben ser distinguibles para evitar confusiones en la asignación diaria en el calendario macro.

### 3.4. Seguridad

- **RNF-7 (Protección de Credenciales):** Las credenciales de acceso a la base de datos y llaves de APIs externas deben almacenarse de forma segura en variables de entorno del servidor y nunca exponerse en el código fuente cliente.
- **RNF-8 (Políticas de Almacenamiento):** El almacenamiento de archivos (bucket de comprobantes) debe implementar políticas de lectura pública y escritura segura a nivel de base de datos (`Row Level Security` y políticas específicas de Supabase Storage).

### 3.5. Despliegue e Infraestructura

- **RNF-9 (Portabilidad mediante Contenedores):** La aplicación debe poder empaquetarse e iniciarse de manera homogénea en cualquier entorno operativo (desarrollo, pruebas, producción) mediante contenedores Docker y Docker Compose.
