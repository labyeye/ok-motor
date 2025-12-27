const fs = require('fs');
const path = require('path');

const walkDir = (dir, ext, fileList = []) => {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walkDir(p, ext, fileList);
    else if (p.endsWith(ext)) fileList.push(p);
  }
  return fileList;
};

const stripCommentsInScriptOrStyle = (inner) => {
  // Remove block comments /* ... */
  inner = inner.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove lines that start with optional whitespace then //
  inner = inner
    .split(/\r?\n/)
    .filter((ln) => !/^\s*\/\//.test(ln))
    .join('\n');
  return inner;
};

const processFile = (filePath) => {
  let s = fs.readFileSync(filePath, 'utf8');
  const original = s;

  // 1) Remove HTML comments (<!-- ... -->)
  s = s.replace(/<!--([\s\S]*?)-->/g, '');

  // 2) Process <script>...</script> blocks and <style>...</style>
  s = s.replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, open, inner, close) => {
    const stripped = stripCommentsInScriptOrStyle(inner);
    return open + stripped + close;
  });

  s = s.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, open, inner, close) => {
    const stripped = stripCommentsInScriptOrStyle(inner);
    return open + stripped + close;
  });

  if (s !== original) {
    fs.writeFileSync(filePath, s, 'utf8');
    console.log('Updated:', filePath);
    return true;
  }
  return false;
};

const base = path.join(__dirname, '..', 'website');
const files = walkDir(base, '.html');
let changed = 0;
for (const f of files) {
  try {
    if (processFile(f)) changed++;
  } catch (e) {
    console.error('Error processing', f, e);
  }
}
console.log('Done. Files changed:', changed);
