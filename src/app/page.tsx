import { getColaboradores, getProveedores, getPlantillas, getServicios } from './actions/db';
import Dashboard from '@/components/Dashboard';

// Forzar renderizado dinámico para tener datos actualizados en cada petición
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Cargar todos los catálogos y servicios en paralelo
  const [colaboradores, proveedores, plantillas, servicios] = await Promise.all([
    getColaboradores(),
    getProveedores(),
    getPlantillas(),
    getServicios(),
  ]);

  return (
    <Dashboard
      initialColaboradores={colaboradores}
      initialProveedores={proveedores}
      initialPlantillas={plantillas}
      initialServicios={servicios}
    />
  );
}
