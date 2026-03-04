const host = window.location.hostname;
const pathParts = window.location.pathname.split("/");

const USER = host.split(".")[0];   // usuario
const REPO = pathParts[1];         // nombre del repo
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

/* ============================= */
/* TOKEN */
/* ============================= */
function pedirToken() {
  if (!TOKEN) {
    TOKEN = prompt("Pegá tu token de GitHub:");
    if (TOKEN) localStorage.setItem("github_token", TOKEN);
  }
}

/* ============================= */
/* UTF8 */
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
/* CARGAR */
/* ============================= */
async function cargarJSON() {

  pedirToken();
  if (!TOKEN) return;

  estado.textContent = "Cargando...";

  const url = `https://api.github.com/repos/${USER}/${REPO}/contents/${FILE_PATH}`;

  const res = await fetch(url, {
    headers: { Authorization: `token ${TOKEN}` }
  });

  const data = await res.json();
  shaActual = data.sha;

  jsonCompleto = JSON.parse(decodeUTF8(data.content));

  nombreLocalInput.value = jsonCompleto.config?.nombreLocal || "";

  mostrarIdioma();

  estado.textContent = "Cargado ✅";
}

/* ============================= */
/* MOSTRAR SOLO IDIOMA */
/* ============================= */
function mostrarIdioma() {

  const idioma = idiomaSelect.value;
  const lista = jsonCompleto[idioma] || [];

  textarea.value = lista.join("\n");
}

/* ============================= */
/* GUARDAR */
/* ============================= */
async function guardarJSON() {

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

  estado.textContent = "Guardando...";

  const contenidoBase64 = encodeUTF8(
    JSON.stringify(jsonCompleto, null, 2)
  );

  const url = `https://api.github.com/repos/${USER}/${REPO}/contents/${FILE_PATH}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: `Actualización ${idioma}`,
      content: contenidoBase64,
      sha: shaActual,
      branch: BRANCH
    })
  });

  if (res.ok) {
    estado.textContent = "Guardado ✅";
    cargarJSON();
  } else {
    estado.textContent = "Error ❌";
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
