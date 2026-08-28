const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      // Case insensitive replacements
      content = content.replace(/warkop\s*1001cc/gi, 'New Chapter');
      content = content.replace(/warkop1001cc/gi, 'New Chapter');
      content = content.replace(/warkop/gi, 'New Chapter');
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated text in ${fullPath}`);
      }
    }
  }
}
replaceInDir(path.join(__dirname, 'src'));
replaceInDir(path.join(__dirname, 'public'));

// Update index.html at root
const idxPath = path.join(__dirname, 'index.html');
if (fs.existsSync(idxPath)) {
  let content = fs.readFileSync(idxPath, 'utf8');
  const original = content;
  content = content.replace(/warkop\s*1001cc/gi, 'New Chapter');
  content = content.replace(/warkop/gi, 'New Chapter');
  if (content !== original) {
    fs.writeFileSync(idxPath, content, 'utf8');
    console.log('Updated text in index.html');
  }
}
