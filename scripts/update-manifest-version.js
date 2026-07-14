import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const version = process.argv[2];
if (!version) {
  console.error('Error: No version provided to update-manifest-version.js');
  process.exit(1);
}

const targets = [
  path.join(rootDir, 'dist', 'manifest.json'),
  path.join(rootDir, 'dist-firefox', 'manifest.json')
];

for (const manifestPath of targets) {
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.version = version;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      console.log(`Updated version to ${version} in build output: ${path.relative(rootDir, manifestPath)}`);
    } catch (err) {
      console.error(`Failed to update version in ${manifestPath}:`, err);
    }
  }
}
