import { defineConfig } from 'tsup'

export default defineConfig([
  {
    // Standalone node server — local dev & FTP deployment
    entry:      ['src/index.ts'],
    format:     ['esm'],
    target:     'node22',
    outDir:     'dist',
    bundle:     true,
    splitting:  false,
    noExternal: [/.*/],
    clean:      true,
  },
  {
    // Vercel serverless handler — self-contained bundle → api/index.js
    // _handler.ts is ignored by Vercel (underscore prefix); api/index.js is deployed as the function
    entry:      { index: 'api/_handler.ts' },
    format:     ['esm'],
    target:     'node22',
    outDir:     'api',
    bundle:     true,
    splitting:  false,
    noExternal: [/.*/],
    clean:      false, // don't wipe api/ dir — source files (_handler.ts) live there
  },
])
