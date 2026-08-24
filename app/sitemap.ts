import { MetadataRoute } from 'next';

// Base URL follows APP_URL so preview/staging environments generate correct
// sitemaps; production keeps the canonical domain as fallback.
const SITE_URL = (process.env.APP_URL ?? 'https://ng-hiphop.com').replace(/\/+$/, '');

function url(path: string): string {
  return `${SITE_URL}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: url(''),
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
    {
      url: url('/library'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: url('/game/best-lyrics'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: url('/submissions/status'),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: url('/terms'),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: url('/privacy'),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
