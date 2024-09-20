import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

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

app.post("/sangria-fiesta", async (req: Request, res: Response) => {
  const data = req.body;

  // Obtiene el contenido HTML con los datos reemplazados
  const htmlContent = getSangriaFiesta(data);

  // Opciones de configuración para el PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  const pdf = await page.pdf({ format: "A4" });
  await browser.close();

  const buffer = Buffer.from(pdf);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=invitation.pdf");
  res.send(buffer);
  // const options: pdf.CreateOptions = { format: "A4" };

  // // Genera el PDF a partir del HTML
  // pdf.create(htmlContent, options).toBuffer((err, buffer) => {
  //   if (err) {
  //     console.error(err);
  //     return res.status(500).send(err);
  //   }

  //   // Establece las cabeceras para la descarga del PDF
  //   res.setHeader("Content-Type", "application/pdf");
  //   res.setHeader("Content-Disposition", "attachment; filename=invitation.pdf");

  //   // Envía el PDF generado
  //   res.send(buffer);
  // });
});

// Inicia el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log(`zorra`);
});
