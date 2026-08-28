import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.iranianchurchdc.com'

  const pages: Array<{
    path: string;
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority: number;
  }> = [
    { path: '',              changeFrequency: 'daily',   priority: 1.0 },
    { path: '/about',        changeFrequency: 'monthly', priority: 0.8 },
    { path: '/gallery',      changeFrequency: 'weekly',  priority: 0.7 },
    { path: '/sermons',      changeFrequency: 'weekly',  priority: 0.9 },
    { path: '/worship',      changeFrequency: 'weekly',  priority: 0.9 },
    { path: '/prayers',      changeFrequency: 'daily',   priority: 0.8 },
    { path: '/payment',      changeFrequency: 'monthly', priority: 0.7 },
    { path: '/bible',        changeFrequency: 'weekly',  priority: 0.9 },
    { path: '/contact',      changeFrequency: 'monthly', priority: 0.6 },
    { path: '/schedule',     changeFrequency: 'weekly',  priority: 0.7 },
    { path: '/broadcast/view', changeFrequency: 'daily', priority: 0.9 },
  ]

  return pages.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }))
}
