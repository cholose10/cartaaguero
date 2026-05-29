const host = window.location.hostname;
const pathParts = window.location.pathname.split("/");

// Lógica de detección dinámica para soporte marca blanca 100% genérico
let USER = "tilo-restocafe"; // Fallback por defecto
let REPO = "cartaaguero";     // Fallback por defecto

if (host.includes(".github.io")) {
    USER = host.split(".")[0];
    REPO = pathParts[1] || "";
}

const FILE_PATH = "sugerencias.json";
const BRANCH = "main";

let TOKEN = localStorage.getItem("github_token");
let shaActual = null;
let jsonCompleto = {};

const textarea = document.getElementById("editor");
const btnGuardar = document.getElementById("guardar");
const estado = document.getElementById("estado");
const idiomaSelect = document.getElementById("idiomaSelect");
const nombreLocalInput = document.getElementById("nombreLocal");

// Ajustar dinámicamente la vista previa del iframe (local vs nube)
const iframe = document.querySelector(".preview iframe");
if (iframe) {
    const isLocal = host === "localhost" || host === "127.0.0.1" || window.location.protocol === "file:";
    if (isLocal) {
        iframe.src = "../index.html"; // Cargar archivo index.html local
    } else {
        iframe.src = `https://${USER}.github.io/${REPO}/`; // Cargar de forma genérica el GitHub Pages
    }
}

/* ============================= */
/* TOKEN */
/* ============================= */
function pedirToken() {
    if (!TOKEN) {
        TOKEN = prompt("Pegá tu token de GitHub (Mozo Digital):");
        if (TOKEN) localStorage.setItem("github_token", TOKEN);
    }
}

/* ============================= */
/* UTF8 ENCODING/DECODING */
/* ============================= */
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

/* ============================= */
/* CARGAR SUGERENCIAS */
/* ============================= */
async function cargarJSON() {
    pedirToken();
    if (!TOKEN) {
        estado.textContent = "Token faltante ❌";
        return;
    }

    estado.textContent = "Cargando sugerencias...";

    const url = `https://api.github.com/repos/${USER}/${REPO}/contents/${FILE_PATH}?t=${Date.now()}`;

    try {
        const res = await fetch(url, {
            headers: { Authorization: `token ${TOKEN}` }
        });

        if (!res.ok) throw new Error("No se pudo conectar a GitHub");

        const data = await res.json();
        shaActual = data.sha;

        jsonCompleto = JSON.parse(decodeUTF8(data.content));

        nombreLocalInput.value = jsonCompleto.config?.nombreLocal || "";

        mostrarIdioma();

        estado.textContent = "Cargado con éxito ✅";
    } catch (e) {
        console.error(e);
        estado.textContent = "Error al conectar ❌";
    }
}

/* ============================= */
/* MOSTRAR SUGERENCIAS DEL IDIOMA SELECCIONADO */
/* ============================= */
function mostrarIdioma() {
    const idioma = idiomaSelect.value;
    const lista = jsonCompleto[idioma] || [];
    textarea.value = lista.join("\n");
}

/* ============================= */
/* GUARDAR SUGERENCIAS EN GITHUB */
/* ============================= */
async function guardarJSON() {
    if (!TOKEN) {
        showToast("Se necesita token para guardar", "err");
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

    estado.textContent = "Guardando sugerencias...";

    const contenidoBase64 = encodeUTF8(
        JSON.stringify(jsonCompleto, null, 2)
    );

    const url = `https://api.github.com/repos/${USER}/${REPO}/contents/${FILE_PATH}`;

    try {
        const res = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `token ${TOKEN}`,
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
            estado.textContent = "Guardado con éxito ✅";
            
            // Recargar la vista previa local u online
            if (iframe) {
                const currentSrc = iframe.src;
                iframe.src = "";
                iframe.src = currentSrc;
            }

            cargarJSON();
        } else {
            throw new Error("Respuesta errónea de GitHub");
        }
    } catch (e) {
        console.error(e);
        estado.textContent = "Error al guardar sugerencias ❌";
    }
}

/* ============================= */
/* EVENTOS */
/* ============================= */
btnGuardar.addEventListener("click", guardarJSON);
idiomaSelect.addEventListener("change", mostrarIdioma);

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
    });
});

/* ============================= */
/* INICIAR */
/* ============================= */
cargarJSON();
