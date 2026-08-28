import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'MyChurch Platform',
        short_name: 'MyChurch',
        description: 'Iranian Christian Church of Washington D.C.',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        dir: 'rtl',
        lang: 'fa',
        icons: [
            {
                // 'any' purpose — required by all browsers for home screen icon
                src: '/logo.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
            },
            {
                // 'maskable' purpose — for adaptive icon support (Android)
                src: '/logo-transparent.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
            },
        ],
    }
}
