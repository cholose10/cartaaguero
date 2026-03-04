<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin - Mozo Digital</title>
  <link rel="stylesheet" href="admin.css">
</head>
<body>

<div class="layout">

  <-- PANEL IZQUIERDO -->
  <div class="panel">

    <h2>📝 Mozo Digital</h2>

    <label>Nombre del local</label>
    <input type="text" id="nombreLocal" placeholder="Ej: Tilo Café">

    <label>Idioma</label>
    <select id="idiomaSelect">
      <option value="es">Español</option>
      <option value="en">English</option>
      <option value="pt">Português</option>
    </select>

    <label>Sugerencias (una por línea)</label>
    <textarea id="editor"></textarea>

    <div class="emoji-list">
      <button type="button">☕</button>
      <button type="button">🥐</button>
      <button type="button">🍰</button>
      <button type="button">🍔</button>
      <button type="button">🍺</button>
      <button type="button">🎉</button>
      <button type="button">🔥</button>
      <button type="button">❤️</button>
    </div>

    <button id="guardar">Guardar cambios</button>
    <small id="estado"></small>

  </div>

  <!-- PREVIEW DERECHO -->
  <div class="preview">
    <iframe id="preview" src="../index.html"></iframe>
  </div>

</div>

<script src="admin.js"></script>

</body>
</html>
