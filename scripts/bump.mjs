import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Please specify a version as the first argument. (e.g. 0.1.2)');
  process.exit(1);
}

const packagePaths = [
  path.join(rootDir, 'package.json'),
  path.join(rootDir, 'packages/dhwani/package.json'),
  path.join(rootDir, 'packages/chromatic-tuner/package.json'),
  path.join(rootDir, 'packages/dhwani-metronome/package.json'),
  path.join(rootDir, 'packages/web/package.json'),
];

console.log(`Bumping version to ${newVersion}...`);

packagePaths.forEach((p) => {
  if (fs.existsSync(p)) {
    const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
    pkg.version = newVersion;
    fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Updated ${path.relative(rootDir, p)}`);
  } else {
    console.warn(`Warning: File not found: ${p}`);
  }
});

console.log('\nVersion bump completed successfully!');
