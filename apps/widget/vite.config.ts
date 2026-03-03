import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    __API_URL__: JSON.stringify(process.env.API_URL ?? 'http://localhost:3001'),
  },
  build: {
    lib: {
      entry:    'src/index.ts',
      name:     'KAIWidget',
      formats:  ['iife'],
      fileName: () => 'widget.js',
    },
    // Output into web's public dir so Vite dev server serves /widget.js
    outDir:      '../web/public',
    emptyOutDir: false,
    minify:      'esbuild',
    rollupOptions: {
      external: [], // bundle everything — zero runtime deps
    },
  },
})
