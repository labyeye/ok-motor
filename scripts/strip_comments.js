const fs = require('fs');
const path = require('path');

function stripComments(src) {
  let out = '';
  let i = 0;
  let len = src.length;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inBlock = false;
  let inLine = false;
  let prev = '';

  while (i < len) {
    const ch = src[i];
    const next = src[i + 1];

    if (inBlock) {
      if (ch === '*' && next === '/') {
        inBlock = false;
        i += 2;
        continue;
      }
      // preserve newlines inside block comments to keep line numbers
      if (ch === '\n') out += '\n';
      i++;
      continue;
    }

    if (inLine) {
      if (ch === '\n') {
        inLine = false;
        out += '\n';
      }
      i++;
      continue;
    }

    if (!inSingle && !inDouble && !inTemplate) {
      if (ch === '/' && next === '*') {
        inBlock = true;
        i += 2;
        continue;
      }
      if (ch === '/' && next === '/') {
        inLine = true;
        i += 2;
        continue;
      }
    }

    if (ch === "'" && !inDouble && !inTemplate) {
      out += ch;
      inSingle = !inSingle;
      i++;
      // handle escaped quotes inside single
      while (inSingle && i < len) {
        const c = src[i];
        out += c;
        if (c === "\\") {
          if (i + 1 < len) { out += src[i+1]; i += 2; continue; }
        }
        if (c === "'") { inSingle = false; i++; break; }
        i++;
      }
      continue;
    }

    if (ch === '"' && !inSingle && !inTemplate) {
      out += ch;
      inDouble = !inDouble;
      i++;
      while (inDouble && i < len) {
        const c = src[i];
        out += c;
        if (c === "\\") {
          if (i + 1 < len) { out += src[i+1]; i += 2; continue; }
        }
        if (c === '"') { inDouble = false; i++; break; }
        i++;
      }
      continue;
    }

    if (ch === '`' && !inSingle && !inDouble) {
      out += ch;
      inTemplate = !inTemplate;
      i++;
      while (inTemplate && i < len) {
        const c = src[i];
        out += c;
        if (c === "\\") {
          if (i + 1 < len) { out += src[i+1]; i += 2; continue; }
        }
        if (c === '`') { inTemplate = false; i++; break; }
        i++;
      }
      continue;
    }

    out += ch;
    i++;
  }

  return out;
}

const targets = [
  path.join(__dirname, '..', 'frontend', 'src', 'components', 'SellLetterHistory.js'),
  path.join(__dirname, '..', 'frontend', 'src', 'components', 'SellLetterPDF.js'),
];

for (const t of targets) {
  try {
    const src = fs.readFileSync(t, 'utf8');
    const stripped = stripComments(src);
    fs.writeFileSync(t, stripped, 'utf8');
    console.log('Stripped comments for', t);
  } catch (err) {
    console.error('Failed for', t, err);
  }
}
