import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'MyChurch Platform',
        short_name: 'MyChurch',
        description: 'Iranian Christian Church of Washington D.C.',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#3b82f6',
        icons: [
            {
                src: '/logo-transparent.png',
                sizes: 'any',
                type: 'image/png',
            },
        ],
    }
}
