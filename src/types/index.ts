export interface Colaborador {
  id: string;
  nombre: string;
  telefono: string | null;
  color: string | null;
  activo: boolean;
  created_at: string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  servicio: string | null;
  telefono: string | null;
  created_at: string;
}

export interface PlantillaItinerario {
  id: string;
  titulo: string;
  ruta_origen: string;
  ruta_destino: string;
  puntos_intermedios: string[] | null;
  hora_sugerida: string | null;
  notas_predeterminadas: string | null;
  created_at: string;
}

export type EstadoPago = 'Pendiente' | 'Abono Parcial' | 'Pagado Total';
export type EstadoRuta = 'No Iniciado' | 'En Ruta' | 'Retrasado' | 'Completado';

export interface ServicioDiario {
  id: string;
  fecha: string; // formato YYYY-MM-DD
  hora: string | null; // formato HH:MM:SS
  cliente_grupo: string;
  cliente_telefono: string | null;
  pax_count: number;
  ruta_origen: string;
  ruta_destino: string;
  logistica_transporte: string | null;
  colaborador_id: string | null;
  proveedor_id: string | null;
  monto_servicio: number;
  estado_pago: EstadoPago;
  estado_ruta: EstadoRuta;
  notas_adicionales: string | null;
  comprobante_url: string | null;
  monto_pagado_colaborador: number;
  monto_total_colaborador: number;
  estado_pago_colaborador: EstadoPago;
  divisa: 'GTQ' | 'USD';
  tasa_cambio: number;
  created_at: string;
  // Relaciones cargadas opcionalmente
  colaborador?: Colaborador | null;
  proveedor?: Proveedor | null;
}
