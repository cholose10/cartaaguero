const fs = require('fs');
const path = require('path');

const jsonFiles = [
    'empleados.json',
    'gastos_vales.json',
    'mesas_config.json',
    'pedidos_activos.json',
    'productos.json',
    'productos-en.json',
    'productos-port.json',
    'sugerencias.json',
    'ventas_historico.json'
];

let allValid = true;

jsonFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ File does not exist: ${file}`);
        return;
    }
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        JSON.parse(content);
        console.log(`✅ ${file} is valid JSON.`);
    } catch (err) {
        console.error(`❌ ${file} has JSON errors:`, err.message);
        allValid = false;
    }
});

if (!allValid) {
    process.exit(1);
} else {
    console.log('🎉 All JSON files are valid!');
}
