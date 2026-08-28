const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      content = content.replace(/#634930/gi, '#14532d');
      content = content.replace(/#8B6F47/gi, '#d4af37');
      content = content.replace(/#725a3a/gi, '#166534');
      content = content.replace(/#5C4033/gi, '#14532d');
      content = content.replace(/#4A3320/gi, '#052e16');
      content = content.replace(/amber-/g, 'emerald-');
      content = content.replace(/orange-/g, 'emerald-');
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}
replaceInDir(path.join(__dirname, 'src'));
