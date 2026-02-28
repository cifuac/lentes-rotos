import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const dist = './dist';
const assets = join(dist, 'assets');

// Find built files
const files = readdirSync(assets);
const cssFile = files.find(f => f.endsWith('.css'));
const jsFile = files.find(f => f.endsWith('.js'));

// Read built assets
const css = readFileSync(join(assets, cssFile), 'utf-8');
const js = readFileSync(join(assets, jsFile), 'utf-8');
const html = readFileSync(join(dist, 'index.html'), 'utf-8');

// Convert images to base64 data URIs
const imgDir = join(dist, 'images');
const dickB64 = readFileSync(join(imgDir, 'philip-k-dick.jpg')).toString('base64');

// No JS image replacements needed (images removed from lens panel)
let inlinedJs = js;

// Build single HTML file
let singleHtml = html
  // Remove script and link tags for assets
  .replace(/<script type="module" crossorigin src="[^"]*"><\/script>/, '')
  .replace(/<link rel="stylesheet" crossorigin href="[^"]*">/, '')
  // Replace portrait image src with base64
  .replace(/src="\.\/images\/philip-k-dick\.jpg"/, `src="data:image/jpeg;base64,${dickB64}"`)
  // Insert inline CSS before </head>
  .replace('</head>', `  <style>\n${css}\n  </style>\n</head>`)
  // Insert inline JS before </body>
  .replace('</body>', `  <script>\n${inlinedJs}\n  </script>\n</body>`);

writeFileSync(join(dist, 'lentes-rotos.html'), singleHtml);

const size = (Buffer.byteLength(singleHtml) / 1024).toFixed(0);
console.log(`lentes-rotos.html created (${size} KB)`);
