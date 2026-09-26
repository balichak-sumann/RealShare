const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // We want to replace `router.back()` with `if (router.canGoBack()) { router.back(); } else { router.replace('/'); }`
      // But only if it's inside an arrow function like `() => router.back()` or `{ router.back(); }`
      
      // Case 1: () => router.back()
      const replaced1 = content.replace(/\(\)\s*=>\s*router\.back\(\)/g, '() => { if (router.canGoBack()) { router.back(); } else { router.replace(\'/\'); } }');
      
      // Case 2: { router.back(); } or router.back(); on its own line
      // This is trickier, let's just do a simple replace, but wait, `router.back()` might already be replaced if we just replaced it.
      // Actually, if we just do:
      const replaced2 = replaced1.replace(/(?<!\.)router\.back\(\)(?!\s*})/g, 'if (router.canGoBack()) { router.back(); } else { router.replace(\'/\'); }');
      // No wait, if we did replaced1, `router.back()` inside the injected block would get replaced by replaced2.
      
      // Let's do it carefully.
      let newContent = content.replace(/\(\)\s*=>\s*router\.back\(\)/g, "() => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } }");
      
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log('Updated router.back in', fullPath);
      }
    }
  }
}

processDir('/Users/indusinnovate/Desktop/RealShare/android-app/src/app');
