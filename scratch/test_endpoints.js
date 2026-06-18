const http = require('http');

function testGet(urlPath) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:3000${urlPath}`, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        JSON.parse(data);
                        resolve({ ok: true, status: res.statusCode });
                    } catch (e) {
                        // might be html/css/js
                        resolve({ ok: true, status: res.statusCode, contentType: res.headers['content-type'] });
                    }
                } else {
                    resolve({ ok: false, status: res.statusCode, data });
                }
            });
        }).on('error', reject);
    });
}

function testPost(urlPath, body) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(body);
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: urlPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 201) {
                    resolve({ ok: true, status: res.statusCode, data });
                } else {
                    resolve({ ok: false, status: res.statusCode, data });
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function runTests() {
    try {
        console.log('Testing GET endpoints...');
        
        const resES = await testGet('/productos.json');
        console.log(`GET /productos.json: ${resES.ok ? '✅ OK' : '❌ FAIL (' + resES.status + ')'}`);
        
        const resEN = await testGet('/productos-en.json');
        console.log(`GET /productos-en.json: ${resEN.ok ? '✅ OK' : '❌ FAIL (' + resEN.status + ')'}`);
        
        const resPT = await testGet('/productos-port.json');
        console.log(`GET /productos-port.json: ${resPT.ok ? '✅ OK' : '❌ FAIL (' + resPT.status + ')'}`);

        const resSug = await testGet('/sugerencias.json');
        console.log(`GET /sugerencias.json: ${resSug.ok ? '✅ OK' : '❌ FAIL (' + resSug.status + ')'}`);

        const resAdminSuggestions = await testGet('/adminmozodigital/admin.html');
        console.log(`GET /adminmozodigital/admin.html: ${resAdminSuggestions.ok ? '✅ OK' : '❌ FAIL (' + resAdminSuggestions.status + ')'}`);

        console.log('\nTesting Admin POST Save endpoints...');

        // 1. Try to save Spanish
        const postES = await testPost('/api/admin/save-productos', {
            filename: 'productos.json',
            content: [{ id: 'prod9999', nombre: 'Test Local Save ES', precio: '100', categoria: 'Test' }]
        });
        console.log(`POST /api/admin/save-productos (ES): ${postES.ok ? '✅ OK' : '❌ FAIL (' + postES.status + '): ' + postES.data}`);

        // 2. Try to save English
        const postEN = await testPost('/api/admin/save-productos', {
            filename: 'productos-en.json',
            content: [{ id: 'prod9999', name: 'Test Local Save EN', price: '100', category: 'Test' }]
        });
        console.log(`POST /api/admin/save-productos (EN): ${postEN.ok ? '✅ OK' : '❌ FAIL (' + postEN.status + '): ' + postEN.data}`);

        // 3. Try to save Portuguese
        const postPT = await testPost('/api/admin/save-productos', {
            filename: 'productos-port.json',
            content: [{ id: 'prod9999', nome: 'Test Local Save PT', preco: '100', categoria: 'Test' }]
        });
        console.log(`POST /api/admin/save-productos (PT): ${postPT.ok ? '✅ OK' : '❌ FAIL (' + postPT.status + '): ' + postPT.data}`);

        // Revert files to original clean state by restoring them via git!
        console.log('\nReverting test save changes...');
        const exec = require('child_process').execSync;
        exec('git restore productos.json productos-en.json productos-port.json');
        console.log('✅ Reversion done.');

    } catch (e) {
        console.error('Error during test execution:', e);
    }
}

runTests();
