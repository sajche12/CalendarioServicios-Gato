'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logout } from '@/app/actions/auth';
import {
  getColaboradores,
  getProveedores,
  getPlantillas,
  getServicios,
  saveServicio,
  deleteServicio,
  saveColaborador,
  saveProveedor,
  savePlantilla
} from '@/app/actions/db';
import { Colaborador, Proveedor, PlantillaItinerario, ServicioDiario, EstadoPago, EstadoRuta } from '@/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  LogOut,
  Phone,
  MessageSquare,
  Users,
  Compass,
  Briefcase,
  CalendarDays,
  FileImage,
  Upload,
  Loader2,
  Trash2,
  Edit2,
  X,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addDays,
  subDays,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardProps {
  initialColaboradores: Colaborador[];
  initialProveedores: Proveedor[];
  initialPlantillas: PlantillaItinerario[];
  initialServicios: ServicioDiario[];
}

export default function Dashboard({
  initialColaboradores,
  initialProveedores,
  initialPlantillas,
  initialServicios
}: DashboardProps) {
  const router = useRouter();

  // --- Live States ---
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(initialColaboradores);
  const [proveedores, setProveedores] = useState<Proveedor[]>(initialProveedores);
  const [plantillas, setPlantillas] = useState<PlantillaItinerario[]>(initialPlantillas);
  const [servicios, setServicios] = useState<ServicioDiario[]>(initialServicios);

  // --- Navigation & Filter States ---
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterColaborador, setFilterColaborador] = useState<string>('all');
  const [filterPago, setFilterPago] = useState<string>('all');

  // --- Dialog / Form States (Servicio) ---
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState<ServicioDiario | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Campos de formulario Servicio
  const [srvFecha, setSrvFecha] = useState('');
  const [srvHora, setSrvHora] = useState('');
  const [srvCliente, setSrvCliente] = useState('');
  const [srvClienteTelefono, setSrvClienteTelefono] = useState('');
  const [srvPax, setSrvPax] = useState(1);
  const [srvOrigen, setSrvOrigen] = useState('');
  const [srvDestino, setSrvDestino] = useState('');
  const [srvLogistica, setSrvLogistica] = useState('');
  const [srvColaboradorId, setSrvColaboradorId] = useState<string>('');
  const [srvProveedorId, setSrvProveedorId] = useState<string>('');
  const [srvMonto, setSrvMonto] = useState(0);
  const [srvEstadoPago, setSrvEstadoPago] = useState<EstadoPago>('Pendiente');
  const [srvEstadoRuta, setSrvEstadoRuta] = useState<EstadoRuta>('No Iniciado');
  const [srvNotas, setSrvNotas] = useState('');
  const [srvComprobanteUrl, setSrvComprobanteUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // --- Catalog Dialog States ---
  const [isColabDialogOpen, setIsColabDialogOpen] = useState(false);
  const [selectedColab, setSelectedColab] = useState<Colaborador | null>(null);
  const [colabNombre, setColabNombre] = useState('');
  const [colabTelefono, setColabTelefono] = useState('');
  const [colabColor, setColabColor] = useState('#3b82f6');
  const [colabActivo, setColabActivo] = useState(true);

  const [isProvDialogOpen, setIsProvDialogOpen] = useState(false);
  const [selectedProv, setSelectedProv] = useState<Proveedor | null>(null);
  const [provNombre, setProvNombre] = useState('');
  const [provServicio, setProvServicio] = useState('');
  const [provTelefono, setProvTelefono] = useState('');

  const [isPlantillaDialogOpen, setIsPlantillaDialogOpen] = useState(false);
  const [selectedPlantilla, setSelectedPlantilla] = useState<PlantillaItinerario | null>(null);
  const [pltTitulo, setPltTitulo] = useState('');
  const [pltOrigen, setPltOrigen] = useState('');
  const [pltDestino, setPltDestino] = useState('');
  const [pltPuntos, setPltPuntos] = useState(''); // Comma separated
  const [pltHora, setPltHora] = useState('');
  const [pltNotas, setPltNotas] = useState('');

  // --- Realtime Sync ---
  useEffect(() => {
    // Escuchar cambios de servicios
    const srvChannel = supabase
      .channel('db-servicios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servicios_diarios' }, async () => {
        const fresh = await getServicios();
        setServicios(fresh);
      })
      .subscribe();

    // Escuchar cambios de colaboradores
    const colChannel = supabase
      .channel('db-colaboradores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'colaboradores' }, async () => {
        const fresh = await getColaboradores();
        setColaboradores(fresh);
      })
      .subscribe();

    // Escuchar cambios de proveedores
    const provChannel = supabase
      .channel('db-proveedores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proveedores' }, async () => {
        const fresh = await getProveedores();
        setProveedores(fresh);
      })
      .subscribe();

    // Escuchar cambios de plantillas
    const pltChannel = supabase
      .channel('db-plantillas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plantillas_itinerario' }, async () => {
        const fresh = await getPlantillas();
        setPlantillas(fresh);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(srvChannel);
      supabase.removeChannel(colChannel);
      supabase.removeChannel(provChannel);
      supabase.removeChannel(pltChannel);
    };
  }, []);

  // --- Helper: Mapear Colaboradores / Proveedores ---
  const colMap = React.useMemo(() => {
    return new Map(colaboradores.map(c => [c.id, c]));
  }, [colaboradores]);

  const provMap = React.useMemo(() => {
    return new Map(proveedores.map(p => [p.id, p]));
  }, [proveedores]);

  // --- Helper: Fechas de Calendario ---
  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // --- Handlers: Navegación de Fechas ---
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const setToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const nextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const prevDay = () => setSelectedDate(subDays(selectedDate, 1));

  // --- Handlers: Guardar/Crear/Eliminar Servicios ---
  const handleOpenNewService = (date?: Date) => {
    const targetDate = date ? format(date, 'yyyy-MM-dd') : format(selectedDate, 'yyyy-MM-dd');
    setSelectedServicio(null);
    setSrvFecha(targetDate);
    setSrvHora('08:00');
    setSrvCliente('');
    setSrvClienteTelefono('');
    setSrvPax(1);
    setSrvOrigen('');
    setSrvDestino('');
    setSrvLogistica('');
    setSrvColaboradorId('');
    setSrvProveedorId('');
    setSrvMonto(0);
    setSrvEstadoPago('Pendiente');
    setSrvEstadoRuta('No Iniciado');
    setSrvNotas('');
    setSrvComprobanteUrl('');
    setIsServiceDialogOpen(true);
  };

  const handleOpenEditService = (service: ServicioDiario) => {
    setSelectedServicio(service);
    setSrvFecha(service.fecha);
    setSrvHora(service.hora ? service.hora.slice(0, 5) : '08:00');
    setSrvCliente(service.cliente_grupo);
    setSrvClienteTelefono(service.cliente_telefono || '');
    setSrvPax(service.pax_count);
    setSrvOrigen(service.ruta_origen);
    setSrvDestino(service.ruta_destino);
    setSrvLogistica(service.logistica_transporte || '');
    setSrvColaboradorId(service.colaborador_id || '');
    setSrvProveedorId(service.proveedor_id || '');
    setSrvMonto(Number(service.monto_servicio));
    setSrvEstadoPago(service.estado_pago);
    setSrvEstadoRuta(service.estado_ruta);
    setSrvNotas(service.notas_adicionales || '');
    setSrvComprobanteUrl(service.comprobante_url || '');
    setIsServiceDialogOpen(true);
  };

  const handleApplyTemplate = (templateId: string) => {
    if (templateId === 'none') return;
    const template = plantillas.find(p => p.id === templateId);
    if (!template) return;

    setSrvOrigen(template.ruta_origen);
    setSrvDestino(template.ruta_destino);
    if (template.hora_sugerida) {
      setSrvHora(template.hora_sugerida.slice(0, 5));
    }
    let defaultNotes = template.notas_predeterminadas || '';
    if (template.puntos_intermedios && template.puntos_intermedios.length > 0) {
      const stops = `Puntos de ruta: ${template.puntos_intermedios.join(' ➔ ')}`;
      defaultNotes = defaultNotes ? `${defaultNotes}\n${stops}` : stops;
    }
    setSrvNotas(defaultNotes);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `comprobante-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Subir archivo al bucket de Supabase
      const { error: uploadError } = await supabase.storage
        .from('comprobantes-bucket')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data } = supabase.storage
        .from('comprobantes-bucket')
        .getPublicUrl(filePath);

      setSrvComprobanteUrl(data.publicUrl);
    } catch (err: any) {
      alert(`Error al subir la imagen: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const response = await saveServicio({
        id: selectedServicio?.id,
        fecha: srvFecha,
        hora: srvHora ? `${srvHora}:00` : null,
        cliente_grupo: srvCliente,
        cliente_telefono: srvClienteTelefono || null,
        pax_count: Number(srvPax),
        ruta_origen: srvOrigen,
        ruta_destino: srvDestino,
        logistica_transporte: srvLogistica || null,
        colaborador_id: srvColaboradorId || null,
        proveedor_id: srvProveedorId || null,
        monto_servicio: Number(srvMonto),
        estado_pago: srvEstadoPago,
        estado_ruta: srvEstadoRuta,
        notas_adicionales: srvNotas || null,
        comprobante_url: srvComprobanteUrl || null
      });

      if (response.success) {
        setIsServiceDialogOpen(false);
      } else {
        alert(`Error al guardar: ${response.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedServicio) return;
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;

    setLoadingAction(true);
    try {
      const response = await deleteServicio(selectedServicio.id);
      if (response.success) {
        setIsServiceDialogOpen(false);
      } else {
        alert(`Error al eliminar: ${response.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Handlers: Catálogos ---
  const handleOpenColabDialog = (colab?: Colaborador) => {
    if (colab) {
      setSelectedColab(colab);
      setColabNombre(colab.nombre);
      setColabTelefono(colab.telefono || '');
      setColabColor(colab.color || '#3b82f6');
      setColabActivo(colab.activo);
    } else {
      setSelectedColab(null);
      setColabNombre('');
      setColabTelefono('');
      setColabColor('#3b82f6');
      setColabActivo(true);
    }
    setIsColabDialogOpen(true);
  };

  const handleSaveColaborador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colabNombre.trim()) return;

    setLoadingAction(true);
    const res = await saveColaborador({
      id: selectedColab?.id,
      nombre: colabNombre,
      telefono: colabTelefono || null,
      color: colabColor || null,
      activo: colabActivo
    });

    setLoadingAction(false);
    if (res.success) setIsColabDialogOpen(false);
    else alert(`Error: ${res.error}`);
  };

  const handleOpenProvDialog = (prov?: Proveedor) => {
    if (prov) {
      setSelectedProv(prov);
      setProvNombre(prov.nombre);
      setProvServicio(prov.servicio || '');
      setProvTelefono(prov.telefono || '');
    } else {
      setSelectedProv(null);
      setProvNombre('');
      setProvServicio('');
      setProvTelefono('');
    }
    setIsProvDialogOpen(true);
  };

  const handleSaveProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provNombre.trim()) return;

    setLoadingAction(true);
    const res = await saveProveedor({
      id: selectedProv?.id,
      nombre: provNombre,
      servicio: provServicio || null,
      telefono: provTelefono || null
    });

    setLoadingAction(false);
    if (res.success) setIsProvDialogOpen(false);
    else alert(`Error: ${res.error}`);
  };

  const handleOpenPlantillaDialog = (plantilla?: PlantillaItinerario) => {
    if (plantilla) {
      setSelectedPlantilla(plantilla);
      setPltTitulo(plantilla.titulo);
      setPltOrigen(plantilla.ruta_origen);
      setPltDestino(plantilla.ruta_destino);
      setPltPuntos(plantilla.puntos_intermedios ? plantilla.puntos_intermedios.join(', ') : '');
      setPltHora(plantilla.hora_sugerida ? plantilla.hora_sugerida.slice(0, 5) : '08:00');
      setPltNotas(plantilla.notas_predeterminadas || '');
    } else {
      setSelectedPlantilla(null);
      setPltTitulo('');
      setPltOrigen('');
      setPltDestino('');
      setPltPuntos('');
      setPltHora('08:00');
      setPltNotas('');
    }
    setIsPlantillaDialogOpen(true);
  };

  const handleSavePlantilla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pltTitulo.trim()) return;

    setLoadingAction(true);
    const arrPuntos = pltPuntos
      ? pltPuntos.split(',').map(p => p.trim()).filter(Boolean)
      : null;

    const res = await savePlantilla({
      id: selectedPlantilla?.id,
      titulo: pltTitulo,
      ruta_origen: pltOrigen,
      ruta_destino: pltDestino,
      puntos_intermedios: arrPuntos,
      hora_sugerida: pltHora ? `${pltHora}:00` : null,
      notas_predeterminadas: pltNotas || null
    });

    setLoadingAction(false);
    if (res.success) setIsPlantillaDialogOpen(false);
    else alert(`Error: ${res.error}`);
  };

  // --- Filtros a Nivel Lógico ---
  const filterServices = (list: ServicioDiario[], dateToMatch?: Date) => {
    return list.filter(item => {
      // Comparación por Fecha si se especifica
      if (dateToMatch) {
        const itemDate = parseISO(item.fecha);
        if (!isSameDay(itemDate, dateToMatch)) return false;
      }

      // Filtro Colaborador
      if (filterColaborador !== 'all' && item.colaborador_id !== filterColaborador) {
        return false;
      }

      // Filtro Estado Pago
      if (filterPago !== 'all' && item.estado_pago !== filterPago) {
        return false;
      }

      return true;
    });
  };

  // Servicios filtrados para todo el mes (para pintar en el calendario)
  const monthlyFilteredServices = React.useMemo(() => {
    return filterServices(servicios);
  }, [servicios, filterColaborador, filterPago]);

  // Servicios filtrados para el día seleccionado (para el feed móvil)
  const dailyFilteredServices = React.useMemo(() => {
    return filterServices(servicios, selectedDate);
  }, [servicios, selectedDate, filterColaborador, filterPago]);

  // Mapear servicios por fecha para búsquedas ultra rápidas en el render de celdas
  const servicesByDateMap = React.useMemo(() => {
    const map = new Map<string, ServicioDiario[]>();
    monthlyFilteredServices.forEach(s => {
      const list = map.get(s.fecha) || [];
      list.push(s);
      map.set(s.fecha, list);
    });
    return map;
  }, [monthlyFilteredServices]);

  // --- Badge styling mapping ---
  const getPagoBadgeColor = (pago: EstadoPago) => {
    switch (pago) {
      case 'Pagado Total':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'Abono Parcial':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      default:
        return 'bg-red-950 text-red-300 border-red-800';
    }
  };

  const getRutaBadgeColor = (ruta: EstadoRuta) => {
    switch (ruta) {
      case 'Completado':
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
      case 'En Ruta':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'Retrasado':
        return 'bg-orange-950 text-orange-300 border-orange-800';
      default:
        return 'bg-zinc-900 text-zinc-500 border-zinc-800';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950 text-zinc-50 select-none">
      {/* --- HEADER SUPERIOR --- */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-orange-500 rounded-lg text-white shadow-lg">
            <Compass className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">
              TourFlow
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono tracking-wider">LOGÍSTICA DIARIA</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await logout();
              router.refresh();
            }}
            className="text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-all gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </Button>
        </div>
      </header>

      {/* --- MENU Y PESTAÑAS PRINCIPALES --- */}
      <Tabs defaultValue="logistica" className="flex-1 flex flex-col">
        <div className="bg-zinc-900/40 border-b border-zinc-800/80 px-4 py-2 flex items-center justify-between">
          <TabsList className="bg-zinc-950 border border-zinc-800 p-0.5">
            <TabsTrigger value="logistica" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-zinc-50 gap-1.5 text-zinc-400">
              <CalendarDays className="h-4 w-4" />
              Logística
            </TabsTrigger>
            <TabsTrigger value="catalogos" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-zinc-50 gap-1.5 text-zinc-400">
              <SlidersHorizontal className="h-4 w-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          {/* Filtros Globales (Visibles en cabecera en Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Filtro Colaborador */}
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-zinc-500">Colaborador:</Label>
              <Select value={filterColaborador} onValueChange={(val) => setFilterColaborador(val || 'all')}>
                <SelectTrigger className="w-[140px] h-8 bg-zinc-950 border-zinc-800 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                  <SelectItem value="all">Todos</SelectItem>
                  {colaboradores.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Pago */}
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-zinc-500">Pago:</Label>
              <Select value={filterPago} onValueChange={(val) => setFilterPago(val || 'all')}>
                <SelectTrigger className="w-[130px] h-8 bg-zinc-950 border-zinc-800 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Abono Parcial">Abono Parcial</SelectItem>
                  <SelectItem value="Pagado Total">Pagado Total</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botón de Agregar servicio */}
            <Button size="sm" onClick={() => handleOpenNewService()} className="bg-blue-600 hover:bg-blue-500 text-zinc-50 gap-1 h-8">
              <Plus className="h-4 w-4" /> Nuevo Servicio
            </Button>
          </div>
        </div>

        {/* --- PESTAÑA: LOGÍSTICA --- */}
        <TabsContent value="logistica" className="flex-1 flex flex-col m-0 p-0">
          
          {/* SECCIÓN MÓVIL: FILTROS Y NAVEGACIÓN DIARIA (md:hidden) */}
          <div className="block md:hidden border-b border-zinc-800/80 bg-zinc-900/20 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="icon" onClick={prevDay} className="h-8 w-8 bg-zinc-950 border-zinc-800">
                  <ChevronLeft className="h-4 w-4 text-zinc-400" />
                </Button>
                <div className="text-center min-w-[130px]">
                  <span className="text-xs text-blue-400 block font-mono">
                    {format(selectedDate, 'eeee', { locale: es }).toUpperCase()}
                  </span>
                  <span className="text-sm font-bold text-zinc-100">
                    {format(selectedDate, "dd 'de' MMMM", { locale: es })}
                  </span>
                </div>
                <Button variant="outline" size="icon" onClick={nextDay} className="h-8 w-8 bg-zinc-950 border-zinc-800">
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                </Button>
              </div>
              <Button size="sm" variant="outline" onClick={setToday} className="h-8 text-xs bg-zinc-950 border-zinc-800">
                Hoy
              </Button>
            </div>

            {/* Filtros Móviles */}
            <div className="grid grid-cols-2 gap-2">
              <Select value={filterColaborador} onValueChange={(val) => setFilterColaborador(val || 'all')}>
                <SelectTrigger className="w-full h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-300">
                  <SelectValue placeholder="Colaborador" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                  <SelectItem value="all">Todos Colab.</SelectItem>
                  {colaboradores.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPago} onValueChange={(val) => setFilterPago(val || 'all')}>
                <SelectTrigger className="w-full h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-300">
                  <SelectValue placeholder="Estado Pago" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                  <SelectItem value="all">Todos Pagos</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Abono Parcial">Abono Parcial</SelectItem>
                  <SelectItem value="Pagado Total">Pagado Total</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* VISTA CORE: ESCRITORIO VS MÓVIL */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-y-auto">
            
            {/* 🖥️ VISTA CALENDARIO: ESCRITORIO (md:col-span-12) */}
            <div className="hidden md:flex md:col-span-12 flex-col p-4 bg-zinc-950">
              
              {/* Cabecera del Calendario */}
              <div className="flex items-center justify-between mb-4 bg-zinc-900/40 border border-zinc-850 p-3 rounded-xl">
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" onClick={prevMonth} className="bg-zinc-950 border-zinc-800 hover:bg-zinc-900">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-bold text-zinc-100 min-w-[160px] text-center capitalize">
                    {format(currentDate, 'MMMM yyyy', { locale: es })}
                  </h2>
                  <Button variant="outline" size="icon" onClick={nextMonth} className="bg-zinc-950 border-zinc-800 hover:bg-zinc-900">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={setToday} className="bg-zinc-950 border-zinc-800 hover:bg-zinc-900">
                    Mes Actual
                  </Button>
                </div>
              </div>

              {/* Cuadrícula de Calendario */}
              <div className="flex-1 flex flex-col border border-zinc-800 bg-zinc-900/10 rounded-xl overflow-hidden shadow-2xl">
                
                {/* Días de la semana */}
                <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/60 py-2">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dayName => (
                    <div key={dayName} className="text-center text-xs font-mono tracking-wider font-semibold text-zinc-500 uppercase">
                      {dayName}
                    </div>
                  ))}
                </div>

                {/* Días del Mes */}
                <div className="flex-1 grid grid-cols-7 grid-rows-5 min-h-[500px]">
                  {calendarDays.map((day, idx) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayServices = servicesByDateMap.get(dateStr) || [];
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, currentDate);

                    return (
                      <div
                        key={idx}
                        onClick={() => handleOpenNewService(day)}
                        className={`border-r border-b border-zinc-800 p-1 flex flex-col min-h-[90px] relative transition-all hover:bg-zinc-900/30 cursor-pointer ${
                          !isCurrentMonth ? 'opacity-25' : ''
                        } ${isToday ? 'bg-blue-950/5' : ''}`}
                      >
                        {/* Indicador de número de día */}
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-md font-mono ${
                              isToday
                                ? 'bg-blue-600 text-zinc-50 shadow-md'
                                : isCurrentMonth
                                ? 'text-zinc-300'
                                : 'text-zinc-600'
                            }`}
                          >
                            {format(day, 'd')}
                          </span>
                        </div>

                        {/* Listado de Servicios Programados */}
                        <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                          {dayServices.map(service => {
                            const colColor = service.colaborador_id ? colMap.get(service.colaborador_id)?.color || '#3b82f6' : '#71717a';
                            const colInitials = service.colaborador_id ? colMap.get(service.colaborador_id)?.nombre.slice(0, 2) : 'S/A';

                            return (
                              <div
                                key={service.id}
                                onClick={(e) => {
                                  e.stopPropagation(); // Evitar que abra un nuevo servicio
                                  handleOpenEditService(service);
                                }}
                                className="text-[10px] rounded p-1 bg-zinc-950/80 border-l-[3px] border hover:bg-zinc-900 flex items-center justify-between group transition-colors border-zinc-850"
                                style={{ borderLeftColor: colColor }}
                              >
                                <div className="truncate flex-1 pr-1">
                                  <span className="font-semibold text-zinc-100">{service.hora ? service.hora.slice(0, 5) : '08:00'}</span>{' '}
                                  <span className="text-zinc-300 font-medium">({service.pax_count} pax)</span>{' '}
                                  <span className="text-zinc-400">{service.ruta_origen}➔{service.ruta_destino}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Badge className="px-1 text-[8px] h-3.5 bg-zinc-800 text-zinc-400 hover:bg-zinc-800 border-zinc-700">
                                    {colInitials}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 📱 FEED DE LISTA: MÓVIL (md:hidden) */}
            <div className="flex md:hidden flex-col p-4 space-y-3 bg-zinc-950">
              {dailyFilteredServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-2xl">
                  <CalendarDays className="h-10 w-10 text-zinc-700 mb-3" />
                  <p className="text-sm font-medium">No hay servicios programados para hoy</p>
                  <p className="text-xs text-zinc-600 mt-1">Presiona el botón "+" para crear uno</p>
                </div>
              ) : (
                dailyFilteredServices.map(service => {
                  const colColor = service.colaborador_id ? colMap.get(service.colaborador_id)?.color || '#3b82f6' : '#71717a';
                  const colName = service.colaborador_id ? colMap.get(service.colaborador_id)?.nombre : 'Sin Colaborador';
                  const colPhone = service.colaborador_id ? colMap.get(service.colaborador_id)?.telefono : null;
                  const provPhone = service.proveedor_id ? provMap.get(service.proveedor_id)?.telefono : null;

                  // Mensaje de WhatsApp
                  const wpMessage = `Hola ${service.cliente_grupo}, te saludamos de TourFlow. Te recordamos que tu traslado programado para el día ${format(parseISO(service.fecha), 'dd/MM/yyyy')} a las ${service.hora ? service.hora.slice(0, 5) : '08:00'} con ruta ${service.ruta_origen} hacia ${service.ruta_destino} está listo. Tu encargado asignado es ${colName}. ¡Buen viaje!`;
                  const wpUrl = `https://wa.me/${service.cliente_telefono ? service.cliente_telefono.replace(/[^0-9]/g, '') : ''}?text=${encodeURIComponent(wpMessage)}`;

                  return (
                    <Card
                      key={service.id}
                      onClick={() => handleOpenEditService(service)}
                      className="border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all overflow-hidden"
                    >
                      {/* Borde superior con color del colaborador */}
                      <div className="h-1" style={{ backgroundColor: colColor }} />
                      <CardHeader className="p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-blue-400 font-mono">
                              {service.hora ? service.hora.slice(0, 5) : '08:00'}
                            </span>
                            <Badge className="text-[10px] py-0 px-1.5 font-semibold bg-blue-950 text-blue-300 hover:bg-blue-950 border-blue-900">
                              X{service.pax_count} Pax
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge className={`text-[9px] font-semibold border ${getPagoBadgeColor(service.estado_pago)}`}>
                              {service.estado_pago}
                            </Badge>
                            <Badge className={`text-[9px] font-semibold border ${getRutaBadgeColor(service.estado_ruta)}`}>
                              {service.estado_ruta}
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className="text-base font-bold text-zinc-100 flex items-center justify-between">
                          {service.cliente_grupo}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="p-3 pt-0 text-xs space-y-2 text-zinc-300">
                        {/* Ruta */}
                        <div className="flex items-center gap-2 bg-zinc-950/50 p-2 rounded-lg border border-zinc-850">
                          <span className="font-semibold text-zinc-400">Ruta:</span>
                          <span className="text-zinc-200 font-medium">
                            {service.ruta_origen} ➔ {service.ruta_destino}
                          </span>
                        </div>

                        {/* Colaborador / Proveedor */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colColor }} />
                            <span className="text-[11px] truncate"><strong className="text-zinc-500">Colab:</strong> {colName}</span>
                          </div>
                          {service.proveedor_id && (
                            <div className="flex items-center gap-1 text-zinc-400">
                              <Briefcase className="h-3 w-3 text-zinc-500" />
                              <span className="text-[11px] truncate"><strong className="text-zinc-500">Prov:</strong> {provMap.get(service.proveedor_id)?.nombre}</span>
                            </div>
                          )}
                        </div>

                        {/* Transporte / Notas */}
                        {service.logistica_transporte && (
                          <p className="text-[11px] text-zinc-400 bg-zinc-950/20 p-1 px-2 rounded border border-zinc-900">
                            <strong className="text-zinc-500">Transporte:</strong> {service.logistica_transporte}
                          </p>
                        )}

                        {service.notas_adicionales && (
                          <p className="text-[11px] text-zinc-400 italic">
                            <strong className="text-zinc-500 not-italic">Notas:</strong> {service.notas_adicionales}
                          </p>
                        )}

                        {/* Vista de Comprobante */}
                        {service.comprobante_url && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-400">
                            <FileImage className="h-3.5 w-3.5" />
                            <span>Comprobante Adjunto</span>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="p-2 bg-zinc-950/40 border-t border-zinc-900 flex justify-end gap-1.5">
                        {/* Botón de Llamar al colaborador */}
                        {colPhone && (
                          <a
                            href={`tel:${colPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        )}

                        {/* Botón de Llamar al Proveedor */}
                        {provPhone && (
                          <a
                            href={`tel:${provPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1 text-[10px] font-semibold"
                          >
                            <Phone className="h-4 w-4" /> Prov
                          </a>
                        )}

                        {/* Botón WhatsApp */}
                        <a
                          href={wpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-2 rounded-lg bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-800/80 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <MessageSquare className="h-4 w-4" /> WhatsApp
                        </a>
                      </CardFooter>
                    </Card>
                  );
                })
              )}
            </div>

          </div>

          {/* Botón Flotante para Móvil para añadir nuevo servicio */}
          <div className="block md:hidden fixed bottom-6 right-6 z-40">
            <Button
              size="icon"
              onClick={() => handleOpenNewService()}
              className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-500 text-zinc-50 shadow-2xl flex items-center justify-center"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>

        </TabsContent>

        {/* --- PESTAÑA: CONFIGURACIÓN / CATÁLOGOS --- */}
        <TabsContent value="catalogos" className="flex-1 flex flex-col m-0 p-4 space-y-6 max-w-6xl mx-auto w-full">
          <Tabs defaultValue="colaboradores" className="w-full">
            <TabsList className="bg-zinc-900 border border-zinc-800 text-zinc-400">
              <TabsTrigger value="colaboradores" className="data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-50 gap-1 text-xs">
                <Users className="h-3.5 w-3.5" /> Colaboradores
              </TabsTrigger>
              <TabsTrigger value="proveedores" className="data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-50 gap-1 text-xs">
                <Briefcase className="h-3.5 w-3.5" /> Proveedores
              </TabsTrigger>
              <TabsTrigger value="plantillas" className="data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-50 gap-1 text-xs">
                <Compass className="h-3.5 w-3.5" /> Plantillas Itinerario
              </TabsTrigger>
            </TabsList>

            {/* TAB: COLABORADORES */}
            <TabsContent value="colaboradores" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-200">Encargados de Ruta / Guías</h3>
                  <p className="text-xs text-zinc-500">Maneja las personas que operarán los servicios.</p>
                </div>
                <Button size="sm" onClick={() => handleOpenColabDialog()} className="bg-blue-600 hover:bg-blue-500 text-zinc-50 gap-1 h-8">
                  <Plus className="h-4 w-4" /> Agregar Colaborador
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {colaboradores.map(colab => (
                  <Card key={colab.id} className="border-zinc-800 bg-zinc-900/30 overflow-hidden flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border border-zinc-800" style={{ backgroundColor: colab.color || '#3b82f6' }} />
                      <div>
                        <h4 className="font-bold text-zinc-100 flex items-center gap-1.5">
                          {colab.nombre}
                          {!colab.activo && <Badge className="bg-zinc-800 text-zinc-500 text-[8px] h-4">Inactivo</Badge>}
                        </h4>
                        {colab.telefono && <p className="text-xs font-mono text-zinc-500">{colab.telefono}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenColabDialog(colab)} className="h-8 w-8 text-zinc-400 hover:text-zinc-200">
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* TAB: PROVEEDORES */}
            <TabsContent value="proveedores" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-200">Proveedores de Servicios</h3>
                  <p className="text-xs text-zinc-500">Proveedores externos contratados (lanchas, picks-ups 4x4, etc).</p>
                </div>
                <Button size="sm" onClick={() => handleOpenProvDialog()} className="bg-blue-600 hover:bg-blue-500 text-zinc-50 gap-1 h-8">
                  <Plus className="h-4 w-4" /> Agregar Proveedor
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {proveedores.map(prov => (
                  <Card key={prov.id} className="border-zinc-800 bg-zinc-900/30 overflow-hidden flex items-center justify-between p-3.5">
                    <div>
                      <h4 className="font-bold text-zinc-100">{prov.nombre}</h4>
                      {prov.servicio && <p className="text-xs text-blue-400">{prov.servicio}</p>}
                      {prov.telefono && <p className="text-xs font-mono text-zinc-500 mt-0.5">{prov.telefono}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenProvDialog(prov)} className="h-8 w-8 text-zinc-400 hover:text-zinc-200">
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* TAB: PLANTILLAS ITINERARIO */}
            <TabsContent value="plantillas" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-200">Plantillas de Itinerario</h3>
                  <p className="text-xs text-zinc-500">Tours y traslados predefinidos para agilizar la agenda diaria.</p>
                </div>
                <Button size="sm" onClick={() => handleOpenPlantillaDialog()} className="bg-blue-600 hover:bg-blue-500 text-zinc-50 gap-1 h-8">
                  <Plus className="h-4 w-4" /> Agregar Plantilla
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plantillas.map(plt => (
                  <Card key={plt.id} className="border-zinc-800 bg-zinc-900/30 overflow-hidden flex flex-col justify-between p-4 space-y-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-zinc-100 text-base">{plt.titulo}</h4>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenPlantillaDialog(plt)} className="h-8 w-8 text-zinc-400 hover:text-zinc-200">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        <strong className="text-zinc-500">Ruta:</strong> {plt.ruta_origen} ➔ {plt.ruta_destino}
                      </p>
                      {plt.puntos_intermedios && plt.puntos_intermedios.length > 0 && (
                        <p className="text-[11px] text-zinc-500 mt-1 truncate">
                          <strong className="text-zinc-600">Intermedios:</strong> {plt.puntos_intermedios.join(', ')}
                        </p>
                      )}
                      {plt.notas_predeterminadas && (
                        <p className="text-[11px] text-zinc-500 italic mt-1 line-clamp-2">
                          <strong className="text-zinc-600 not-italic">Notas:</strong> {plt.notas_predeterminadas}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* 🛠️ DIÁLOGOS DE FORMULARIOS DE CREACIÓN / EDICIÓN */}
      {/* ========================================================================= */}

      {/* 1. DIÁLOGO: CREAR / EDITAR SERVICIO */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-100 overflow-y-auto max-h-[90vh] custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedServicio ? 'Editar Servicio Diario' : 'Crear Nuevo Servicio'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Programa los traslados y logísticas de tus clientes en la ruta.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveService} className="space-y-4 py-2">
            
            {/* Precarga de plantilla (Solo para nuevos registros) */}
            {!selectedServicio && (
              <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-lg border border-zinc-850">
                <Label htmlFor="template" className="text-zinc-400 text-xs font-semibold">Precargar desde Plantilla de Itinerario:</Label>
                <Select onValueChange={(val) => handleApplyTemplate(val || 'none')} defaultValue="none">
                  <SelectTrigger id="template" className="bg-zinc-950 border-zinc-800 h-9 text-sm text-zinc-200">
                    <SelectValue placeholder="Seleccionar una plantilla..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    <SelectItem value="none">Ninguna (Crear desde cero)</SelectItem>
                    {plantillas.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fecha" className="text-zinc-300 text-xs">Fecha*</Label>
                <Input
                  id="fecha"
                  type="date"
                  required
                  value={srvFecha}
                  onChange={(e) => setSrvFecha(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hora" className="text-zinc-300 text-xs">Hora sugerida</Label>
                <Input
                  id="hora"
                  type="time"
                  value={srvHora}
                  onChange={(e) => setSrvHora(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="cliente" className="text-zinc-300 text-xs">Nombre del Cliente / Grupo*</Label>
                <Input
                  id="cliente"
                  type="text"
                  required
                  placeholder="Ej: Zimmerman Corine"
                  value={srvCliente}
                  onChange={(e) => setSrvCliente(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pax" className="text-zinc-300 text-xs">Pax (Pasajeros)*</Label>
                <Input
                  id="pax"
                  type="number"
                  required
                  min={1}
                  value={srvPax}
                  onChange={(e) => setSrvPax(Number(e.target.value))}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cliente_tel" className="text-zinc-300 text-xs">Teléfono del Cliente (WhatsApp)</Label>
                <Input
                  id="cliente_tel"
                  type="tel"
                  placeholder="Ej: +50244445555"
                  value={srvClienteTelefono}
                  onChange={(e) => setSrvClienteTelefono(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="monto" className="text-zinc-300 text-xs">Monto Cobrado (Q/USD)</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  min={0}
                  value={srvMonto}
                  onChange={(e) => setSrvMonto(Number(e.target.value))}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="origen" className="text-zinc-300 text-xs">Ruta Origen*</Label>
                <Input
                  id="origen"
                  type="text"
                  required
                  placeholder="Ej: Cobán"
                  value={srvOrigen}
                  onChange={(e) => setSrvOrigen(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="destino" className="text-zinc-300 text-xs">Ruta Destino*</Label>
                <Input
                  id="destino"
                  type="text"
                  required
                  placeholder="Ej: Semuc"
                  value={srvDestino}
                  onChange={(e) => setSrvDestino(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="transporte" className="text-zinc-300 text-xs">Logística de Transporte</Label>
              <Input
                id="transporte"
                type="text"
                placeholder="Ej: vuelo UA1551 o lancha privada Cobán-Flores"
                value={srvLogistica}
                onChange={(e) => setSrvLogistica(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="colaborador" className="text-zinc-300 text-xs">Asignar Colaborador (Encargado)</Label>
                <Select value={srvColaboradorId} onValueChange={(val) => setSrvColaboradorId(val || '')}>
                  <SelectTrigger id="colaborador" className="bg-zinc-950 border-zinc-800 h-9 text-sm">
                    <SelectValue placeholder="Ninguno (Sin Asignar)" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    <SelectItem value="none">Sin Colaborador</SelectItem>
                    {colaboradores.filter(c => c.activo).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proveedor" className="text-zinc-300 text-xs">Asignar Proveedor Externo</Label>
                <Select value={srvProveedorId} onValueChange={(val) => setSrvProveedorId(val || '')}>
                  <SelectTrigger id="proveedor" className="bg-zinc-950 border-zinc-800 h-9 text-sm">
                    <SelectValue placeholder="Ninguno" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    <SelectItem value="none">Ninguno (Propio)</SelectItem>
                    {proveedores.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="estado_pago" className="text-zinc-300 text-xs">Estado Pago</Label>
                <Select value={srvEstadoPago} onValueChange={(val) => setSrvEstadoPago((val as EstadoPago) || 'Pendiente')}>
                  <SelectTrigger id="estado_pago" className="bg-zinc-950 border-zinc-800 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Abono Parcial">Abono Parcial</SelectItem>
                    <SelectItem value="Pagado Total">Pagado Total</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="estado_ruta" className="text-zinc-300 text-xs">Estado de Ruta</Label>
                <Select value={srvEstadoRuta} onValueChange={(val) => setSrvEstadoRuta((val as EstadoRuta) || 'No Iniciado')}>
                  <SelectTrigger id="estado_ruta" className="bg-zinc-950 border-zinc-800 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    <SelectItem value="No Iniciado">No Iniciado</SelectItem>
                    <SelectItem value="En Ruta">En Ruta</SelectItem>
                    <SelectItem value="Retrasado">Retrasado</SelectItem>
                    <SelectItem value="Completado">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notas" className="text-zinc-300 text-xs">Notas Adicionales / Instrucciones</Label>
              <Textarea
                id="notas"
                placeholder="Ingresa notas y detalles específicos..."
                rows={2}
                value={srvNotas}
                onChange={(e) => setSrvNotas(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-100 text-sm"
              />
            </div>

            {/* Módulo de Foto de Comprobante */}
            <div className="space-y-2">
              <Label className="text-zinc-300 text-xs block">Foto / Comprobante de Pago</Label>
              {srvComprobanteUrl ? (
                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 truncate">
                    <FileImage className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <a href={srvComprobanteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 underline hover:text-blue-300 truncate">
                      Ver Comprobante Abierto
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSrvComprobanteUrl('')}
                    className="h-8 w-8 text-zinc-500 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative border border-dashed border-zinc-850 bg-zinc-950/30 rounded-xl p-4 text-center hover:bg-zinc-950/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                      <span className="text-xs text-zinc-400">Subiendo imagen...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Upload className="h-5 w-5 text-zinc-500" />
                      <span className="text-xs text-zinc-300">Seleccionar imagen o tomar foto</span>
                      <span className="text-[10px] text-zinc-500">formatos soportados: JPG, PNG</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 pt-3 border-t border-zinc-850 flex items-center justify-between">
              {selectedServicio ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDeleteService}
                  disabled={loadingAction}
                  className="bg-red-950/30 text-red-400 border border-red-900/50 hover:bg-red-900/40 hover:text-red-300 gap-1.5"
                >
                  <Trash2 className="h-4 w-4" /> Eliminar
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsServiceDialogOpen(false)}
                  disabled={loadingAction}
                  className="bg-zinc-950 border-zinc-800 text-zinc-400"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loadingAction || uploadingImage} className="bg-blue-600 hover:bg-blue-500 text-zinc-50 font-semibold px-6">
                  {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Itinerario'}
                </Button>
              </div>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      {/* 2. DIÁLOGO: CREAR / EDITAR COLABORADOR */}
      <Dialog open={isColabDialogOpen} onOpenChange={setIsColabDialogOpen}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>{selectedColab ? 'Editar Colaborador' : 'Agregar Nuevo Colaborador'}</DialogTitle>
            <DialogDescription>
              Registra los encargados de guiar o conducir las rutas turísticas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveColaborador} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="colab_nombre" className="text-xs">Nombre Completo*</Label>
              <Input
                id="colab_nombre"
                type="text"
                required
                placeholder="Ej: Alex"
                value={colabNombre}
                onChange={(e) => setColabNombre(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="colab_telefono" className="text-xs">Teléfono</Label>
              <Input
                id="colab_telefono"
                type="tel"
                placeholder="Ej: +502 5555 6666"
                value={colabTelefono}
                onChange={(e) => setColabTelefono(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Color Asignado en Calendario</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={colabColor}
                  onChange={(e) => setColabColor(e.target.value)}
                  className="w-12 h-10 p-0.5 border-zinc-800 bg-zinc-950 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-zinc-400 uppercase">{colabColor}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                id="colab_activo"
                type="checkbox"
                checked={colabActivo}
                onChange={(e) => setColabActivo(e.target.checked)}
                className="h-4 w-4 bg-zinc-950 border-zinc-800 rounded text-blue-500 focus:ring-blue-500/30"
              />
              <Label htmlFor="colab_activo" className="text-xs text-zinc-300">Colaborador Activo (Disponible)</Label>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsColabDialogOpen(false)} className="bg-zinc-950 border-zinc-800">
                Cancelar
              </Button>
              <Button type="submit" disabled={loadingAction} className="bg-blue-600 hover:bg-blue-500 text-zinc-50">
                {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Colaborador'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. DIÁLOGO: CREAR / EDITAR PROVEEDOR */}
      <Dialog open={isProvDialogOpen} onOpenChange={setIsProvDialogOpen}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>{selectedProv ? 'Editar Proveedor' : 'Agregar Nuevo Proveedor'}</DialogTitle>
            <DialogDescription>
              Registra servicios de transportación externos de confianza.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProveedor} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prov_nombre" className="text-xs">Nombre del Proveedor*</Label>
              <Input
                id="prov_nombre"
                type="text"
                required
                placeholder="Ej: William 4x4"
                value={provNombre}
                onChange={(e) => setProvNombre(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prov_servicio" className="text-xs">Tipo de Servicio prestado</Label>
              <Input
                id="prov_servicio"
                type="text"
                placeholder="Ej: Lancha, Pick-up 4x4, Autobús"
                value={provServicio}
                onChange={(e) => setProvServicio(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prov_telefono" className="text-xs">Teléfono de contacto</Label>
              <Input
                id="prov_telefono"
                type="tel"
                placeholder="Ej: +502 4444 3333"
                value={provTelefono}
                onChange={(e) => setProvTelefono(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsProvDialogOpen(false)} className="bg-zinc-950 border-zinc-800">
                Cancelar
              </Button>
              <Button type="submit" disabled={loadingAction} className="bg-blue-600 hover:bg-blue-500 text-zinc-50">
                {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Proveedor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. DIÁLOGO: CREAR / EDITAR PLANTILLA */}
      <Dialog open={isPlantillaDialogOpen} onOpenChange={setIsPlantillaDialogOpen}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>{selectedPlantilla ? 'Editar Plantilla' : 'Agregar Nueva Plantilla'}</DialogTitle>
            <DialogDescription>
              Define plantillas de itinerario comunes para agilizar la asignación diaria.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePlantilla} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="plt_titulo" className="text-xs">Título de la Plantilla*</Label>
              <Input
                id="plt_titulo"
                type="text"
                required
                placeholder="Ej: Tour Semuc Champey"
                value={pltTitulo}
                onChange={(e) => setPltTitulo(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="plt_origen" className="text-xs">Ruta Origen*</Label>
                <Input
                  id="plt_origen"
                  type="text"
                  required
                  placeholder="Ej: Cobán"
                  value={pltOrigen}
                  onChange={(e) => setPltOrigen(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plt_destino" className="text-xs">Ruta Destino*</Label>
                <Input
                  id="plt_destino"
                  type="text"
                  required
                  placeholder="Ej: Semuc"
                  value={pltDestino}
                  onChange={(e) => setPltDestino(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plt_puntos" className="text-xs">Puntos Intermedios (Separados por coma)</Label>
              <Input
                id="plt_puntos"
                type="text"
                placeholder="Ej: Cruce Lanquin, Gasolinera, Puente"
                value={pltPuntos}
                onChange={(e) => setPltPuntos(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plt_hora" className="text-xs">Hora Sugerida</Label>
              <Input
                id="plt_hora"
                type="time"
                value={pltHora}
                onChange={(e) => setPltHora(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plt_notas" className="text-xs">Notas predeterminadas</Label>
              <Textarea
                id="plt_notas"
                placeholder="Ej: Coordinar lancha o 4x4..."
                rows={2}
                value={pltNotas}
                onChange={(e) => setPltNotas(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsPlantillaDialogOpen(false)} className="bg-zinc-950 border-zinc-800">
                Cancelar
              </Button>
              <Button type="submit" disabled={loadingAction} className="bg-blue-600 hover:bg-blue-500 text-zinc-50">
                {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Plantilla'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
