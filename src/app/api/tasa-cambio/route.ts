import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=GTQ', {
      next: { revalidate: 3600 }, // cache 1 hora, no llamar la API externa en cada visita
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Error al obtener tipo de cambio' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'No se pudo conectar con el servicio de cambio de divisas' },
      { status: 503 }
    );
  }
}
