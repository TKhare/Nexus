/**
 * Build script for Chrome extension
 * Copies static files after Vite build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Copy manifest.json
console.log('Copying manifest.json...');
fs.copyFileSync('manifest.json', 'dist/manifest.json');

// Copy content.css
console.log('Copying content.css...');
if (!fs.existsSync('dist/content')) {
  fs.mkdirSync('dist/content', { recursive: true });
}
fs.copyFileSync('content/content.css', 'dist/content/content.css');

// Copy icons if they exist in public/icons
console.log('Copying icons...');
if (!fs.existsSync('dist/icons')) {
  fs.mkdirSync('dist/icons', { recursive: true });
}

const iconDir = 'public/icons';
if (fs.existsSync(iconDir)) {
  const icons = fs.readdirSync(iconDir);
  icons.forEach(icon => {
    if (icon.endsWith('.png')) {
      fs.copyFileSync(
        path.join(iconDir, icon),
        path.join('dist/icons', icon)
      );
      console.log(`  Copied ${icon}`);
    }
  });
}

// Create placeholder icons if they don't exist
const iconSizes = [16, 48, 128];
iconSizes.forEach(size => {
  const iconPath = `dist/icons/icon${size}.png`;
  if (!fs.existsSync(iconPath)) {
    console.log(`  Creating placeholder icon${size}.png`);
    // Simple 1x1 transparent PNG in base64
    const base64Icon = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(base64Icon, 'base64');
    fs.writeFileSync(iconPath, buffer);
  }
});

// Ensure images directory exists
if (!fs.existsSync('dist/images')) {
  fs.mkdirSync('dist/images', { recursive: true });
}

console.log('✅ Extension build complete!');
console.log('📂 Location: dist/');
console.log('🚀 Ready to load in Chrome at chrome://extensions/');
