import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import {defineConfig} from 'vite';

// Automatically generate crisp PNG PWA icons from SVG with precise dimensions
function generatePWAIcons() {
  try {
    const publicPath = path.resolve(__dirname, 'public');
    const svgPath = path.resolve(publicPath, 'pwa-icon.svg');
    const png192Path = path.resolve(publicPath, 'pwa-icon-192.png');
    const png512Path = path.resolve(publicPath, 'pwa-icon-512.png');
    const pngDefaultPath = path.resolve(publicPath, 'pwa-icon.png');

    if (fs.existsSync(svgPath)) {
      console.log('PWA Icon Generator: Rendering vector icons from SVG...');
      sharp(svgPath)
        .resize(192, 192)
        .png()
        .toFile(png192Path)
        .then(() => console.log('✓ Generated pwa-icon-192.png with correct 192x192 dimensions'))
        .catch(err => console.error('Error generating pwa-icon-192.png:', err));

      sharp(svgPath)
        .resize(512, 512)
        .png()
        .toFile(png512Path)
        .then(() => console.log('✓ Generated pwa-icon-512.png with correct 512x512 dimensions'))
        .catch(err => console.error('Error generating pwa-icon-512.png:', err));

      sharp(svgPath)
        .resize(512, 512)
        .png()
        .toFile(pngDefaultPath)
        .then(() => console.log('✓ Synchronized pwa-icon.png fallback'))
        .catch(err => console.error('Error generating pwa-icon.png:', err));

      sharp(svgPath)
        .resize(64, 64)
        .png()
        .toFile(path.resolve(publicPath, 'favicon.ico'))
        .then(() => console.log('✓ Generated favicon.ico as 64x64 fallback'))
        .catch(err => console.error('Error generating favicon.ico:', err));
    } else {
      console.warn('PWA Icon Generator: pwa-icon.svg not found in public/');
    }
  } catch (error) {
    console.error('PWA Icon Generator: Failed to run sharp:', error);
  }
}

// Call on load
generatePWAIcons();

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'inject-sw-assets',
        closeBundle() {
          try {
            const distPath = path.resolve(__dirname, 'dist');
            if (!fs.existsSync(distPath)) return;
            
            const assetsPath = path.resolve(distPath, 'assets');
            if (!fs.existsSync(assetsPath)) return;
            
            const files = fs.readdirSync(assetsPath);
            // Ignore map files
            const assetUrls = files
              .filter(file => !file.endsWith('.map'))
              .map(file => `/assets/${file}`);
            
            const swPath = path.resolve(distPath, 'sw.js');
            if (fs.existsSync(swPath)) {
              let swContent = fs.readFileSync(swPath, 'utf-8');
              const filesString = assetUrls.map(url => `  "${url}"`).join(',\n');
              swContent = swContent.replace('// __VITE_ASSETS_HOLDER__', filesString);
              fs.writeFileSync(swPath, swContent, 'utf-8');
              console.log('Successfully injected assets into production sw.js:', assetUrls);
            }
          } catch (e) {
            console.error('Failed to inject assets into SW:', e);
          }
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
