const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, 'dist');
if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
}
fs.mkdirSync(dist, { recursive: true });

// Copy index.html
fs.copyFileSync('index.html', path.join(dist, 'index.html'));

// Copy Projek-NPP.html
if (fs.existsSync('Projek-NPP.html')) {
  fs.copyFileSync('Projek-NPP.html', path.join(dist, 'Projek-NPP.html'));
}

// Copy product-detail.html
if (fs.existsSync('product-detail.html')) {
  fs.copyFileSync('product-detail.html', path.join(dist, 'product-detail.html'));
}

// Copy src
if (fs.existsSync('src')) {
  fs.cpSync('src', path.join(dist, 'src'), { recursive: true });
}

// Copy assets
if (fs.existsSync('assets')) {
  fs.cpSync('assets', path.join(dist, 'assets'), { recursive: true });
}

console.log('Build complete: pure static files deployed to dist/');
