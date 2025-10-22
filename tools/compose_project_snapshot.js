#!/usr/bin/env node
// Compose a single snapshot file of the project (respects .gitignore files, including nested ones)


const fs = require('fs').promises;
const path = require('path');
const { existsSync } = require('fs');
const Ignore = require('ignore');

const MAX_FILE_BYTES = 1024 * 1024; // 1 MB - still used as a fallback for very large text files

// Extensions to skip based on file extension (lowercase, include leading dot)
const SKIP_EXTENSIONS = new Set([
  // images
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg', '.ico', '.tif', '.tiff',
  // videos / audio
  '.mp4', '.mov', '.avi', '.mkv', '.webm', '.mp3', '.wav', '.ogg', '.flac', '.m4a',
  // fonts
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  // archives / packages
  '.zip', '.tar', '.gz', '.tgz', '.7z', '.rar', '.jar',
  // documents / binaries / others
  '.pdf', '.exe', '.dll', '.bin', '.class', '.so', '.dmg', '.iso'
]);

// Basenames to always skip (common lockfiles - package.json is enough for package metadata)
const SKIP_BASENAMES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'npm-shrinkwrap.json'
]);

async function collectGitignores(root) {
  const ig = Ignore();
  ig.add('.git');
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        stack.push(full);
      } else if (e.isFile() && e.name === '.gitignore') {
        const relDir = path.relative(root, dir).replace(/\\/g, '/');
        const raw = await fs.readFile(full, 'utf8');
        const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        for (let p of lines) {
          const neg = p.startsWith('!');
          if (neg) p = p.slice(1);
          let transformed;
          if (relDir === '') {
            transformed = (neg ? '!' : '') + p;
          } else {
            if (p.startsWith('/')) {
              transformed = (neg ? '!' : '') + path.posix.join(relDir, p.slice(1));
            } else {
              transformed = (neg ? '!' : '') + path.posix.join(relDir, p);
            }
          }
          ig.add(transformed);
        }
      }
    }
  }
  return ig;
}

async function buildTree(root, ig) {
  async function readDir(dir, relPrefix = '') {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return [];
    }
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    const children = [];
    for (const e of entries) {
      const relPath = path.posix.join(relPrefix, e.name);
      if (ig.ignores(relPath)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        children.push({ type: 'dir', name: e.name, full, rel: relPath });
      } else if (e.isFile()) {
        children.push({ type: 'file', name: e.name, full, rel: relPath });
      }
    }
    return children;
  }

  const fileList = [];
  async function recurse(dir, relPrefix = '', prefixMarkers = []) {
    const children = await readDir(dir, relPrefix);
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      const isLast = i === children.length - 1;
      const segs = [];
      // prefixMarkers contains booleans indicating "hasMoreSiblings" for each ancestor level.
      // If hasMoreSiblings is true => show vertical bar ('|  '), otherwise show spaces ('    ').
      for (let j = 0; j < prefixMarkers.length; j++) {
        segs.push(prefixMarkers[j] ? '|   ' : '    ');
      }
      segs.push(isLast ? '`-- ' : '|-- ');
      const line = segs.join('') + c.name;
      treeLines.push(line);
      if (c.type === 'dir') {
        // pass whether this level has more siblings (i.e. not last) to children
        await recurse(c.full, c.rel, prefixMarkers.concat(!isLast));
      } else {
        fileList.push({ full: c.full, rel: c.rel });
      }
    }
  }

  const treeLines = [];
  const rootName = path.basename(root);
  treeLines.push(`${rootName}/`);
  await recurse(root, '', []);
  return { treeLines, fileList };
}

function isBinaryBuffer(buf) {
  return buf.includes(0);
}

async function main() {
  const projectRoot = process.cwd();
  const ig = await collectGitignores(projectRoot);
  
  // ensure common dirs / files are ignored
  ig.add('node_modules');
  ig.add('.next');
  ig.add('dist');
  ig.add('build');

  // also ignore lockfiles explicitly (we only want package.json)
  ig.add('package-lock.json');
  ig.add('yarn.lock');
  ig.add('pnpm-lock.yaml');
  ig.add('npm-shrinkwrap.json');

  const { treeLines, fileList } = await buildTree(projectRoot, ig);

  const out = [];

  out.push('=================');
  out.push('PROJECT STRUCTURE:');
  out.push('=================');
  out.push('');
  for (const l of treeLines) out.push(l);
  out.push('');
  out.push('=================');
  out.push('CODE/TEXT CONTENT OF THE PROJECT');
  out.push('=================');
  out.push('');

  for (const f of fileList) {
    out.push(f.rel + ':');
    out.push('');

    // skip by basename (lockfiles) first
    const base = path.basename(f.rel);
    if (SKIP_BASENAMES.has(base)) {
      out.push(`[skipped: ${base} (lockfile / intentionally excluded)]`);
      out.push('_____________________________');
      out.push('');
      continue;
    }

    // skip by extension
    const ext = path.extname(f.rel).toLowerCase();
    if (SKIP_EXTENSIONS.has(ext)) {
      out.push(`[skipped: ${ext || 'no-ext'} file (extension-based skip)]`);
      out.push('_____________________________');
      out.push('');
      continue;
    }

    let stat;
    try {
      stat = await fs.stat(f.full);
    } catch (e) {
      out.push('[error reading file]');
      out.push('_____________________________');
      out.push('');
      continue;
    }

    if (stat.size > MAX_FILE_BYTES) {
      out.push(`[skipped: file too large (${stat.size} bytes)]`);
      out.push('_____________________________');
      out.push('');
      continue;
    }

    let buf;
    try {
      buf = await fs.readFile(f.full);
    } catch (e) {
      out.push('[error reading file]');
      out.push('_____________________________');
      out.push('');
      continue;
    }

    if (isBinaryBuffer(buf)) {
      out.push(`[binary file skipped, ${stat.size} bytes]`);
      out.push('_____________________________');
      out.push('');
      continue;
    }

    const txt = buf.toString('utf8');
    out.push(txt);
    out.push('_____________________________');
    out.push('');
  }

  process.stdout.write(out.join('\n'));
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
