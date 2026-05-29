const host = window.location.hostname;
const pathParts = window.location.pathname.split("/");

// Dynamic detection of GitHub URL parts
let USER = "tilo-restocafe"; 
let REPO = "cartaaguero";     

if (host.includes(".github.io")) {
    USER = host.split(".")[0];
    REPO = pathParts[1] || "";
}

const FILE_PATH = "sugerencias.json";
const BRANCH = "main";

// Elements
const textarea = document.getElementById("editor");
const btnGuardar = document.getElementById("guardar");
const estado = document.getElementById("estado");
const idiomaSelect = document.getElementById("idiomaSelect");
const nombreLocalInput = document.getElementById("nombreLocal");
const iframe = document.querySelector(".preview iframe");

const tokenInput = document.getElementById("token");
const btnSaveToken = document.getElementById("btnSaveToken");
const btnClearToken = document.getElementById("btnClearToken");
const tokenStatus = document.getElementById("tokenStatus");

let TOKEN = null;
let shaActual = null;
let jsonCompleto = {};

// Safe access to localStorage
function obtenerTokenLocal() {
    try {
        return localStorage.getItem("github_token") || "";
    } catch (e) {
        console.warn("localStorage no disponible:", e);
        return "";
    }
}

function guardarTokenLocal(tok) {
    try {
        localStorage.setItem("github_token", tok);
    } catch (e) {
        console.warn("No se pudo guardar en localStorage:", e);
    }
}

function borrarTokenLocal() {
    try {
        localStorage.removeItem("github_token");
    } catch (e) {
        console.warn("No se pudo borrar de localStorage:", e);
    }
}

// Adjust iframe src (local vs cloud)
function inicializarIframe() {
    if (iframe) {
        const isLocal = host === "localhost" || host === "127.0.0.1" || window.location.protocol === "file:";
        if (isLocal) {
            iframe.src = "../index.html";
        } else {
            iframe.src = `https://${USER}.github.io/${REPO}/`;
        }
    }
}

/* UTF8 ENCODING/DECODING */
function decodeUTF8(base64) {
    return new TextDecoder("utf-8").decode(
        Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    );
}

function encodeUTF8(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
}

/* REAL-TIME PREVIEW SYSTEM */
function actualizarVistaPrevia() {
    if (iframe && iframe.contentWindow) {
        const lineas = textarea.value
            .split("\n")
            .map(l => l.trim())
            .filter(l => l.length > 0);

        iframe.contentWindow.postMessage({
            type: "updateSuggestions",
            config: { nombreLocal: nombreLocalInput.value },
            sugerencias: lineas
        }, "*");
    }
}

/* VALIDATE AND DISPLAY GITHUB TOKEN */
async function validarTokenGitHub() {
    TOKEN = obtenerTokenLocal();
    if (tokenInput) tokenInput.value = TOKEN;

    if (!TOKEN) {
        if (tokenStatus) {
            tokenStatus.textContent = "❌ Sin Token (Solo Lectura)";
            tokenStatus.style.color = "#c48d49";
        }
        return;
    }

    if (tokenStatus) {
        tokenStatus.textContent = "Validando...";
        tokenStatus.style.color = "#c48d49";
    }

    try {
        const res = await fetch('https://api.github.com/user', {
            headers: { Authorization: `token ${TOKEN}` }
        });

        if (res.ok) {
            const data = await res.json();
            if (tokenStatus) {
                tokenStatus.textContent = `✅ Activo: ${data.login}`;
                tokenStatus.style.color = "#4a773c";
            }
        } else {
            if (tokenStatus) {
                tokenStatus.textContent = "⚠️ Token Vencido o Inválido";
                tokenStatus.style.color = "#b03a2e";
            }
        }
    } catch (e) {
        if (tokenStatus) {
            tokenStatus.textContent = "Error al conectar API";
            tokenStatus.style.color = "#b03a2e";
        }
    }
}

/* CARGAR SUGERENCIAS */
async function cargarJSON() {
    estado.textContent = "Cargando sugerencias...";

    // Obtener desde la API de GitHub
    const url = `https://api.github.com/repos/${USER}/${REPO}/contents/${FILE_PATH}?t=${Date.now()}`;
    const token = obtenerTokenLocal();

    const headers = {};
    if (token) headers.Authorization = `token ${token}`;

    try {
        const res = await fetch(url, { headers });

        if (!res.ok) throw new Error("No se pudo conectar a GitHub o el archivo no existe");

        const data = await res.json();
        shaActual = data.sha;

        jsonCompleto = JSON.parse(decodeUTF8(data.content));

        nombreLocalInput.value = jsonCompleto.config?.nombreLocal || "";
        mostrarIdioma();

        estado.textContent = "Cargado con éxito ✅";
        estado.style.color = "#4a773c";
        
        // Carga inicial en la vista previa
        setTimeout(actualizarVistaPrevia, 800);
    } catch (e) {
        console.error(e);
        estado.textContent = "Error al cargar sugerencias ❌";
        estado.style.color = "#b03a2e";
        
        // Intentar cargar localmente si falla la API (por ejemplo, si no hay token o internet)
        try {
            const localRes = await fetch(`../${FILE_PATH}?t=${Date.now()}`);
            if (localRes.ok) {
                jsonCompleto = await localRes.json();
                nombreLocalInput.value = jsonCompleto.config?.nombreLocal || "";
                mostrarIdioma();
                estado.textContent = "Cargado offline (Solo Lectura) 🔌";
                estado.style.color = "#c48d49";
                setTimeout(actualizarVistaPrevia, 800);
            }
        } catch (localErr) {
            console.error("Fallo carga offline:", localErr);
        }
    }
}

/* AUTOMATIC TEXTAREA RESIZING */
function autoResizeTextarea() {
    textarea.style.height = "auto";
    textarea.style.height = (textarea.scrollHeight + 4) + "px";
}

/* MOSTRAR SUGERENCIAS DEL IDIOMA SELECCIONADO */
function mostrarIdioma() {
    const idioma = idiomaSelect.value;
    const lista = jsonCompleto[idioma] || [];
    textarea.value = lista.join("\n");
    autoResizeTextarea();
}

/* GUARDAR SUGERENCIAS EN GITHUB */
async function guardarJSON() {
    const token = obtenerTokenLocal();
    if (!token) {
        alert("Introduce y guarda tu token de GitHub para poder guardar cambios en la nube.");
        return;
    }

    const idioma = idiomaSelect.value;
    const lineas = textarea.value
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0);

    jsonCompleto[idioma] = lineas;
    jsonCompleto.config = {
        ...jsonCompleto.config,
        nombreLocal: nombreLocalInput.value
    };

    estado.textContent = "Sincronizando cambios con GitHub...";
    estado.style.color = "#c48d49";

    const contenidoBase64 = encodeUTF8(
        JSON.stringify(jsonCompleto, null, 2)
    );

    const url = `https://api.github.com/repos/${USER}/${REPO}/contents/${FILE_PATH}`;

    try {
        const res = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `token ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Actualización de sugerencias de Ron (${idioma.toUpperCase()})`,
                content: contenidoBase64,
                sha: shaActual,
                branch: BRANCH
            })
        });

        if (res.ok) {
            const resData = await res.json();
            shaActual = resData.content.sha; // Actualizar SHA actual para la próxima guardada
            estado.textContent = "Sugerencias guardadas en la nube ✅";
            estado.style.color = "#4a773c";
            
            // Forzar actualización en tiempo real en el iframe
            actualizarVistaPrevia();
        } else {
            const errInfo = await res.text();
            throw new Error(`Código ${res.status}: ${errInfo}`);
        }
    } catch (e) {
        console.error(e);
        estado.textContent = "Error al guardar sugerencias ❌";
        estado.style.color = "#b03a2e";
    }
}

// Configurar Token
if (btnSaveToken) {
    btnSaveToken.addEventListener("click", () => {
        const val = tokenInput.value.trim();
        guardarTokenLocal(val);
        validarTokenGitHub();
        cargarJSON();
    });
}

if (btnClearToken) {
    btnClearToken.addEventListener("click", () => {
        borrarTokenLocal();
        validarTokenGitHub();
        if (tokenInput) tokenInput.value = "";
        location.reload();
    });
}

// Live preview binding
nombreLocalInput.addEventListener("input", actualizarVistaPrevia);
textarea.addEventListener("input", () => {
    autoResizeTextarea();
    actualizarVistaPrevia();
});
idiomaSelect.addEventListener("change", () => {
    mostrarIdioma();
    actualizarVistaPrevia();
});

// Emoji button insert
document.querySelectorAll(".emoji-list button").forEach(btn => {
    btn.addEventListener("click", () => {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const emoji = btn.textContent;

        textarea.value =
            textarea.value.substring(0, start) +
            emoji +
            textarea.value.substring(end);

        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        
        // Trigger live preview update
        autoResizeTextarea();
        actualizarVistaPrevia();
    });
});

// Escuchar si el iframe de vista previa se ha cargado de nuevo
window.addEventListener("message", (e) => {
    if (e.data && e.data.type === "previewReady") {
        actualizarVistaPrevia();
    }
});

/* INICIAR */
async function iniciar() {
    inicializarIframe();
    await validarTokenGitHub();
    await cargarJSON();
}

iniciar();
