#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const readmePath = path.resolve(process.cwd(), 'README.md');
const outputPath = path.resolve(process.cwd(), 'site/data/styles.json');

const readme = fs.readFileSync(readmePath, 'utf8');
const lines = readme.split(/\r?\n/);

const headingRegex = /^(#{2,3})\s+(.+)$/;
const headings = [];

for (let i = 0; i < lines.length; i++) {
  const match = lines[i].match(headingRegex);
  if (match) {
    headings.push({
      level: match[1].length,
      rawTitle: match[2].trim(),
      line: i,
    });
  }
}

function normalizeTitle(raw) {
  let title = raw.replace(/\*\*/g, '').trim();
  title = title.replace(/^#+\s+/, '').trim();
  title = title.replace(/\s*:\s*$/, '');
  return title;
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

const styles = [];
const idCounts = new Map();
let skipped = 0;

for (let i = 0; i < headings.length; i++) {
  const current = headings[i];
  const next = headings[i + 1];
  const start = current.line + 1;
  const end = next ? next.line : lines.length;
  const sectionText = lines.slice(start, end).join('\n');

  const title = normalizeTitle(current.rawTitle);
  if (!title || title.toLowerCase() === 'usage guidance' || title.toLowerCase() === 'missing entries') {
    continue;
  }

  const promptMatch = sectionText.match(/```[^\n]*\n([\s\S]*?)\n```/);
  if (!promptMatch) {
    skipped += 1;
    continue;
  }

  const images = [];
  const imageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  let imageMatch;
  while ((imageMatch = imageRegex.exec(sectionText)) !== null) {
    images.push(imageMatch[1]);
  }

  const prompt = promptMatch[1].trim();

  const tags = [];
  const tagMatch = sectionText.match(/Tags:\s*\[([^\]]+)\]/i);
  if (tagMatch) {
    const rawTags = tagMatch[1]
      .split(',')
      .map((t) => t.replace(/['\"]/g, '').trim())
      .filter(Boolean);
    tags.push(...rawTags);
  }

  let source = '';
  const sourceLineMatch = sectionText.match(/source[^\n]*$/gim);
  if (sourceLineMatch) {
    for (const line of sourceLineMatch) {
      const urlMatch = line.match(/https?:\/\/\S+/);
      if (urlMatch) {
        source = urlMatch[0].replace(/[\)\]*]+$/, '');
        break;
      }
    }
  }

  let id = slugify(title);
  if (!id) id = `style-${styles.length + 1}`;
  if (idCounts.has(id)) {
    const count = idCounts.get(id) + 1;
    idCounts.set(id, count);
    id = `${id}-${count}`;
  } else {
    idCounts.set(id, 1);
  }

  styles.push({
    id,
    title,
    images,
    prompt,
    tags,
    source,
    section_order: styles.length + 1,
  });
}

if (styles.length === 0) {
  console.error('No styles found. Check README.md formatting.');
  process.exit(1);
}

const payload = {
  generated_at: new Date().toISOString(),
  total: styles.length,
  styles,
  skipped_sections: skipped,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));

console.log(`Wrote ${styles.length} styles to ${path.relative(process.cwd(), outputPath)}`);
if (skipped > 0) {
  console.log(`Skipped ${skipped} sections without prompt blocks.`);
}
