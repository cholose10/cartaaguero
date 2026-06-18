const fs = require('fs');
const path = require('path');

try {
    const code = fs.readFileSync(path.join(__dirname, '..', 'caja.html'), 'utf8');
    
    // We only care about the body tags
    const bodyMatch = code.match(/<body>([\s\S]*?)<\/body>/i);
    if (!bodyMatch) {
        console.log("No body tag found.");
        process.exit(1);
    }
    
    const bodyHtml = bodyMatch[1];
    
    // Simple tokenizer for div tags
    const regex = /<\/?div\b[^>]*>/gi;
    let match;
    let level = 0;
    const stack = [];
    
    // Also track line numbers
    const lines = bodyHtml.split('\n');
    let currentLine = 0;
    
    lines.forEach((line, idx) => {
        let lineMatch;
        const lineRegex = /<\/?div\b[^>]*>/gi;
        while ((lineMatch = lineRegex.exec(line)) !== null) {
            const tag = lineMatch[0];
            const isClosing = tag.startsWith('</');
            if (!isClosing) {
                level++;
                stack.push({ tag, lineNum: idx + 1, content: line.trim() });
            } else {
                level--;
                stack.pop();
            }
        }
    });
    
    console.log("Final div nesting level at end of body:", level);
    if (level !== 0) {
        console.log("Mismatched tags stack trace (remaining open tags):");
        stack.forEach(s => {
            console.log(`Line ${s.lineNum}: ${s.tag} -> "${s.content}"`);
        });
    } else {
        console.log("All div tags are perfectly matched!");
    }
} catch (e) {
    console.error(e);
}
