const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'broadcast', 'LiveConsole.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let depth = 0;
let inSingleQuote = false;
let inDoubleQuote = false;
let inTemplate = false;
let inLineComment = false;
let inBlockComment = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  inLineComment = false;
  
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    const next = j + 1 < line.length ? line[j + 1] : '';
    const prev = j > 0 ? line[j - 1] : '';
    
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        j++;
      }
      continue;
    }
    
    if (inLineComment) continue;
    
    if (ch === '/' && next === '/') { inLineComment = true; continue; }
    if (ch === '/' && next === '*') { inBlockComment = true; j++; continue; }
    
    if (inSingleQuote) {
      if (ch === "'" && prev !== '\\') inSingleQuote = false;
      continue;
    }
    if (inDoubleQuote) {
      if (ch === '"' && prev !== '\\') inDoubleQuote = false;
      continue;
    }
    if (inTemplate) {
      if (ch === '`' && prev !== '\\') { inTemplate = false; continue; }
      if (ch !== '{' && ch !== '}') continue;
    }
    
    if (ch === "'" && !inDoubleQuote && !inTemplate) { inSingleQuote = true; continue; }
    if (ch === '"' && !inSingleQuote && !inTemplate) { inDoubleQuote = true; continue; }
    if (ch === '`') { inTemplate = true; continue; }
    
    if (ch === '{') {
      depth++;
      if (depth === 2) {
        const trimmed = line.trim().substring(0, 80);
        console.log(`OPEN  d=2 L${i+1}: ${trimmed}`);
      }
    }
    if (ch === '}') {
      depth--;
      if (depth <= 1) {
        const trimmed = line.trim().substring(0, 80);
        console.log(`CLOSE d=${depth} L${i+1}: ${trimmed}`);
      }
    }
  }
}

console.log('\nFinal depth:', depth);
