const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, 'dist');
if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
}
fs.mkdirSync(dist, { recursive: true });

function copyDirectoryRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ============================================================================
// 1. PENYALINAN DOKUMEN & ASSET COMPANY PROFILE PUBLIK PT NPP (TIDAK DIUBAH)
// ============================================================================
const publicHtmlFiles = ['index.html', 'Projek-NPP.html', 'product-detail.html', 'login.html'];
publicHtmlFiles.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(dist, file));
  }
});

if (fs.existsSync('assets')) {
  if (typeof fs.cpSync === 'function') {
    fs.cpSync('assets', path.join(dist, 'assets'), { recursive: true });
  } else {
    copyDirectoryRecursive('assets', path.join(dist, 'assets'));
  }
}

if (fs.existsSync('src')) {
  if (typeof fs.cpSync === 'function') {
    fs.cpSync('src', path.join(dist, 'src'), { recursive: true });
  } else {
    copyDirectoryRecursive('src', path.join(dist, 'src'));
  }
}

// ============================================================================
// 2. TUGAS 5.2: PENYALINAN MODUL OPERASIONAL INTERNAL ERP (internal/ & src/internal/)
// ============================================================================
// Salin seluruh folder internal/ (termasuk archive.html & modul lainnya)
if (fs.existsSync('internal')) {
  if (typeof fs.cpSync === 'function') {
    fs.cpSync('internal', path.join(dist, 'internal'), { recursive: true });
  } else {
    copyDirectoryRecursive('internal', path.join(dist, 'internal'));
  }
}

// Pastikan subfolder src/internal/ terdistribusi lengkap
const srcInternalPath = path.join('src', 'internal');
const distSrcInternalPath = path.join(dist, 'src', 'internal');
if (fs.existsSync(srcInternalPath)) {
  if (typeof fs.cpSync === 'function') {
    fs.cpSync(srcInternalPath, distSrcInternalPath, { recursive: true });
  } else {
    copyDirectoryRecursive(srcInternalPath, distSrcInternalPath);
  }
}

console.log('Build complete: pure static files deployed to dist/');
