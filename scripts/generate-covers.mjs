// Generates one SVG cover per seeded book into backend/src/main/resources/static/covers/.
// Slugs, titles and authors are read from V2__seed_catalog.sql so the two cannot drift.
// Colours are chosen only for the generated image (they are not application theme colours).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const seedFile = join(root, 'backend/src/main/resources/db/migration/V2__seed_catalog.sql');
const outDir = join(root, 'backend/src/main/resources/static/covers');

const sql = readFileSync(seedFile, 'utf8');
const unquote = (s) => s.replace(/''/g, "'");

// authors: ('Name', 'slug', 'bio')
const authors = new Map();
for (const m of sql.matchAll(/^\s+\('((?:[^']|'')+)', '([a-z0-9-]+)', '(?:[^']|'')*'\)[,;]?$/gm)) {
  authors.set(m[2], unquote(m[1]));
}

// books: ('slug', 'Title', 'author-slug', 'category-slug', ...
const books = [];
for (const m of sql.matchAll(/^\s+\('([a-z0-9-]+)', '((?:[^']|'')+)', '([a-z0-9-]+)', '[a-z0-9-]+', '[a-z0-9-]+', '(?:PAPERBACK|HARDCOVER|EBOOK|AUDIOBOOK)'/gm)) {
  books.push({ slug: m[1], title: unquote(m[2]), author: authors.get(m[3]) ?? m[3] });
}
if (books.length === 0) {
  throw new Error('No books found in V2__seed_catalog.sql');
}

const palette = [
  ['#1f3a5f', '#f4d35e'], ['#7a1f2b', '#f6e7cb'], ['#14532d', '#fde68a'], ['#3b1f5e', '#f9c5d1'],
  ['#0f4c5c', '#fb8b24'], ['#5c3d2e', '#e8d5b7'], ['#1b263b', '#e0e1dd'], ['#6b2737', '#ffd6a5'],
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function wrap(text, max) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if ((line + ' ' + word).trim().length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

mkdirSync(outDir, { recursive: true });
books.forEach((book, i) => {
  const [bg, fg] = palette[i % palette.length];
  const titleLines = wrap(book.title.toUpperCase(), 14);
  const startY = 150 - (titleLines.length - 1) * 22;
  const titleSvg = titleLines
    .map((l, n) => `<text x="150" y="${startY + n * 44}" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-weight="bold" fill="${fg}">${esc(l)}</text>`)
    .join('\n  ');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="300" height="450" role="img" aria-label="${esc(book.title)} by ${esc(book.author)}">
  <rect width="300" height="450" fill="${bg}"/>
  <rect x="14" y="14" width="272" height="422" fill="none" stroke="${fg}" stroke-width="2"/>
  ${titleSvg}
  <line x1="90" y1="330" x2="210" y2="330" stroke="${fg}" stroke-width="2"/>
  <text x="150" y="375" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="${fg}">${esc(book.author.toUpperCase())}</text>
</svg>
`;
  writeFileSync(join(outDir, `${book.slug}.svg`), svg, 'utf8');
});

console.log(`Wrote ${books.length} covers to ${outDir}`);
