import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const session = request.cookies.get('tourflow_session');
  const { pathname } = request.nextUrl;

  // Si no hay sesión activa y no estamos en la página de login, redirige a /login
  if (!session && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si ya hay una sesión activa e intenta acceder a /login, lo envía a la raíz
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Protege todas las páginas del sistema excepto:
     * - _next/static (estilos, javascript compilado)
     * - _next/image (imágenes optimizadas de Next.js)
     * - favicon.ico, manifest.json, manifest.ts, sw.js, workbox-*.js (PWA y Service Worker)
     * - icon-*.png (iconos generados de la app)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.ts|manifest.json|sw.js|workbox-.*.js|icon-.*.png).*)',
  ],
};
