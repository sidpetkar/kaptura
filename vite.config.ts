import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';

function lutManifestPlugin(): Plugin {
  function scanLuts(dir: string, base: string): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...scanLuts(full, base));
      } else if (entry.name.endsWith('.cube')) {
        const rel = '/' + path.relative(base, full).replace(/\\/g, '/');
        const encoded = rel.split('/').map(seg => encodeURIComponent(seg)).join('/');
        results.push(encoded);
      }
    }
    return results;
  }

  function generate(publicDir: string) {
    const lutsDir = path.join(publicDir, 'luts');
    if (!fs.existsSync(lutsDir)) {
      fs.mkdirSync(lutsDir, { recursive: true });
    }
    const files = scanLuts(lutsDir, publicDir);
    const manifest = JSON.stringify(files);
    const outPath = path.join(lutsDir, 'manifest.json');
    fs.writeFileSync(outPath, manifest, 'utf-8');
    return files.length;
  }

  return {
    name: 'lut-manifest',
    configResolved(config) {
      const count = generate(config.publicDir);
      console.log(`[lut-manifest] Found ${count} .cube files`);
    },
    configureServer(server) {
      const publicDir = server.config.publicDir;
      server.watcher.on('add', (p: string) => {
        if (p.endsWith('.cube')) generate(publicDir);
      });
      server.watcher.on('unlink', (p: string) => {
        if (p.endsWith('.cube')) generate(publicDir);
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    lutManifestPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fonts/**/*'],
      manifest: {
        name: 'KAPTURA',
        short_name: 'KAPTURA',
        description: 'LUT-based photo editor & camera',
        theme_color: '#212421',
        background_color: '#212421',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /\/luts\/.*\.cube$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'lut-cache',
              expiration: { maxEntries: 200 },
            },
          },
          {
            urlPattern: /r2\.dev\/luts\/.*\.cube$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'lut-cache-r2',
              expiration: { maxEntries: 200 },
            },
          },
        ],
      },
    }),
  ],
});
