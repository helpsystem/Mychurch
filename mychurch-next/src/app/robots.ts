import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/profile',
          '/verify-admin-login',
          '/login-status',
          '/restore-access',
        ],
      },
    ],
    sitemap: 'https://www.iranianchurchdc.com/sitemap.xml',
    host: 'https://www.iranianchurchdc.com',
  }
}
