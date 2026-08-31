import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        // offline.html/manifest.json/icons live in public/ and are copied
        // verbatim into the build output, so they need to be swept up too.
        globPatterns: ['**/*.{js,css,html,png,svg,json,webmanifest}'],
      },
      manifest: false, // we hand-author public/manifest.json ourselves
      injectRegister: false, // we call navigator.serviceWorker.register() ourselves
      // devOptions is deliberately left off: under `vite dev` the plugin serves
      // the dev service worker at its own virtual path, not the plain /sw.js
      // we register at, so enabling it here just breaks registration. Service
      // workers are a production/build concern anyway — verify the install +
      // offline flow with `npm run build && npm run preview` instead (see
      // src/pwa/sw-register.js, which skips registration during `vite dev`).
    }),
  ],
});
