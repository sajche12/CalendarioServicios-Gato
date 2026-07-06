import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TourFlow - Gestión Logística',
    short_name: 'TourFlow',
    description: 'Sistema de gestión y programación de logística diaria para turismo.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b', // Zinc 950
    theme_color: '#09090b',
    orientation: 'portrait',
    scope: '/',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
