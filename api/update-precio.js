export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { productoId, nuevoPrecio } = req.body;

  if (!productoId || !nuevoPrecio) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  try {
    // Datos del repo
    const repoOwner = "cholose10";
    const repoName = "cartatilo";
    const filePath = "productos.json";

    // Token guardado como variable secreta (no en el código)
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    // Leer contenido actual del archivo
    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const data = await response.json();
    const content = Buffer.from(data.content, "base64").toString("utf8");
    const productos = JSON.parse(content);

    // Buscar y actualizar el producto
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return res.status(404).json({ message: "Producto no encontrado" });

    producto.precio = nuevoPrecio;

    // Guardar cambios
    const updatedContent = Buffer.from(JSON.stringify(productos, null, 2)).toString("base64");

    await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        message: `Actualización de precio de ${producto.nombre}`,
        content: updatedContent,
        sha: data.sha,
      }),
    });

    res.status(200).json({ message: "Precio actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar el precio" });
  }
}
