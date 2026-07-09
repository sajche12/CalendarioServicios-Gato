import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=GTQ', {
      next: { revalidate: 3600 }, // Cache por 1 hora en el servidor
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Error al obtener tipo de cambio de Frankfurter' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'No se pudo conectar con el servidor de divisas' },
      { status: 503 }
    );
  }
}
