const fs = require('fs');
const path = require('path');

// Read productos.json catalog
const catalogProducts = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'productos.json'), 'utf8'));

// Copy of esProductoDeCocina from caja.html
function esProductoDeCocina(item) {
    if (!item) return false;
    
    // 1. Buscar en el catálogo para obtener la categoría exacta
    let cat = '';
    let catalogItem = null;
    if (item.id) {
        catalogItem = catalogProducts.find(p => String(p.id).toLowerCase() === String(item.id).toLowerCase());
    }
    if (!catalogItem && item.nombre) {
        catalogItem = catalogProducts.find(p => p.nombre.toLowerCase() === item.nombre.toLowerCase());
    }
    
    if (catalogItem && catalogItem.categoria) {
        cat = catalogItem.categoria.trim().toLowerCase();
    }

    const nombre = (item.nombre || '').toLowerCase();

    // --- Categorías fijas de cocina ---
    if (cat.includes('comidas') || cat.includes('pastas') || cat.includes('salsas') || cat.includes('entraditas')) {
        // Doble chequeo para excepciones frías en entraditas
        if (nombre.includes('fria') || nombre.includes('fría')) {
            return false;
        }
        return true;
    }

    // --- Categorías fijas de bar / cafetería ---
    if (cat.includes('cafetería') || cat.includes('cafeteria') || cat.includes('bebidas') || cat.includes('tragos') || cat.includes('postres')) {
        return false;
    }

    // --- Categoría mixta: Sandwiches ---
    if (cat.includes('sandwiches') || cat.includes('sándwiches')) {
        // Lomitos y hamburguesas van a cocina. Tostados tradicionales, pavita, chipá tostado van al bar/café.
        if (nombre.includes('lomito') || nombre.includes('burger') || nombre.includes('hamburguesa')) {
            return true;
        }
        return false;
    }

    // --- Categoría mixta: Promociones ---
    if (cat.includes('promociones')) {
        // Promos calientes/cocina: pastas, milanesas, omelette, huevos, french toast, pancake/proteico
        if (nombre.includes('pasta') || nombre.includes('milanesa') || nombre.includes('omelette') || nombre.includes('revuelto') || nombre.includes('avocado') || nombre.includes('french toast') || nombre.includes('proteico')) {
            return true;
        }
        return false;
    }

    // --- Productos personalizados / sugerencias o sin categoría mapeada ---
    const kitchenKeywords = [
        'mila', 'milanesa', 'pasta', 'ñoquis', 'tallarines', 'ravioles', 'sorrentinos', 'fideos',
        'lomo', 'lomito', 'bife', 'asado', 'burger', 'hamburguesa', 'pollo', 'pechuga', 'nuggets',
        'matambre', 'matambrito', 'salmón', 'salmon', 'merluza', 'rabas', 'empanada', 'omelette',
        'huevo', 'revuelto', 'risotto', 'papas', 'fritas', 'puré', 'pure', 'caliente', 'menú ejecutivo', 'ejecutivo'
    ];
    
    if (kitchenKeywords.some(kw => nombre.includes(kw))) {
        return true;
    }

    return false;
}

// Test cases
const testCases = [
    { name: 'Café expresso', expect: false },
    { name: 'Sandwich de lomito clásico', expect: true },
    { name: 'Tostado mixto', expect: false },
    { name: 'Burger bacon', expect: true },
    { name: 'Mila sola de carne', expect: true },
    { name: 'Empanadas', expect: true },
    { name: 'Rabas a la romana', expect: true },
    { name: 'PICADITA FRIA (para 2 personas)', expect: false },
    { name: 'PICADITA CALIENTE (para 2 personas)', expect: true },
    { name: 'TOSTADAS🍞', expect: false },
    { name: 'AMIGOS Y FAMILLA MILANESA PARA 3', expect: true },
    { name: 'menú ejecutivo', expect: true },
    { name: 'Coca-cola', expect: false },
    { name: 'Agua sin gas', expect: false },
    { name: 'Budín', expect: false },
    { name: 'Ravioles con salsa fileto', expect: true },
    { name: 'Trago Aperol', expect: false }
];

console.log("--- STARTING KITCHEN FILTER TESTS ---");
let passCount = 0;
testCases.forEach(tc => {
    // Find ID if it exists in catalog
    const catItem = catalogProducts.find(p => p.nombre.toLowerCase() === tc.name.toLowerCase());
    const id = catItem ? catItem.id : null;
    const result = esProductoDeCocina({ nombre: tc.name, id });
    const pass = result === tc.expect;
    console.log(`- ${tc.name.padEnd(40)} => Got: ${result.toString().padEnd(5)} | Expected: ${tc.expect.toString().padEnd(5)} | ${pass ? '✅ PASS' : '❌ FAIL'}`);
    if (pass) passCount++;
});

console.log(`\nResults: ${passCount}/${testCases.length} tests passed.`);
if (passCount !== testCases.length) {
    process.exit(1);
}
