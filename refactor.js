const fs = require('fs');
const path = require('path');

const replacements = [
  { from: /\bInvestors\b/g, to: 'Buyers' },
  { from: /\binvestors\b/g, to: 'buyers' },
  { from: /\bInvestor\b/g, to: 'Buyer' },
  { from: /\binvestor\b/g, to: 'buyer' },
  { from: /\bINVESTORS\b/g, to: 'BUYERS' },
  { from: /\bINVESTOR\b/g, to: 'BUYER' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  for (const r of replacements) {
    content = content.replace(r.from, r.to);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

walkDir('/Users/indusinnovate/Desktop/RealShare/admin-dashboard/src');
walkDir('/Users/indusinnovate/Desktop/RealShare/android-app/src');
