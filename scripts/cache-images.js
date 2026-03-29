#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

const dataPath = path.resolve(process.cwd(), 'site/data/styles.json');
const assetsDir = path.resolve(process.cwd(), 'site/assets');

if (!fs.existsSync(dataPath)) {
  console.error('Missing site/data/styles.json. Run node scripts/build-index.js first.');
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const styles = payload.styles || [];

fs.mkdirSync(assetsDir, { recursive: true });

function hashName(input) {
  return crypto.createHash('sha1').update(input).digest('hex').slice(0, 12);
}

function getExt(url) {
  const clean = url.split('?')[0];
  const ext = path.extname(clean);
  return ext || '.jpg';
}

function download(url, dest) {
  const client = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(download(res.headers.location, dest));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    req.on('error', reject);
  });
}

async function run() {
  let downloaded = 0;
  let skipped = 0;
  for (const style of styles) {
    const updated = [];
    for (const url of style.images || []) {
      if (!url || url.startsWith('assets/')) {
        updated.push(url);
        continue;
      }
      const ext = getExt(url);
      const filename = `${style.id}-${hashName(url)}${ext}`;
      const relPath = `assets/${filename}`;
      const outPath = path.join(assetsDir, filename);

      if (fs.existsSync(outPath)) {
        skipped += 1;
        updated.push(relPath);
        continue;
      }

      try {
        await download(url, outPath);
        downloaded += 1;
        updated.push(relPath);
      } catch (err) {
        console.warn(`Failed: ${url} (${err.message})`);
        updated.push(url);
      }
    }
    style.images = updated;
  }

  fs.writeFileSync(dataPath, JSON.stringify(payload, null, 2));
  console.log(`Downloaded ${downloaded} images. Skipped ${skipped}.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
