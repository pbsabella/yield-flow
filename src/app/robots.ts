import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/investments', '/cashflow'],
      disallow: '/settings', // Usually best to keep settings out of search results
    },
    sitemap: 'https://yield-flow-lab.vercel.app/sitemap.xml',
  }
}
