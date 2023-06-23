import { resolve } from 'path';
import { defineConfig } from 'vite';

import dts from 'vite-plugin-dts';

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
    assetsInclude: ['**/*.gltf'],
    base: '',
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'shapez-viewer',
            fileName: 'shapez-viewer',
        },
        rollupOptions: {
          external: ['three'],
        },
    },
    plugins: [dts()],
});
