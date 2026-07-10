# Historias de Uso y Criterios de Aceptación

Este documento detalla las **Historias de Usuario (HU)** para el sistema **TourFlow**. Define el comportamiento esperado del software desde la perspectiva de los dos roles clave del negocio.

---

## Roles del Sistema

1.  **Coordinador (Administrador):**
    - **Contexto:** Trabaja principalmente desde su computadora de escritorio.
    - **Meta:** Programar la logística de viajes, asignar recursos (conductores y proveedores externos), auditar pagos de clientes y liquidar los honorarios de los conductores.
2.  **Conductor (Colaborador):**
    - **Contexto:** Trabaja en la calle/carretera desde su teléfono celular.
    - **Meta:** Consultar su itinerario asignado de forma ágil, reportar el avance de la ruta en tiempo real (o recuperarse ante cortes de señal) y subir evidencias de pago de forma asíncrona.

---

## Historias de Usuario

### Módulo de Coordinación y Planificación (Administrador)

#### HU-1: Configuración de Colaboradores con Código de Colores

- **Como:** Coordinador de TourFlow
- **Quiero:** Registrar y asignar un color hexadecimal único a cada colaborador
- **Para:** Identificar visualmente sus asignaciones en la cuadrícula mensual del calendario de manera instantánea.
- **Criterios de Aceptación:**
  - **Escenario: Crear un colaborador con color personalizado**
    - **Dado** que el Coordinador se encuentra en el panel de colaboradores.
    - **Cuando** introduce el nombre, el teléfono y selecciona un color (ej. `#10B981`).
    - **Entonces** el colaborador queda guardado en el sistema y cualquier servicio asignado a él en el calendario tomará el color verde asignado.

#### HU-2: Programación y Asignación de Servicios Diarios

- **Como:** Coordinador de TourFlow
- **Quiero:** Registrar nuevos servicios de viajes y traslados indicando cliente, pax, ruta, logística, conductor y proveedor
- **Para:** Mantener centralizada toda la operación y notificar a los encargados del viaje automáticamente.
- **Criterios de Aceptación:**
  - **Escenario: Crear y asignar un servicio con éxito**
    - **Dado** que el Coordinador abre el formulario de "Nuevo Servicio".
    - **Cuando** introduce los datos obligatorios (Fecha, Cliente, Pax, Ruta Origen, Ruta Destino) y selecciona un Colaborador.
    - **Entonces** el servicio se registra en la base de datos y se hace visible en el feed del colaborador seleccionado en tiempo real.

#### HU-3: Visualización Macro de Operaciones

- **Como:** Coordinador de TourFlow
- **Quiero:** Visualizar una vista mensual y semanal interactiva de todos los servicios registrados
- **Para:** Monitorear de forma rápida la carga de trabajo y detectar servicios pendientes de cobro.
- **Criterios de Aceptación:**
  - **Escenario: Filtrar el calendario de escritorio**
    - **Dado** que el Coordinador visualiza la cuadrícula del mes actual.
    - **Cuando** selecciona filtrar por el estado de pago "Pendiente".
    - **Entonces** el calendario resalta únicamente las tarjetas de los servicios que no han sido pagados en su totalidad, permitiendo una rápida gestión de cobranza.

---

### Módulo de Operación en Ruta (Conductor/Colaborador)

#### HU-4: Vista de Itinerario Cronológico Móvil

- **Como:** Conductor de TourFlow
- **Quiero:** Visualizar mis servicios asignados para el día en una interfaz limpia y vertical
- **Para:** Conocer mis tareas, rutas y horarios sin necesidad de consultar archivos de texto o imágenes estáticas.
- **Criterios de Aceptación:**
  - **Escenario: Consultar asignaciones del día en el celular**
    - **Dado** que el Conductor ingresa a la aplicación desde su dispositivo móvil.
    - **Cuando** accede al feed móvil.
    - **Entonces** ve una lista vertical ordenada cronológicamente de los servicios asignados para hoy y días futuros, mostrando cliente, pax, ruta y logística.

#### HU-5: Resiliencia y Funcionamiento Offline en Carretera

- **Como:** Conductor de TourFlow
- **Quiero:** Consultar la información básica de mis rutas de viaje programadas aun cuando no tengo señal celular en la ruta
- **Para:** Evitar interrupciones operativas o pérdidas de información crítica de los pasajeros.
- **Criterios de Aceptación:**
  - **Escenario: Pérdida de señal telefónica en el feed**
    - **Dado** que el Conductor ha abierto la aplicación al menos una vez en las últimas 24 horas y ahora se encuentra en una carretera sin señal de red.
    - **Cuando** abre el feed móvil de la aplicación.
    - **Entonces** la aplicación carga exitosamente los servicios de los próximos 30 días almacenados localmente por el Service Worker, en lugar de mostrar un error de red.

#### HU-6: Reporte de Avances de Ruta en Tiempo Real

- **Como:** Conductor de TourFlow
- **Quiero:** Modificar el estado del servicio ("No Iniciado", "En Ruta", "Completado") con un solo toque desde mi celular
- **Para:** Mantener al administrador al tanto de mi ubicación operativa sin tener que realizar llamadas telefónicas.
- **Criterios de Aceptación:**
  - **Escenario: Actualización de estado en ruta**
    - **Dado** que el Conductor tiene señal de red y abre su servicio activo.
    - **Cuando** presiona el botón "Iniciar Ruta".
    - **Entonces** el estado del servicio cambia a "En Ruta" y el indicador del calendario del administrador se actualiza visualmente en milisegundos a través del WebSocket de Supabase.

#### HU-7: Carga de Comprobantes de Depósito/Cobro

- **Como:** Conductor de TourFlow
- **Quiero:** Adjuntar una fotografía del comprobante de pago recolectado durante el servicio
- **Para:** Notificar la conclusión financiera del traslado y agilizar el registro administrativo.
- **Criterios de Aceptación:**
  - **Escenario: Subir comprobante desde la cámara del celular**
    - **Dado** que el Conductor ha cobrado un servicio y abre la sección de adjuntos.
    - **Cuando** selecciona la opción de cargar archivo y toma una foto de la boleta de depósito/efectivo.
    - **Entonces** la foto se sube al almacenamiento en la nube (Storage) y el enlace se asocia al servicio automáticamente, cambiando el estado de pago del cliente a "Pagado Total".

#### HU-8: Contacto Directo al Cliente por WhatsApp

- **Como:** Conductor de TourFlow
- **Quiero:** Generar un enlace dinámico de WhatsApp que contenga un mensaje pre-redactado con los datos del viaje
- **Para:** Notificar al cliente que voy en camino o que he llegado a su punto de encuentro con un solo toque.
- **Criterios de Aceptación:**
  - **Escenario: Enviar mensaje de logística al cliente**
    - **Dado** que el Conductor abre la tarjeta del servicio activo que contiene el número de teléfono del cliente.
    - **Cuando** pulsa el icono de "Enviar WhatsApp".
    - **Entonces** se abre la aplicación de WhatsApp con un chat hacia el cliente y un texto precargado como: _"Hola, soy tu conductor asignado. Te confirmo que tu traslado desde [Origen] a [Destino] está programado a las [Hora]..."_

---

### Seguridad y Notificaciones del Sistema

#### HU-9: Alertas Críticas mediante Notificaciones Push

- **Como:** Conductor de TourFlow
- **Quiero:** Recibir una notificación push en mi celular cuando el coordinador modifique un servicio que tengo asignado
- **Para:** Enterarme de cambios de ruta o cancelaciones de última hora inmediatamente.
- **Criterios de Aceptación:**
  - **Escenario: Coordinador modifica la fecha o cancela un servicio**
    - **Dado** que el Conductor tiene el navegador de la aplicación cerrado pero con la suscripción a notificaciones activa.
    - **Cuando** el Coordinador edita la hora de su servicio asignado desde el dashboard.
    - **Entonces** llega una notificación de sistema al celular del conductor indicando: _"TourFlow: Se ha modificado el horario de tu servicio para el cliente [Cliente]"_.

#### HU-10: Restricción de Datos Administrativos

- **Como:** Dueño de TourFlow
- **Quiero:** Proteger las vistas de administración y finanzas mediante un código de acceso administrativo privado
- **Para:** Asegurar que los conductores u otras personas ajenas no puedan visualizar montos de dinero de la empresa o reasignar servicios sin autorización.
- **Criterios de Aceptación:**
  - **Escenario: Acceso bloqueado sin código de seguridad**
    - **Dado** que un usuario intenta abrir la ruta del Dashboard administrativo.
    - **Cuando** no cuenta con una cookie de autorización válida y el sistema le solicita introducir el código de seguridad.
    - **Entonces** no se le permite ver ninguna información de servicios, colaboradores o finanzas hasta que introduzca el código correcto en la pantalla de inicio de sesión.
