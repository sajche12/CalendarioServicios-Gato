'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyPasscode } from '../actions/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Por favor ingresa el código de acceso.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await verifyPasscode(passcode);
      if (response.success) {
        router.refresh();
        router.push('/');
      } else {
        setError(response.error || 'Código incorrecto');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/10 blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-orange-500/10 blur-[80px]" />

      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-zinc-200 to-orange-400 bg-clip-text text-transparent mb-2">
            TourFlow
          </h1>
          <p className="text-zinc-400 text-sm">
            Sistema de Gestión Logística
          </p>
        </div>

        <Card className="border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-zinc-800/80 border border-zinc-700/50 rounded-full text-blue-400">
                <Lock className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-bold text-zinc-100">Pantalla de Bloqueo</CardTitle>
            <CardDescription className="text-center text-zinc-400">
              Ingresa el código de acceso para entrar al panel.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="text-red-400 bg-red-950/30 border border-red-900/40 p-3 rounded-lg text-sm text-center animate-in shake duration-300">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="passcode" className="text-zinc-300 font-medium">Código de Acceso</Label>
                <div className="relative">
                  <Input
                    id="passcode"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    disabled={loading}
                    className="pr-10 border-zinc-800 bg-zinc-950/80 text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 transition-all font-semibold py-6 rounded-lg relative overflow-hidden"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando...
                  </span>
                ) : (
                  'Ingresar'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-zinc-600 mt-6">
          © {new Date().getFullYear()} TourFlow. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
