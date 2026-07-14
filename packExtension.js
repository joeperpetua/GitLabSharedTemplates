#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manifestPath = path.join(__dirname, 'manifest.json');

function getCurrentVersion() {
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      return manifest.version || '';
    } catch (e) {
      console.warn(`Warning: Could not read version from manifest.json: ${e.message}`);
    }
  }
  return '';
}

function bumpVersion(currentVersion, step) {
  const cleanVersion = currentVersion.split('-')[0].split('+')[0];
  const parts = cleanVersion.split('.');
  
  if (parts.length < 3) {
    parts.push(...Array(3 - parts.length).fill('0'));
  }
  
  let major = parseInt(parts[0], 10);
  let minor = parseInt(parts[1], 10);
  let patch = parseInt(parts[2], 10);
  
  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    console.warn(`Warning: Could not parse semver from '${currentVersion}'. Defaulting to 1.0.0.`);
    return '1.0.0';
  }

  if (step === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (step === 'minor') {
    minor += 1;
    patch = 0;
  } else { // patch
    patch += 1;
  }
  
  return `${major}.${minor}.${patch}`;
}

function updateSourceManifest(version) {
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.version = version;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
      console.log(`Updated source manifest.json version to: ${version}`);
    } catch (e) {
      console.error(`Error updating source manifest.json: ${e.message}`);
      process.exit(1);
    }
  }
}

function runBuild() {
  console.log('='.repeat(64));
  console.log('Building project for Chrome and Firefox...');
  
  let usePnpm = false;
  try {
    execSync('pnpm --version', { stdio: 'ignore' });
    usePnpm = true;
  } catch (e) {
    // pnpm not available
  }
  
  const cmd = usePnpm ? 'pnpm run build:firefox' : 'npm run build:firefox';
  console.log(`Using ${usePnpm ? 'pnpm' : 'npm'} for build...`);
  try {
    execSync(cmd, { stdio: 'inherit', shell: true });
  } catch (e) {
    console.error(`Error during build execution: ${e.message}`);
    process.exit(1);
  }
}

function updateBuildManifest(dirPath, version) {
  const buildManifestPath = path.join(__dirname, dirPath, 'manifest.json');
  if (fs.existsSync(buildManifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
      manifest.version = version;
      fs.writeFileSync(buildManifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
      console.log(`Updated version to ${version} in build output: ${path.join(dirPath, 'manifest.json')}`);
    } catch (e) {
      console.error(`Error updating manifest version in ${buildManifestPath}: ${e.message}`);
      process.exit(1);
    }
  } else {
    console.error(`Error: manifest.json not found in ${dirPath}`);
    process.exit(1);
  }
}

function packDirectory(sourceDir, outputZip) {
  const sourcePath = path.resolve(__dirname, sourceDir);
  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: Source directory '${sourceDir}' does not exist. Skipping packing.`);
    return false;
  }
  
  console.log(`Packing '${sourceDir}' into '${outputZip}'...`);
  
  const outputZipPath = path.resolve(__dirname, outputZip);
  const outputDir = path.dirname(outputZipPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  if (fs.existsSync(outputZipPath)) {
    fs.unlinkSync(outputZipPath);
  }
  
  try {
    if (process.platform === 'win32') {
      const winSourcePath = path.join(sourcePath, '*');
      const winOutputPath = outputZipPath;
      execSync(`powershell -Command "Compress-Archive -Path '${winSourcePath}' -DestinationPath '${winOutputPath}' -Force"`, { stdio: 'ignore' });
    } else {
      execSync(`cd "${sourcePath}" && zip -r "${outputZipPath}" .`, { stdio: 'ignore', shell: true });
    }
    console.log(`Successfully created: ${outputZip}`);
    return true;
  } catch (err) {
    console.error(`Error zipping '${sourceDir}': ${err.message}`);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  let explicitVersion = null;
  let bump = 'patch';
  let noBump = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-v' || arg === '--version') {
      explicitVersion = args[i + 1];
      i++;
    } else if (arg === '-b' || arg === '--bump') {
      bump = args[i + 1];
      i++;
    } else if (arg === '-n' || arg === '--no-bump') {
      noBump = true;
    } else if (arg === '-h' || arg === '--help') {
      console.log(`
Usage:
  node packExtension.js [-h] [-v VERSION] [-b BUMP] [-n]

Options:
  -h, --help       Show this help message
  -v, --version    Specify an explicit version (overrides auto-bump)
  -b, --bump       Version segment to bump: patch, minor, major (default: patch)
  -n, --no-bump    Do not bump the version (builds and packs using current version)

Examples:
  node packExtension.js             # Auto-bump patch version
  node packExtension.js -b minor    # Auto-bump minor version
  node packExtension.js -n          # Pack without bumping version
  node packExtension.js -v 2.0.0    # Set version explicitly to 2.0.0
      `);
      process.exit(0);
    }
  }

  const currentVersion = getCurrentVersion();
  if (!currentVersion) {
    console.error('Error: Could not retrieve current version from source manifest.json.');
    process.exit(1);
  }

  let targetVersion;
  if (explicitVersion) {
    targetVersion = explicitVersion;
    console.log(`Using explicitly specified version: ${targetVersion}`);
  } else if (noBump) {
    targetVersion = currentVersion;
    console.log(`Keeping current version (no-bump): ${targetVersion}`);
  } else {
    targetVersion = bumpVersion(currentVersion, bump);
    console.log(`Bumping version (${bump}) from ${currentVersion} -> ${targetVersion}`);
  }

  // 1. Update source manifest
  updateSourceManifest(targetVersion);

  // 2. Run build
  runBuild();

  // 3. Sync manifest versions in build output folders
  console.log('='.repeat(64));
  console.log(`Syncing manifest versions in build output to ${targetVersion}...`);
  updateBuildManifest('dist', targetVersion);
  updateBuildManifest('dist-firefox', targetVersion);

  // 4. Zip build outputs
  console.log('='.repeat(64));
  const chromeZip = path.join('build', `gitlab-shared-templates-${targetVersion}-chrome.zip`);
  const firefoxZip = path.join('build', `gitlab-shared-templates-${targetVersion}-firefox.zip`);

  packDirectory('dist', chromeZip);
  packDirectory('dist-firefox', firefox_zip_path_resolution_check_optional(firefoxZip));

  console.log('='.repeat(64));
  console.log('Packing complete!');
}

// Simple identity helper
function firefox_zip_path_resolution_check_optional(p) {
  return p;
}

main();
