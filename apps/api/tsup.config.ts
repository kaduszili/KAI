import { defineConfig } from 'tsup'

export default defineConfig({
  entry:      ['src/index.ts'],
  format:     ['esm'],
  target:     'node22',
  outDir:     'dist',
  bundle:     true,
  // Inline the workspace TypeScript package (@kai/shared) so the server
  // does not need pnpm workspace symlinks at runtime.
  // All npm packages remain external and are installed via npm install.
  noExternal: [/@kai\/.*/],
  clean:      true,
})
