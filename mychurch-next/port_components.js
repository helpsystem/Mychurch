const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'AutoFlow-Studio', 'src');
const destComponentsDir = path.join(__dirname, 'src', 'components', 'automation');
const destAppDir = path.join(__dirname, 'src', 'app', 'admin', 'automation');

// Ensure directories exist
if (!fs.existsSync(destComponentsDir)) fs.mkdirSync(destComponentsDir, { recursive: true });
if (!fs.existsSync(destAppDir)) fs.mkdirSync(destAppDir, { recursive: true });

function processFile(sourcePath, destPath, replacements) {
    if (!fs.existsSync(sourcePath)) {
        console.error(`Source file not found: ${sourcePath}`);
        return;
    }
    let content = fs.readFileSync(sourcePath, 'utf8');
    
    // Apply replacements
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    
    fs.writeFileSync(destPath, content);
    console.log(`Ported: ${path.basename(sourcePath)} -> ${destPath}`);
}

// 1. Port WorkflowBuilder.tsx
processFile(
    path.join(srcDir, 'components', 'WorkflowBuilder.tsx'),
    path.join(destComponentsDir, 'WorkflowBuilder.tsx'),
    [
        [/from "\.\.\/lib\/firebase"/g, 'from "@/actions/automation"'],
        // Remove React import if it causes issues, but usually fine
    ]
);

// 2. Port LogTerminal.tsx
processFile(
    path.join(srcDir, 'components', 'LogTerminal.tsx'),
    path.join(destComponentsDir, 'LogTerminal.tsx'),
    [
        [/from "\.\.\/lib\/firebase"/g, 'from "@/actions/automation"'],
    ]
);

// 3. Port TestRunner.tsx
processFile(
    path.join(srcDir, 'components', 'TestRunner.tsx'),
    path.join(destComponentsDir, 'SandboxRunner.tsx'),
    [
        [/from "\.\.\/lib\/firebase"/g, 'from "@/actions/automation"'],
    ]
);

// 4. Port App.tsx to AutomationClient.tsx
processFile(
    path.join(srcDir, 'App.tsx'),
    path.join(destAppDir, 'AutomationClient.tsx'),
    [
        [/from "\.\/lib\/firebase"/g, 'from "@/actions/automation"'],
        [/from "\.\/lib\/engine"/g, 'from "@/lib/automation-engine"'],
        [/from "\.\/components\/WorkflowBuilder"/g, 'from "@/components/automation/WorkflowBuilder"'],
        [/from "\.\/components\/LogTerminal"/g, 'from "@/components/automation/LogTerminal"'],
        [/from "\.\/components\/TestRunner"/g, 'from "@/components/automation/SandboxRunner"'],
        // Remove WordPressPluginPanel and Header as we don't need them in the Next.js admin directly, or we can just adjust the imports.
        // Actually, we'll just fix up the App.tsx content for Next.js manually after this script runs.
    ]
);

console.log("Component porting script finished.");
