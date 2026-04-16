import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ayah in Action',
    short_name: 'Ayah',
    description: 'Track how Quran ayahs change your daily life',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8f1e3',
    theme_color: '#0a6650',
    prefer_related_applications: false,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    shortcuts: [
      {
        name: 'Open Sanctuary',
        short_name: 'Sanctuary',
        description: 'Go to your daily Ayah and reflection space',
        url: '/dashboard',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Life Whisper',
        short_name: 'Whisper',
        description: 'Get AI-powered Quranic guidance for your challenge',
        url: '/whisper',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'The Archive',
        short_name: 'Archive',
        description: 'View your reflection history',
        url: '/history',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
    screenshots: [
      { src: '/screenshots/dashboard.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow' },
    ],
  };
}
