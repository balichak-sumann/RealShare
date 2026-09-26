const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// We will find all files with the hardcoded padding top.
const files = execSync(`grep -rl "paddingTop.*50" src/app`).toString().split('\n').filter(Boolean);

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Add import if not present
  if (!content.includes("useSafeAreaInsets")) {
    const importRegex = /(import [^\n]+;\n)(?!(?:import [^\n]+;\n))/s;
    const lastImportMatch = content.match(importRegex);
    if (lastImportMatch) {
      content = content.replace(
        lastImportMatch[0],
        `${lastImportMatch[0]}import { useSafeAreaInsets } from 'react-native-safe-area-context';\n`
      );
    } else {
      content = `import { useSafeAreaInsets } from 'react-native-safe-area-context';\n` + content;
    }
  }

  // Inject hook into component function.
  // Look for `export default function XYZ() {`
  const funcRegex = /export default function ([A-Za-z0-9_]+)\([^)]*\)\s*\{/;
  if (funcRegex.test(content)) {
    if (!content.includes("const insets = useSafeAreaInsets();")) {
      content = content.replace(funcRegex, `$&
  const insets = useSafeAreaInsets();`);
    }
  } else {
    console.log(`Could not find export default function in ${file}`);
    return;
  }

  // Replace hardcoded padding top
  // paddingTop: Platform.OS === 'web' ? 18 : 50
  content = content.replace(/paddingTop:\s*Platform\.OS === 'web' \? 18 : 50/g, "paddingTop: Platform.OS === 'web' ? 18 : Math.max(insets.top, 50)");
  content = content.replace(/paddingTop:\s*Platform\.OS === 'web' \? 20 : 50/g, "paddingTop: Platform.OS === 'web' ? 20 : Math.max(insets.top, 50)");
  content = content.replace(/paddingTop:\s*Platform\.OS === 'web' \? 16 : Platform\.OS === 'android' \? 40 : 50/g, "paddingTop: Platform.OS === 'web' ? 16 : Math.max(insets.top, Platform.OS === 'android' ? 40 : 50)");

  // Also fix router.back() to handle canGoBack
  if (content.includes("router.back()")) {
    content = content.replace(/onPress=\{\(\) => router\.back\(\)\}/g, "onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } }}");
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
