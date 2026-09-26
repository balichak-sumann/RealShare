import os
import re

files_to_fix = [
    "src/app/rewards.tsx",
    "src/app/about.tsx",
    "src/app/services/interior-design.tsx",
    "src/app/ledger.tsx",
    "src/app/services/property-management.tsx",
    "src/app/services/home-loans.tsx",
    "src/app/leads.tsx",
    "src/app/how-it-works.tsx",
    "src/app/owner-dashboard.tsx",
    "src/app/notifications.tsx",
    "src/app/partners.tsx",
    "src/app/property-management.tsx",
    "src/app/services.tsx",
    "src/app/community.tsx",
    "src/app/agents.tsx",
    "src/app/contact.tsx",
    "src/app/my-assets/[id].tsx",
    "src/app/my-assets/new.tsx",
    "src/app/construction-tracking.tsx",
    "src/app/(tabs)/explore.tsx",
    "src/app/developers.tsx",
    "src/app/settings.tsx",
    "src/app/my-assets.tsx",
    "src/app/sell.tsx",
    "src/app/tools/index.tsx",
    "src/app/tools/emi-calculator.tsx",
    "src/app/tools/property-valuation.tsx",
    "src/app/tools/stamp-duty.tsx",
    "src/app/compare.tsx",
    "src/app/projects.tsx",
    "src/app/developer/[id].tsx",
]

import sys

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Add import if missing
    if "useSafeAreaInsets" not in content:
        # Find last import
        imports_end = content.rfind("import ")
        if imports_end != -1:
            line_end = content.find("\n", imports_end)
            content = content[:line_end+1] + "import { useSafeAreaInsets } from 'react-native-safe-area-context';\n" + content[line_end+1:]

    # 2. Add const insets = useSafeAreaInsets(); to component
    # This is trickier because we need to find the main component
    # Usually it's `export default function XYZ() {` or `export default function XYZ() { ... }`
    if "useSafeAreaInsets()" not in content:
        match = re.search(r'export default function [a-zA-Z0-9_]+\([^)]*\)\s*{', content)
        if match:
            end_idx = match.end()
            content = content[:end_idx] + "\n  const insets = useSafeAreaInsets();" + content[end_idx:]

    # 3. Replace style={styles.header} with the array
    content = content.replace("style={styles.header}", "style={[styles.header, { paddingTop: Platform.OS === 'web' ? 18 : Math.max(insets.top, 50) }]}")

    with open(filepath, 'w') as f:
        f.write(content)
        
    print(f"Fixed {filepath}")
