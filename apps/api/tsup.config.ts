import { defineConfig } from 'tsup'

export default defineConfig({
  entry:      ['src/index.ts'],
  format:     ['esm'],
  target:     'node22',
  outDir:     'dist',
  bundle:     true,
  splitting:  false,  // single output file — no chunk imports to manage on server
  // Bundle ALL dependencies (workspace + npm packages) into a single file
  // so the server needs no npm install — upload index.js + .env and done.
  noExternal: [/.*/],
  clean:      true,
})
