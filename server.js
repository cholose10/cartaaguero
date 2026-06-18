const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all static files from root
app.use(express.static(__dirname));

// Data Files
const ACTIVE_ORDERS_FILE = path.join(__dirname, 'pedidos_activos.json');
const SALES_HISTORY_FILE = path.join(__dirname, 'ventas_historico.json');
const EXPENSES_VALES_FILE = path.join(__dirname, 'gastos_vales.json');
const EMPLOYEES_FILE = path.join(__dirname, 'empleados.json');
const CONFIG_MESAS_FILE = path.join(__dirname, 'mesas_config.json');
const CIERRES_FILE = path.join(__dirname, 'cierres_caja.json');

// Helper functions for reading and writing files safely
function readJSONFile(filePath, defaultValue = []) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
            return defaultValue;
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data || JSON.stringify(defaultValue));
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return defaultValue;
    }
}

function writeJSONFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing to ${filePath}:`, error);
        return false;
    }
}

// ----------------------------------------------------
// ORDERS API
// ----------------------------------------------------

// GET active orders
app.get('/api/pedidos', (req, res) => {
    const orders = readJSONFile(ACTIVE_ORDERS_FILE);
    res.json(orders);
});

// GET active order for a specific table
app.get('/api/pedidos/mesa/:mesa', (req, res) => {
    const orders = readJSONFile(ACTIVE_ORDERS_FILE);
    const { mesa } = req.params;
    const order = orders.find(o => String(o.mesa) === String(mesa));
    if (order) {
        res.json(order);
    } else {
        res.json({ mesa: mesa, items: [], total: 0, estado: 'libre' });
    }
});

// POST sync cart for a specific table
app.post('/api/pedidos/mesa/:mesa/sync', (req, res) => {
    const orders = readJSONFile(ACTIVE_ORDERS_FILE);
    const { mesa } = req.params;
    const { items, total } = req.body;

    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Items son requeridos y deben ser un array' });
    }

    let order = orders.find(o => String(o.mesa) === String(mesa));

    if (order) {
        // If the order is already confirmed, block changes from client devices
        if (order.estado !== 'carrito' && order.estado !== 'pendiente') {
            return res.status(400).json({ error: 'El pedido ya está en cocina y no se puede modificar' });
        }
        order.items = items;
        order.total = total || 0;
        order.fechaModificacion = new Date().toISOString();
    } else {
        // Create new active order in 'carrito' state
        order = {
            id: 'ped-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            mesa: mesa,
            items: items,
            total: total || 0,
            origen: 'mesa',
            estado: 'carrito',
            fechaCreacion: new Date().toISOString(),
            fechaModificacion: new Date().toISOString()
        };
        orders.push(order);
    }

    writeJSONFile(ACTIVE_ORDERS_FILE, orders);
    res.json(order);
});

// POST submit table order for cashier confirmation
app.post('/api/pedidos/mesa/:mesa/enviar', (req, res) => {
    const orders = readJSONFile(ACTIVE_ORDERS_FILE);
    const { mesa } = req.params;

    const order = orders.find(o => String(o.mesa) === String(mesa));
    if (!order) {
        return res.status(404).json({ error: 'No hay pedido activo para esta mesa' });
    }

    order.estado = 'pendiente';
    order.fechaModificacion = new Date().toISOString();

    writeJSONFile(ACTIVE_ORDERS_FILE, orders);
    res.json(order);
});

// POST new order (placed by client QR or Cashier)
app.post('/api/pedidos', (req, res) => {
    const orders = readJSONFile(ACTIVE_ORDERS_FILE);
    const { mesa, items, total, origen, estado } = req.body;

    if (!mesa || !items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Mesa e items son requeridos' });
    }

    // Generate unique sequential ID
    const newOrder = {
        id: 'ped-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        mesa: mesa,
        items: items,
        total: total || 0,
        origen: origen || 'mesa', // 'mesa', 'mostrador', 'telefono'
        estado: estado || 'pendiente', // 'pendiente', 'en_cocina', 'listo', 'entregado'
        fechaCreacion: new Date().toISOString(),
        fechaModificacion: new Date().toISOString()
    };

    orders.push(newOrder);
    writeJSONFile(ACTIVE_ORDERS_FILE, orders);
    res.status(201).json(newOrder);
});

// PUT update order (modify items, quantities, or total)
app.put('/api/pedidos/:id', (req, res) => {
    const orders = readJSONFile(ACTIVE_ORDERS_FILE);
    const { id } = req.params;
    const { items, total, estado, mesa } = req.body;

    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (items) orders[idx].items = items;
    if (total !== undefined) orders[idx].total = total;
    if (estado) orders[idx].estado = estado;
    if (mesa) orders[idx].mesa = mesa;
    orders[idx].fechaModificacion = new Date().toISOString();

    writeJSONFile(ACTIVE_ORDERS_FILE, orders);
    res.json(orders[idx]);
});

// PUT update order status
app.put('/api/pedidos/:id/status', (req, res) => {
    const orders = readJSONFile(ACTIVE_ORDERS_FILE);
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
        return res.status(400).json({ error: 'Estado es requerido' });
    }

    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    orders[idx].estado = estado;
    orders[idx].fechaModificacion = new Date().toISOString();

    writeJSONFile(ACTIVE_ORDERS_FILE, orders);
    res.json(orders[idx]);
});

// POST checkout/archive an order
app.post('/api/pedidos/:id/cobrar', (req, res) => {
    const orders = readJSONFile(ACTIVE_ORDERS_FILE);
    const sales = readJSONFile(SALES_HISTORY_FILE);
    const { id } = req.params;
    const { metodoPago, totalCobrado, mozo } = req.body;

    if (!metodoPago) {
        return res.status(400).json({ error: 'Metodo de pago es requerido' });
    }

    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) {
        return res.status(404).json({ error: 'Pedido activo no encontrado' });
    }

    const orderToCobrar = orders[idx];
    orders.splice(idx, 1); // remove from active orders

    const finalSale = {
        ...orderToCobrar,
        estado: 'entregado',
        metodoPago: metodoPago, // 'QR', 'Alias', 'Transferencia', 'Tarjeta', 'Efectivo'
        totalCobrado: totalCobrado !== undefined ? totalCobrado : orderToCobrar.total,
        mozo: mozo || 'Sin asignar',
        fechaPago: new Date().toISOString()
    };

    sales.push(finalSale);

    writeJSONFile(ACTIVE_ORDERS_FILE, orders);
    writeJSONFile(SALES_HISTORY_FILE, sales);

    res.json({ success: true, sale: finalSale });
});

// ----------------------------------------------------
// DAILY SUMMARY API
// ----------------------------------------------------

// GET sales summary for cashier
app.get('/api/ventas/resumen', (req, res) => {
    const sales = readJSONFile(SALES_HISTORY_FILE);
    const expensesVales = readJSONFile(EXPENSES_VALES_FILE);

    // Filter active (unclosed) sales
    const activeSales = sales.filter(s => s.cerrado !== true);

    const summary = {
        totalVentas: 0,
        porMetodo: {
            'Efectivo': 0,
            'Tarjeta': 0,
            'Transferencia': 0,
            'Alias': 0,
            'QR': 0
        },
        cantidadPedidos: activeSales.length,
        ventasDetalladas: activeSales
    };

    activeSales.forEach(s => {
        const met = s.metodoPago || 'Efectivo';
        const val = parseFloat(s.totalCobrado || s.total || 0);
        summary.totalVentas += val;
        if (summary.porMetodo[met] !== undefined) {
            summary.porMetodo[met] += val;
        } else {
            summary.porMetodo[met] = val;
        }
    });

    // Filter active (unclosed) expenses & vouchers
    const activeExpensesVales = expensesVales.filter(ev => ev.cerrado !== true);

    let totalGastos = 0;
    let totalVales = 0;

    activeExpensesVales.forEach(ev => {
        const amount = parseFloat(ev.monto || 0);
        if (ev.tipo === 'gasto') {
            totalGastos += amount;
        } else if (ev.tipo === 'vale') {
            totalVales += amount;
        }
    });

    summary.totalGastos = totalGastos;
    summary.totalVales = totalVales;
    summary.cajaNeta = (summary.porMetodo['Efectivo'] || 0) - totalGastos - totalVales; // Cash in box estimation

    // Calculate sales per mozo
    const ventasPorMozo = {};
    activeSales.forEach(s => {
        const m = s.mozo || 'Sin asignar';
        const val = parseFloat(s.totalCobrado || s.total || 0);
        if (!ventasPorMozo[m]) {
            ventasPorMozo[m] = { total: 0, count: 0 };
        }
        ventasPorMozo[m].total += val;
        ventasPorMozo[m].count += 1;
    });
    summary.ventasPorMozo = ventasPorMozo;

    res.json(summary);
});

// POST perform shift/day closure
app.post('/api/ventas/cierre', (req, res) => {
    const { tipo, turno, responsable, efectivoFisico, diferencia, observaciones } = req.body;

    if (!tipo || !turno || !responsable) {
        return res.status(400).json({ error: 'Tipo, turno y responsable son requeridos' });
    }

    const sales = readJSONFile(SALES_HISTORY_FILE);
    const expensesVales = readJSONFile(EXPENSES_VALES_FILE);
    const closures = readJSONFile(CIERRES_FILE);

    // Get unclosed transactions
    const activeSales = sales.filter(s => s.cerrado !== true);
    const activeExpensesVales = expensesVales.filter(ev => ev.cerrado !== true);

    if (activeSales.length === 0 && activeExpensesVales.length === 0) {
        return res.status(400).json({ error: 'No hay transacciones activas para cerrar.' });
    }

    // Calculate totals
    let totalVentas = 0;
    const porMetodo = { 'Efectivo': 0, 'Tarjeta': 0, 'Transferencia': 0, 'Alias': 0, 'QR': 0 };
    activeSales.forEach(s => {
        const met = s.metodoPago || 'Efectivo';
        const val = parseFloat(s.totalCobrado || s.total || 0);
        totalVentas += val;
        if (porMetodo[met] !== undefined) porMetodo[met] += val;
        else porMetodo[met] = val;
    });

    let totalGastos = 0;
    let totalVales = 0;
    activeExpensesVales.forEach(ev => {
        const amount = parseFloat(ev.monto || 0);
        if (ev.tipo === 'gasto') totalGastos += amount;
        else if (ev.tipo === 'vale') totalVales += amount;
    });

    const cajaNeta = (porMetodo['Efectivo'] || 0) - totalGastos - totalVales;

    const closureId = 'cie-' + Date.now();
    const nowStr = new Date().toISOString();

    const closureReport = {
        id: closureId,
        tipo, // 'parcial' o 'total'
        turno, // 'mañana' o 'noche'
        fecha: nowStr,
        responsable,
        totalVentas,
        porMetodo,
        totalGastos,
        totalVales,
        cajaNeta,
        efectivoFisico: efectivoFisico !== undefined ? parseFloat(efectivoFisico) : 0,
        diferencia: diferencia !== undefined ? parseFloat(diferencia) : 0,
        observaciones: observaciones || '',
        cantidadPedidos: activeSales.length,
        ventasDetalladas: activeSales,
        gastosDetallados: activeExpensesVales.filter(ev => ev.tipo === 'gasto'),
        valesDetallados: activeExpensesVales.filter(ev => ev.tipo === 'vale')
    };

    // Mark transactions as closed
    sales.forEach(s => {
        if (s.cerrado !== true) {
            s.cerrado = true;
            s.cierreId = closureId;
            s.fechaCierre = nowStr;
        }
    });

    expensesVales.forEach(ev => {
        if (ev.cerrado !== true) {
            ev.cerrado = true;
            ev.cierreId = closureId;
            ev.fechaCierre = nowStr;
        }
    });

    closures.push(closureReport);

    writeJSONFile(SALES_HISTORY_FILE, sales);
    writeJSONFile(EXPENSES_VALES_FILE, expensesVales);
    writeJSONFile(CIERRES_FILE, closures);

    res.status(201).json(closureReport);
});

// ----------------------------------------------------
// EXPENSES & VOUCHERS API
// ----------------------------------------------------

// GET all expenses and vouchers
app.get('/api/gastos-vales', (req, res) => {
    const movements = readJSONFile(EXPENSES_VALES_FILE);
    res.json(movements);
});

// POST record new expense/voucher
app.post('/api/gastos-vales', (req, res) => {
    const movements = readJSONFile(EXPENSES_VALES_FILE);
    const { tipo, detalle, monto, empleadoId, empleadoNombre } = req.body;

    if (!tipo || !detalle || monto === undefined) {
        return res.status(400).json({ error: 'Tipo, detalle y monto son requeridos' });
    }

    const newMov = {
        id: 'mov-' + Date.now(),
        tipo, // 'gasto' o 'vale'
        detalle,
        monto: parseFloat(monto),
        fecha: new Date().toISOString()
    };

    if (tipo === 'vale') {
        newMov.empleadoId = empleadoId || null;
        newMov.empleadoNombre = empleadoNombre || null;
    }

    movements.push(newMov);
    writeJSONFile(EXPENSES_VALES_FILE, movements);
    res.status(201).json(newMov);
});

// ----------------------------------------------------
// EMPLOYEES & ATTENDANCE API
// ----------------------------------------------------

// GET all employees
app.get('/api/empleados', (req, res) => {
    const employees = readJSONFile(EMPLOYEES_FILE);
    res.json(employees);
});

// POST add/update employee
app.post('/api/empleados', (req, res) => {
    const employees = readJSONFile(EMPLOYEES_FILE);
    const { id, nombre, fechaIngreso, activo, fechaEgreso, numero, horarios } = req.body;

    if (!nombre) {
        return res.status(400).json({ error: 'Nombre es requerido' });
    }

    let emp;
    if (id) {
        // Update
        emp = employees.find(e => e.id === id);
        if (!emp) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        emp.nombre = nombre;
        if (fechaIngreso) emp.fechaIngreso = fechaIngreso;
        if (activo !== undefined) emp.activo = activo;
        emp.fechaEgreso = fechaEgreso !== undefined ? fechaEgreso : emp.fechaEgreso;
        if (numero !== undefined) emp.numero = numero !== null ? parseInt(numero) : null;
        if (horarios !== undefined) emp.horarios = horarios;
    } else {
        // Create
        emp = {
            id: 'emp-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            nombre,
            fechaIngreso: fechaIngreso || new Date().toISOString().split('T')[0],
            activo: activo !== undefined ? activo : true,
            fechaEgreso: null,
            asistencia: [],
            numero: numero !== undefined && numero !== null ? parseInt(numero) : null,
            horarios: horarios || ''
        };
        employees.push(emp);
    }

    writeJSONFile(EMPLOYEES_FILE, employees);
    res.json(emp);
});

// POST register clock-in/out attendance
app.post('/api/empleados/:id/asistencia', (req, res) => {
    const employees = readJSONFile(EMPLOYEES_FILE);
    const { id } = req.params;
    const { tipo } = req.body; // 'entrada' or 'salida'

    if (tipo !== 'entrada' && tipo !== 'salida') {
        return res.status(400).json({ error: 'Tipo debe ser entrada o salida' });
    }

    const emp = employees.find(e => e.id === id);
    if (!emp) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    if (!emp.asistencia) {
        emp.asistencia = [];
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('es-AR', { hour12: false });

    if (tipo === 'entrada') {
        // Check if already clocked in today with no clock out
        const lastEntry = emp.asistencia[emp.asistencia.length - 1];
        if (lastEntry && lastEntry.fecha === todayStr && !lastEntry.salida) {
            return res.status(400).json({ error: 'El empleado ya marcó entrada para el día de hoy.' });
        }

        const newEntry = {
            fecha: todayStr,
            entrada: timeStr,
            salida: null
        };
        emp.asistencia.push(newEntry);
        writeJSONFile(EMPLOYEES_FILE, employees);
        return res.json({ success: true, entry: newEntry });
    } else {
        // Clock out: find the last entry of today or any entry with no clock out
        let targetEntry = emp.asistencia.find(a => !a.salida);
        if (!targetEntry) {
            targetEntry = emp.asistencia[emp.asistencia.length - 1];
        }

        if (!targetEntry) {
            return res.status(400).json({ error: 'No se encontró un registro de entrada previo para marcar salida.' });
        }

        targetEntry.salida = timeStr;
        writeJSONFile(EMPLOYEES_FILE, employees);
        return res.json({ success: true, entry: targetEntry });
    }
});

// ----------------------------------------------------
// TABLES CONFIGURATION API
// ----------------------------------------------------

const DEFAULT_MESAS_CONFIG = {
    salonTables: 12,
    virtualTables: [
        { id: 'Bar', nombre: 'Bar / Barra' },
        { id: 'Llevar1', nombre: 'Para Llevar 1' },
        { id: 'Llevar2', nombre: 'Para Llevar 2' }
    ]
};

// GET tables config
app.get('/api/config-mesas', (req, res) => {
    const config = readJSONFile(CONFIG_MESAS_FILE, DEFAULT_MESAS_CONFIG);
    res.json(config);
});

// POST update tables config
app.post('/api/config-mesas', (req, res) => {
    const { salonTables, virtualTables } = req.body;
    const config = readJSONFile(CONFIG_MESAS_FILE, DEFAULT_MESAS_CONFIG);
    if (salonTables !== undefined) config.salonTables = parseInt(salonTables);
    if (virtualTables !== undefined) config.virtualTables = virtualTables;
    writeJSONFile(CONFIG_MESAS_FILE, config);
    res.json(config);
});

// ----------------------------------------------------
// ADMIN LOCAL SAVES API
// ----------------------------------------------------

// POST save menu configuration locally
app.post('/api/admin/save-productos', (req, res) => {
    const { filename, content } = req.body;

    if (!filename || !content) {
        return res.status(400).json({ error: 'Filename y content son requeridos' });
    }

    // Block directory traversal for safety
    const safeFilename = path.basename(filename);
    const allowedFiles = ['productos.json', 'productos-en.json', 'productos-port.json'];

    if (!allowedFiles.includes(safeFilename)) {
        return res.status(400).json({ error: 'Nombre de archivo no permitido' });
    }

    const targetPath = path.join(__dirname, safeFilename);

    try {
        fs.writeFileSync(targetPath, JSON.stringify(content, null, 2), 'utf8');
        console.log(`Saved file locally: ${safeFilename}`);
        res.json({ success: true, message: `Archivo ${safeFilename} guardado en disco.` });
    } catch (e) {
        console.error(`Error saving menu file ${safeFilename}:`, e);
        res.status(500).json({ error: `Error escribiendo el archivo: ${e.message}` });
    }
});

// POST save suggestions configuration locally
app.post('/api/admin/save-sugerencias', (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Content es requerido' });
    }

    const targetPath = path.join(__dirname, 'sugerencias.json');

    try {
        fs.writeFileSync(targetPath, JSON.stringify(content, null, 2), 'utf8');
        console.log(`Saved suggestions locally.`);
        res.json({ success: true, message: `Sugerencias guardadas en disco.` });
    } catch (e) {
        console.error(`Error saving suggestions:`, e);
        res.status(500).json({ error: `Error escribiendo el archivo: ${e.message}` });
    }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    // Detect local network IP address
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIP = 'localhost';
    
    for (const interfaceName in networkInterfaces) {
        for (const iface of networkInterfaces[interfaceName]) {
            // Check for IPv4 and ensure it's not the loopback (internal) address
            if ((iface.family === 'IPv4' || iface.family === 4) && !iface.internal) {
                localIP = iface.address;
                break;
            }
        }
    }

    console.log(`====================================================`);
    console.log(`🚀 SERVIDOR DE CARTA DIGITAL INICIADO EXITOSAMENTE`);
    console.log(`====================================================`);
    console.log(`💻 EN ESTA COMPUTADORA:`);
    console.log(`👉 Menú de Clientes:      http://localhost:${PORT}`);
    console.log(`👉 Consola de Caja:       http://localhost:${PORT}/caja.html`);
    console.log(`👉 Consola de Cocina:     http://localhost:${PORT}/cocina.html`);
    console.log(`👉 Consola de Admin:      http://localhost:${PORT}/admin.html`);
    console.log(`----------------------------------------------------`);
    console.log(`📱 EN OTROS DISPOSITIVOS (Móviles, Tablets, etc. en el mismo Wi-Fi):`);
    console.log(`👉 Menú de Clientes:      http://${localIP}:${PORT}`);
    console.log(`👉 Consola de Caja:       http://${localIP}:${PORT}/caja.html`);
    console.log(`👉 Consola de Cocina:     http://${localIP}:${PORT}/cocina.html`);
    console.log(`👉 Consola de Admin:      http://${localIP}:${PORT}/admin.html`);
    console.log(`====================================================`);
    console.log(`Presiona Ctrl + C en esta ventana para apagar el servidor.`);
});
