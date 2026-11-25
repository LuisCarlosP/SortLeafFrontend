import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function httpsOrigin(value: string | undefined, setting: string): string {
  if (value) {
    try {
      const url = new URL(value)
      if (url.protocol === 'https:' && value === url.origin) return url.origin
    } catch { /* Report the setting name without logging its value. */ }
  }
  throw new Error(`Configura ${setting} con un origen HTTPS sin ruta ni barra final.`)
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const onVercel = mode === 'vercel'
  const base = onVercel ? '/' : env.VITE_BASE_PATH || '/'
  const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  const site = onVercel
    ? httpsOrigin(env.VITE_SITE_URL?.replace(/\/$/, '') || (vercelDomain && `https://${vercelDomain}`), 'VITE_SITE_URL o el dominio de Vercel')
    : (env.VITE_SITE_URL || 'http://localhost:5173' + base).replace(/\/$/, '')
  if (onVercel) {
    httpsOrigin(process.env.BACKEND_URL, 'BACKEND_URL')
    if (!process.env.API_KEY?.trim()) throw new Error('Configura API_KEY en el entorno de Vercel.')
  }
  const publicFiles = {
    'robots.txt': [
      'User-agent: *', 'Allow: ' + base, 'Disallow: ' + base + 'auth/',
      'Disallow: ' + base + 'profile', 'Sitemap: ' + site + '/sitemap.xml', '',
    ].join('\n'),
    'sitemap.xml': [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...['/', '/privacy', '/resources'].map(path => '  <url><loc>' + site + path + '</loc></url>'),
      '</urlset>', '',
    ].join('\n'),
  }
  return {
    envPrefix: onVercel ? ['VITE_EMAILJS_', 'VITE_ENABLE_VISION_LAB'] : 'VITE_',
    define: onVercel ? {
      'import.meta.env.VITE_API_URL': JSON.stringify('/api'),
      'import.meta.env.VITE_SITE_URL': JSON.stringify(site),
    } : undefined,
    plugins: [
      react(),
      {
        name: 'sortleaf-site-urls',
        transformIndexHtml: { order: 'pre', handler: html => html.replaceAll('%VITE_SITE_URL%', site) },
        configureServer(server) {
          for (const [name, content] of Object.entries(publicFiles)) {
            server.middlewares.use(base + name, (_request, response) => {
              response.setHeader('Content-Type', name.endsWith('.xml') ? 'application/xml' : 'text/plain')
              response.end(content)
            })
          }
        },
        generateBundle() {
          for (const [fileName, source] of Object.entries(publicFiles)) {
            this.emitFile({ type: 'asset', fileName, source })
          }
        },
      },
    ],
    base,
    build: {
      outDir: 'docs',
      rollupOptions: {
        input: onVercel ? 'index.html' : { index: 'index.html', notFound: '404.html' },
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'map-vendor': ['leaflet', 'react-leaflet'],
          }
        }
      },
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 500,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom']
    }
  }
})
