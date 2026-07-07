import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from 'react-international-phone';
import { Loader2, Trash2 } from 'lucide-react';
import { saveProveedor, deleteProveedor, getProveedores } from '@/app/actions/db';
import { Proveedor } from '@/types';

interface ProveedorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedor: Proveedor | null;
  onSuccess: (proveedores: Proveedor[]) => void;
}

export default function ProveedorDialog({ open, onOpenChange, proveedor, onSuccess }: ProveedorDialogProps) {
  const [nombre, setNombre] = useState('');
  const [servicio, setServicio] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setNombre(proveedor?.nombre || '');
      setServicio(proveedor?.servicio || '');
      setTelefono(proveedor?.telefono || '');
      setIsConfirmingDelete(false);
    }
  }, [open, proveedor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setLoading(true);
    const res = await saveProveedor({
      id: proveedor?.id,
      nombre,
      servicio: servicio || null,
      telefono: telefono || null
    });

    setLoading(false);
    if (res.success) {
      onOpenChange(false);
      const data = await getProveedores();
      onSuccess(data);
    } else {
      alert(`Error al guardar: ${res.error}`);
    }
  };

  const handleDelete = async () => {
    if (!proveedor) return;
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }

    setLoading(true);
    try {
      const res = await deleteProveedor(proveedor.id);
      if (res.success) {
        onOpenChange(false);
        const data = await getProveedores();
        onSuccess(data);
      } else {
        alert(`Error al eliminar: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>{proveedor ? 'Editar Proveedor' : 'Agregar Nuevo Proveedor'}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Registra servicios de transportación externos de confianza.
          </DialogDescription>
        </DialogHeader>

        <form id="prov-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="prov_nombre" className="text-xs text-zinc-400">Nombre del Proveedor*</Label>
            <Input
              id="prov_nombre"
              type="text"
              required
              placeholder="Ej: William 4x4"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-zinc-100"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prov_servicio" className="text-xs text-zinc-400">Tipo de Servicio prestado</Label>
            <Input
              id="prov_servicio"
              type="text"
              placeholder="Ej: Lancha, Pick-up 4x4, Autobús"
              value={servicio}
              onChange={(e) => setServicio(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-zinc-100"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs block text-zinc-400">Teléfono de contacto</Label>
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
        </form>

        <DialogFooter className="gap-2 flex flex-row items-center justify-between">
          {proveedor ? (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-950/30 text-red-400 border border-red-900/50 hover:bg-red-900/40 hover:text-red-300 gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              {isConfirmingDelete ? '¿Seguro?' : 'Eliminar'}
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-zinc-950 border-zinc-800" disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" form="prov-form" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-zinc-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Proveedor'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
