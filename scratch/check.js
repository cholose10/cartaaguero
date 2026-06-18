const fs = require('fs');
const path = require('path');

try {
    const code = fs.readFileSync(path.join(__dirname, '..', 'caja.html'), 'utf8');
    const lines = code.split('\n');
    lines.forEach((line, idx) => {
        if (line.includes('ledger-item') || line.includes('resumenVentas')) {
            console.log(`Line ${idx + 1}: ${line.trim()}`);
        }
    });
} catch (e) {
    console.error(e);
}
