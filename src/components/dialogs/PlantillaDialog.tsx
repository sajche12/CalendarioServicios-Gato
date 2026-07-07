import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { savePlantilla, getPlantillas } from '@/app/actions/db';
import { PlantillaItinerario } from '@/types';

interface PlantillaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plantilla: PlantillaItinerario | null;
  onSuccess: (plantillas: PlantillaItinerario[]) => void;
}

export default function PlantillaDialog({ open, onOpenChange, plantilla, onSuccess }: PlantillaDialogProps) {
  const [titulo, setTitulo] = useState('');
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [puntos, setPuntos] = useState('');
  const [hora, setHora] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitulo(plantilla?.titulo || '');
      setOrigen(plantilla?.ruta_origen || '');
      setDestino(plantilla?.ruta_destino || '');
      setPuntos(plantilla?.puntos_intermedios?.join(', ') || '');
      setHora(plantilla?.hora_sugerida || '');
      setNotas(plantilla?.notas_predeterminadas || '');
    }
  }, [open, plantilla]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !origen.trim() || !destino.trim()) return;

    setLoading(true);
    const res = await savePlantilla({
      id: plantilla?.id,
      titulo,
      ruta_origen: origen,
      ruta_destino: destino,
      puntos_intermedios: puntos
        ? puntos.split(',').map(p => p.trim()).filter(Boolean)
        : [],
      hora_sugerida: hora || null,
      notas_predeterminadas: notas || null
    });

    setLoading(false);
    if (res.success) {
      onOpenChange(false);
      const data = await getPlantillas();
      onSuccess(data);
    } else {
      alert(`Error al guardar: ${res.error}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>{plantilla ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Define rutas frecuentes y su logística sugerida para precargar servicios rápidamente.
          </DialogDescription>
        </DialogHeader>

        <form id="plantilla-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="plt_titulo" className="text-xs text-zinc-400">Nombre de la Plantilla*</Label>
            <Input
              id="plt_titulo"
              type="text"
              required
              placeholder="Ej: Tour Semuc Champey Completo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="plt_origen" className="text-xs text-zinc-400">Origen de Ruta*</Label>
              <Input
                id="plt_origen"
                type="text"
                required
                placeholder="Ej: Cobán"
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plt_destino" className="text-xs text-zinc-400">Destino de Ruta*</Label>
              <Input
                id="plt_destino"
                type="text"
                required
                placeholder="Ej: Semuc Champey"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plt_puntos" className="text-xs text-zinc-400">Puntos Intermedios (separados por coma)</Label>
            <Input
              id="plt_puntos"
              type="text"
              placeholder="Ej: Lanquín, Las Grutas, El Portal"
              value={puntos}
              onChange={(e) => setPuntos(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-zinc-100"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plt_hora" className="text-xs text-zinc-400">Hora Sugerida de Salida</Label>
            <Input
              id="plt_hora"
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-zinc-100"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plt_notas" className="text-xs text-zinc-400">Notas Predeterminadas</Label>
            <Textarea
              id="plt_notas"
              placeholder="Ej: Coordinar pick-up 4x4 o lancha con anticipación."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-zinc-100 min-h-[80px]"
            />
          </div>
        </form>

        <DialogFooter className="gap-2 -mx-4 -mb-4 px-4 pb-4 border-t border-zinc-800 mt-2 pt-4 flex flex-row items-center justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-zinc-950 border-zinc-800" disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="plantilla-form" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-zinc-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Plantilla'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
