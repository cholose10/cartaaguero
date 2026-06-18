# 🍽️ Tilo Café - Menú Digital & Sistema POS Real-Time

Este es el repositorio del sistema digital de Tilo Café. Incluye la carta interactiva para clientes con sincronización en tiempo real de mesas, la consola de administración de platos/sugerencias, y el panel de control de Caja Central para facturación, comandas y libro diario.

---

## 🚀 Características Principales
1. **Carta Interactiva (Clientes):** Los clientes escanean el QR de su mesa y pueden agregar productos a su carrito compartido en tiempo real, añadir notas personalizadas y realizar el pedido.
2. **Caja Central (`caja.html`):** Los cajeros ven el mapa interactivo de mesas, confirman/editan pedidos, añaden productos adicionales, controlan consumos, registran gastos o vales, y visualizan el balance neto del día.
3. **División de Comandas (Impresión Térmica):** Impresión directa de tickets de comanda divididos de forma inteligente por destino (Cocina vs. Cafetería/Barra) en formato estándar de 80mm sin dependencias adicionales.
4. **Paneles de Administración Dobles:**
   - **Administración de Productos (`admin.html`):** Edición interactiva de la carta de platos con soporte para traducción automática por IA (Español, Inglés, Portugués).
   - **Administración de Sugerencias (`adminmozodigital/admin.html`):** Editor de textos dinámicos para el teleprompter de la carta digital (el Mozo Digital "Ron").
5. **Guardado Híbrido Inteligente (Local + GitHub):** 
   - Si corres el sistema localmente, los paneles guardan los cambios directamente en el disco de tu PC.
   - Si hospedas la carta en GitHub Pages, los paneles se conectan directamente a la API de GitHub usando un Token de Acceso Personal (PAT) para guardar los archivos `productos.json` y `sugerencias.json` en tu repositorio.

---

## 💻 Instalación y Uso Local

Para ejecutar el sistema en tu red local (Wi-Fi de la cafetería) para que las mesas se conecten al servidor de la Caja:

1. **Requisitos:** Tener instalado [Node.js](https://nodejs.org/).
2. **Instalar dependencias:**
   ```bash
   npm install
   ```
3. **Iniciar el servidor:**
   ```bash
   node server.js
   ```
4. **Acceder a las interfaces:**
   - **Carta para clientes (Simulación):** `http://localhost:3000/?mesa=3`
   - **Consola de Caja Central:** `http://localhost:3000/caja.html`
   - **Panel de platos (Admin):** `http://localhost:3000/admin.html`
   - **Panel de sugerencias (Teleprompter):** `http://localhost:3000/adminmozodigital/admin.html`

---

## 📦 Cómo subir el código a tu GitHub

Sigue estos pasos en tu terminal para publicar este código en tu repositorio de GitHub por primera vez:

1. **Agregar el origen remoto de tu repositorio de GitHub:**
   *(Reemplaza `tilo-restocafe/cartaaguero` por tu usuario/repositorio real)*
   ```bash
   git remote add origin https://github.com/tilo-restocafe/cartaaguero.git
   ```

2. **Subir los archivos:**
   ```bash
   git add .
   git commit -m "Initial commit: Rediseño completo sistema POS y menú digital"
   git push -u origin main
   ```

---

## ⚙️ Configuración de GitHub Pages (Menú en la Nube)

Si deseas utilizar GitHub Pages para servir el menú digital de manera estática:

1. Ve a la pestaña **Settings** de tu repositorio en GitHub.
2. En la barra lateral izquierda, haz clic en **Pages**.
3. En la sección **Build and deployment**, selecciona la rama `main` y la carpeta `/` (root), luego haz clic en **Save**.
4. Tu sitio estará disponible en pocos minutos en la dirección `https://<TU-USUARIO>.github.io/<TU-REPOSITORIO>/`.

---

## 🔒 Configuración del Token de GitHub en el Admin

Para permitir que los paneles de administración (`admin.html` y `adminmozodigital/admin.html`) puedan guardar cambios en la nube directamente desde el navegador cuando la carta está alojada en GitHub Pages:

1. **Generar un Personal Access Token (PAT) en GitHub:**
   - Ve a tu cuenta de GitHub -> **Settings** -> **Developer Settings** -> **Personal Access Tokens (Tokens classic)**.
   - Haz clic en **Generate new token (classic)**.
   - Asígnale una descripción (ej: `Tilo Admin Menu`) y selecciona el permiso **`repo`** (completo).
   - Genera el token y cópialo.
2. **Configurar el Token en la interfaz de administración:**
   - Abre tu panel administrador (`admin.html` o `adminmozodigital/admin.html`).
   - Haz clic en el botón **🔒 Acceso Propietario**.
   - Introduce el código de seguridad: **`aguero2026`**.
   - Pega tu Token de GitHub en el campo correspondiente y haz clic en **💾** (Guardar).
   - ¡Listo! Los cambios que guardes en los paneles se aplicarán inmediatamente en tu repositorio de GitHub.
