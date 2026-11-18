// Generates one SVG back cover per seeded book into backend/src/main/resources/static/covers/back/.
// Slugs, descriptions and author bios are read from the seed migrations, and the colours are read
// from each front cover, so the back cover always matches its front. Run generate-covers first.
// The barcode is decorative (derived from the slug); seeded books have no ISBN.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const migrations = join(root, 'backend/src/main/resources/db/migration');
const coversDir = join(root, 'backend/src/main/resources/static/covers');
const outDir = join(coversDir, 'back');

const read = (name) => readFileSync(join(migrations, name), 'utf8');
const unquote = (s) => s.replace(/''/g, "'");
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const catalogSql = read('V2__seed_catalog.sql') + '\n' + read('V3__seed_more_books.sql');

// authors: ('Name', 'slug', 'short bio'), later replaced by the fuller V5 bios: ('slug', 'bio')
const authors = new Map();
for (const m of catalogSql.matchAll(/^\s+\('((?:[^']|'')+)', '([a-z0-9-]+)', '((?:[^']|'')*)'\)[,;]?$/gm)) {
  authors.set(m[2], { name: unquote(m[1]), bio: unquote(m[3]) });
}
for (const m of read('V5__author_bios.sql').matchAll(/^\s+\('([a-z0-9-]+)', '((?:[^']|'')+)'\)[,;]?$/gm)) {
  const author = authors.get(m[1]);
  if (author) author.bio = unquote(m[2]);
}

// books: ('slug', 'Title', 'author-slug', 'category', 'brand', 'FORMAT', 'Language', price, disc, stock, sold, 'description')
const books = [];
for (const m of catalogSql.matchAll(
  /^\s+\('([a-z0-9-]+)', '((?:[^']|'')+)', '([a-z0-9-]+)', '[a-z0-9-]+', '[a-z0-9-]+', '[A-Z]+', '[^']+', [\d.]+, \d+, \d+, \d+, '((?:[^']|'')+)'\)[,;]?$/gm
)) {
  books.push({ slug: m[1], title: unquote(m[2]), author: authors.get(m[3]), tagline: unquote(m[4]) });
}
if (books.length === 0) {
  throw new Error('No books found in the seed migrations');
}

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

function limit(lines, maxLines) {
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = kept[maxLines - 1].replace(/[\s.,;:!?-]*$/, '') + '\u2026';
  return kept;
}

// Colours come from the front cover: gradient stops (top, bottom) and the frame stroke (accent).
function frontColours(slug) {
  const svg = readFileSync(join(coversDir, `${slug}.svg`), 'utf8');
  const bg = svg.match(/<linearGradient id="bg"[^>]*><stop offset="0" stop-color="(#[0-9a-fA-F]{6})"\/><stop offset="1" stop-color="(#[0-9a-fA-F]{6})"\/>/);
  const accent = svg.match(/<rect x="12" y="12"[^>]*stroke="(#[0-9a-fA-F]{6})"/);
  if (!bg || !accent) throw new Error(`Cannot read colours from ${slug}.svg`);
  return { top: bg[1], bottom: bg[2], accent: accent[1] };
}

// Decorative barcode: bar widths come from a hash of the slug.
function barcode(slug, x0, y0, width, height, ink, paper) {
  let hash = 2166136261;
  for (const ch of slug) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  const bars = [];
  let x = x0 + 6;
  const end = x0 + width - 6;
  while (x < end) {
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177) >>> 0;
    const w = (hash % 3) + 1;
    if (x + w > end) break;
    bars.push(`<rect x="${x}" y="${y0 + 6}" width="${w}" height="${height - 12}" fill="${ink}"/>`);
    x += w + ((hash >>> 4) % 2) + 1;
  }
  return `<rect x="${x0}" y="${y0}" width="${width}" height="${height}" fill="${paper}"/>\n  ${bars.join('')}`;
}

mkdirSync(outDir, { recursive: true });
for (const book of books) {
  const { top, bottom, accent } = frontColours(book.slug);
  const font = "Georgia, 'Times New Roman', serif";

  const quoteLines = limit(wrap(`\u201C${book.tagline}\u201D`, 28), 5);
  const quoteSvg = quoteLines
    .map((l, n) => `<text x="150" y="${74 + n * 22}" text-anchor="middle" font-family="${font}" font-size="16" font-style="italic" font-weight="bold" fill="${accent}">${esc(l)}</text>`)
    .join('\n  ');
  const afterQuote = 74 + (quoteLines.length - 1) * 22;

  const dividerY = afterQuote + 22;
  const headingY = dividerY + 28;
  const bioLines = limit(wrap(book.author?.bio || '', 38), 9);
  const bioSvg = bioLines
    .map((l, n) => `<text x="150" y="${headingY + 22 + n * 15}" text-anchor="middle" font-family="${font}" font-size="11" fill="${accent}" fill-opacity=".85">${esc(l)}</text>`)
    .join('\n  ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="300" height="450" role="img" aria-label="Back cover of ${esc(book.title)}">
  <title>Back cover of ${esc(book.title)}</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
  </defs>
  <rect width="300" height="450" fill="url(#bg)"/>
  <rect x="12" y="12" width="276" height="426" fill="none" stroke="${accent}" stroke-width="1.6"/>
  <rect x="18" y="18" width="264" height="414" fill="none" stroke="${accent}" stroke-opacity=".35" stroke-width="1"/>
  ${quoteSvg}
  <path d="M82 ${dividerY} H138 M162 ${dividerY} H218" stroke="${accent}" stroke-width="1.5"/>
  <path d="M150 ${dividerY - 6} l6 6 l-6 6 l-6 -6z" fill="${accent}"/>
  <text x="150" y="${headingY}" text-anchor="middle" font-family="${font}" font-size="12" font-weight="bold" letter-spacing="2" fill="${accent}">ABOUT THE AUTHOR</text>
  ${bioSvg}
  <text x="34" y="405" font-family="${font}" font-size="10" letter-spacing="1.5" fill="${accent}" fill-opacity=".8">BOOK HAVEN</text>
  ${barcode(book.slug, 186, 380, 84, 42, bottom, accent)}
</svg>
`;
  writeFileSync(join(outDir, `${book.slug}.svg`), svg, 'utf8');
}

console.log(`Wrote ${books.length} back covers to ${outDir}`);
