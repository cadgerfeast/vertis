// Helpers
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import * as path from 'node:path';
import { version, dependencies } from './package.json';

export default defineConfig({
  plugins: [dts({ entryRoot: './src', include: ['./src'] })],
  build: {
    emptyOutDir: false,
    lib: {
      entry: [
        path.resolve(__dirname, './src/cli.ts'),
        path.resolve(__dirname, './src/index.ts'),
        path.resolve(__dirname, './src/client.ts')
      ],
      formats: ['es']
    },
    rollupOptions: {
      external: [
        ...Object.keys(dependencies),
        'util',
        'path',
        'fs',
        'url',
        'assert'
      ]
    }
  },
  define: {
    __VERSION__: `'${version}'`
  }
});
