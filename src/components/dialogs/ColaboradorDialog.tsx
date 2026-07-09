import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from 'react-international-phone';
import { Loader2 } from 'lucide-react';
import { saveColaborador, getColaboradores } from '@/app/actions/db';
import { Colaborador } from '@/types';

interface ColaboradorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaborador: Colaborador | null;
  onSuccess: (colaboradores: Colaborador[]) => void;
}

export default function ColaboradorDialog({ open, onOpenChange, colaborador, onSuccess }: ColaboradorDialogProps) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [activo, setActivo] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setNombre(colaborador?.nombre || '');
      setTelefono(colaborador?.telefono || '');
      setColor(colaborador?.color || '#3b82f6');
      setActivo(colaborador ? colaborador.activo : true);
    }
  }, [open, colaborador]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setLoading(true);
    const res = await saveColaborador({
      id: colaborador?.id,
      nombre,
      telefono: telefono || null,
      color: color || null,
      activo
    });

    setLoading(false);
    if (res.success) {
      onOpenChange(false);
      const data = await getColaboradores();
      onSuccess(data);
    } else {
      alert(`Error al guardar: ${res.error}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>{colaborador ? 'Editar Colaborador' : 'Agregar Nuevo Colaborador'}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Registra los encargados de guiar o conducir las rutas turísticas.
          </DialogDescription>
        </DialogHeader>

        <form id="colab-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="colab_nombre" className="text-xs text-zinc-400">Nombre Completo*</Label>
            <Input
              id="colab_nombre"
              type="text"
              required
              placeholder="Ej: Alex"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-zinc-100"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs block text-zinc-400">Teléfono</Label>
            <PhoneInput
              defaultCountry="gt"
              value={telefono}
              onChange={(phone) => setTelefono(phone)}
              inputClassName="w-full flex-1 bg-zinc-950 border-zinc-800 h-9 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
              countrySelectorStyleProps={{
                buttonClassName: "bg-zinc-950 border border-zinc-800 h-9 rounded-l-lg px-2 flex items-center justify-center hover:bg-zinc-900 transition-colors"
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Color Asignado en Calendario</Label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 p-0.5 border-zinc-800 bg-zinc-950 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono text-zinc-400 uppercase">{color}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              id="colab_activo"
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4 bg-zinc-950 border-zinc-800 rounded text-blue-500 focus:ring-blue-500/30"
            />
            <Label htmlFor="colab_activo" className="text-xs text-zinc-300">Colaborador Activo (Disponible)</Label>
          </div>
        </form>

        <DialogFooter className="gap-2 -mx-4 -mb-4 px-4 pb-4 border-t border-zinc-800 mt-2 pt-4 flex flex-row items-center justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-zinc-950 border-zinc-800" disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="colab-form" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-zinc-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Colaborador'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
