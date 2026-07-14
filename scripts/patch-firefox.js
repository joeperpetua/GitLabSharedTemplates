import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const distPath = path.join(rootDir, 'dist');
const firefoxDistPath = path.join(rootDir, 'dist-firefox');

// Helper to recursively copy directories
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function run() {
  console.log('Starting Firefox build post-processing...');

  if (!fs.existsSync(distPath)) {
    console.error('Error: dist/ directory does not exist. Please run a build first.');
    process.exit(1);
  }

  // 1. Clean existing Firefox dist folder
  if (fs.existsSync(firefoxDistPath)) {
    console.log('Cleaning old dist-firefox directory...');
    fs.rmSync(firefoxDistPath, { recursive: true, force: true });
  }

  // 2. Copy compiled dist folder to dist-firefox
  console.log('Copying dist to dist-firefox...');
  copyDir(distPath, firefoxDistPath);

  // 3. Read and modify manifest.json
  const manifestPath = path.join(firefoxDistPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('Error: manifest.json not found in copied folder.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  if (manifest.background && manifest.background.service_worker) {
    console.log('Patching background service worker to background script for Firefox...');
    const serviceWorkerFile = manifest.background.service_worker;
    
    // Convert background service_worker to background scripts array
    manifest.background.scripts = [serviceWorkerFile];
    delete manifest.background.service_worker;
    
    // Write back modified manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('Firefox manifest.json updated successfully.');
  } else {
    console.log('No background service worker found to patch.');
  }

  console.log('Firefox build patch complete!');
}

run().catch((err) => {
  console.error('Error patching Firefox build:', err);
  process.exit(1);
});
