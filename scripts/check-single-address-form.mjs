import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../frontend/src');

if (!fs.existsSync(srcDir)) {
  console.log('frontend/src does not exist yet. Address form check skipped.');
  process.exit(0);
}

let violations = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.js') || entry.name.endsWith('.tsx'))) {
      // Allow AddressForm.jsx, schemas.js, handlers.js, and test files
      if (
        entry.name === 'AddressForm.jsx' ||
        entry.name === 'schemas.js' ||
        entry.name.includes('test') ||
        entry.name === 'handlers.js'
      ) {
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      // Check if file contains postalCode registration or input for address form
      if (
        content.includes("register('postalCode')") ||
        content.includes('register("postalCode")') ||
        /name=["']postalCode["']/.test(content)
      ) {
        violations.push({
          file: path.relative(path.resolve(__dirname, '..'), fullPath),
          reason: 'Duplicate address form detected. AddressForm.jsx must be the single source of address inputs (FR-037).'
        });
      }
    }
  }
}

scanDir(srcDir);

if (violations.length > 0) {
  console.error('\n❌ Single Address Form check failed:');
  for (const v of violations) {
    console.error(`  - ${v.file}: ${v.reason}`);
  }
  process.exit(1);
} else {
  console.log('✅ Single address form check passed: AddressForm.jsx is the single address form.');
  process.exit(0);
}
