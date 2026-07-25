import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('Error: dist/index.html not found. Please run npm run build first.');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf-8');

// Find all CSS link tags
const cssRegex = /<link\s+[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/gi;
html = html.replace(cssRegex, (match, relativeHref) => {
  const cssFileName = path.basename(relativeHref);
  const cssPath = path.join(distDir, 'assets', cssFileName);
  
  if (fs.existsSync(cssPath)) {
    console.log(`Inlining CSS: ${cssFileName}`);
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    return `<style>${cssContent}</style>`;
  } else {
    console.warn(`Warning: CSS file not found at ${cssPath}`);
    return match;
  }
});

// Find all module script tags
const jsRegex = /<script\s+[^>]*type="module"[^>]*src="([^"]+)"[^>]*><\/script>/gi;
html = html.replace(jsRegex, (match, relativeSrc) => {
  const jsFileName = path.basename(relativeSrc);
  const jsPath = path.join(distDir, 'assets', jsFileName);

  if (fs.existsSync(jsPath)) {
    console.log(`Inlining JS: ${jsFileName}`);
    const jsContent = fs.readFileSync(jsPath, 'utf-8');
    return `<script type="module">${jsContent}</script>`;
  } else {
    console.warn(`Warning: JS file not found at ${jsPath}`);
    return match;
  }
});

// Also handle preloads if any
const preloadRegex = /<link\s+[^>]*rel="modulepreload"[^>]*href="[^"]+"[^>]*>/gi;
html = html.replace(preloadRegex, '');

// Save the self-contained HTML
const rootSinglePath = path.join(__dirname, 'index-single.html');
const publicSinglePath = path.join(publicDir, 'index-single.html');
const distSinglePath = path.join(distDir, 'index-single.html');
const dist404Path = path.join(distDir, '404.html');
const distNoJekyllPath = path.join(distDir, '.nojekyll');

fs.writeFileSync(rootSinglePath, html);
fs.writeFileSync(publicSinglePath, html);
fs.writeFileSync(distSinglePath, html);
fs.writeFileSync(dist404Path, fs.readFileSync(indexPath, 'utf-8'));
fs.writeFileSync(distNoJekyllPath, '');

console.log(`Success! GitHub Pages assets generated in dist/:`);
console.log(`- ${dist404Path}`);
console.log(`- ${distNoJekyllPath}`);
console.log(`- ${distSinglePath}`);
