import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../frontend/src');

if (!fs.existsSync(srcDir)) {
  console.log('frontend/src does not exist yet. Token check skipped.');
  process.exit(0);
}

const FORBIDDEN_TAILWIND_COLORS = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose'
];

const TW_COLOR_REGEX = new RegExp(
  `\\b(?:bg|text|border|ring|fill|stroke|outline|from|to|via)-(?:${FORBIDDEN_TAILWIND_COLORS.join('|')})-(?:50|[1-9]00|950)\\b`,
  'i'
);

const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;
const RGB_HSL_REGEX = /\b(?:rgb|rgba|hsl|hsla)\s*\(/i;

let violations = [];

function scanFile(filePath) {
  const relPath = path.relative(path.resolve(__dirname, '..'), filePath);
  
  // Skip theme.css since it defines the design tokens
  if (filePath.endsWith('theme.css')) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check default Tailwind palette
    const twMatch = line.match(TW_COLOR_REGEX);
    if (twMatch) {
      violations.push({
        file: relPath,
        line: lineNum,
        matched: twMatch[0],
        rule: 'Tailwind default color class used instead of design tokens'
      });
    }

    // Check hex colors (skip comments or SVG paths or data URIs if applicable)
    if (!line.includes('data:image') && !line.includes('// token-check-ignore')) {
      const hexMatch = line.match(HEX_COLOR_REGEX);
      if (hexMatch) {
        violations.push({
          file: relPath,
          line: lineNum,
          matched: hexMatch[0],
          rule: 'Hardcoded hex color used instead of design tokens'
        });
      }

      const rgbMatch = line.match(RGB_HSL_REGEX);
      if (rgbMatch) {
        violations.push({
          file: relPath,
          line: lineNum,
          matched: rgbMatch[0],
          rule: 'Hardcoded rgb/hsl color used instead of design tokens'
        });
      }
    }
  });
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        walkDir(fullPath);
      }
    } else if (entry.isFile() && /\.(jsx?|tsx?|css|html)$/.test(entry.name)) {
      scanFile(fullPath);
    }
  }
}

walkDir(srcDir);

if (violations.length > 0) {
  console.error('\n❌ Token check failed! Forbidden color values found in frontend/src:');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} -> "${v.matched}" (${v.rule})`);
  }
  console.error('\nUse semantic tokens: bg-bg, bg-surface, text-text, text-muted, border-border, bg-primary, etc.\n');
  process.exit(1);
} else {
  console.log('✅ Token check passed: All files use semantic design tokens.');
  process.exit(0);
}
