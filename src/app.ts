import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import pdf from "html-pdf";
import fs from "fs";
import path from "path";

// Inicializa la aplicación Express
const app = express();

// Middleware para procesar el cuerpo de las solicitudes en formato JSON
app.use(bodyParser.json());

// Lee el archivo HTML de la plantilla
const getSangriaFiesta = (data: any): string => {
  const filePath = path.join(__dirname, "../templates/sangria-fiesta.html");
  let html = fs.readFileSync(filePath, "utf8");

  // Reemplaza los marcadores de posición en la plantilla con los datos del JSON
  html = html.replace("{{restaurant_name}}", data.restaurant_name);
  html = html.replace("{{time}}", data.time);
  html = html.replace("{{date}}", data.date);
  html = html.replace("{{address}}", data.address);
  html = html.replace("{{email}}", data.email);

  return html;
};

// Endpoint POST que recibe datos JSON y los convierte en PDF
app.post("/sangria-fiesta", (req: Request, res: Response) => {
  const data = req.body;

  // Obtiene el contenido HTML con los datos reemplazados
  const htmlContent = getSangriaFiesta(data);

  // Opciones de configuración para el PDF
  const options: pdf.CreateOptions = { format: "A4" };

  // Genera el PDF a partir del HTML
  pdf.create(htmlContent, options).toBuffer((err, buffer) => {
    if (err) {
      return res.status(500).send("Error al generar el PDF");
    }

    // Establece las cabeceras para la descarga del PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=document.pdf");

    // Envía el PDF generado
    res.send(buffer);
  });
});

// Inicia el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
