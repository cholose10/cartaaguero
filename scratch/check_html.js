const fs = require('fs');
const path = require('path');
const vm = require('vm');

try {
    const html = fs.readFileSync(path.join(__dirname, '..', 'caja.html'), 'utf8');
    
    // Regular expression to extract script tags
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let count = 0;
    
    while ((match = scriptRegex.exec(html)) !== null) {
        count++;
        const jsCode = match[1];
        try {
            // Compile code without running it
            new vm.Script(jsCode, { filename: `inline-script-${count}.js` });
            console.log(`Script tag #${count} compiled successfully.`);
        } catch (e) {
            console.error(`Error in Script tag #${count}:`, e);
            process.exit(1);
        }
    }
    
    if (count === 0) {
        console.warn("No script tags found.");
    } else {
        console.log("All scripts compiled without syntax errors.");
    }
} catch (e) {
    console.error("Failed to read or check file:", e);
    process.exit(1);
}
