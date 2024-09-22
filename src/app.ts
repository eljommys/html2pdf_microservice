import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { Client } from "minio";
import crypto from "crypto";
import dotenv from "dotenv";

// Carga las variables de entorno desde el archivo .env
dotenv.config();

// Inicializa la aplicación Express
const app = express();
app.use(bodyParser.json());

// Configuración de MinIO
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "host.docker.internal",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ROOT_USER || "minioadmin",
  secretKey: process.env.MINIO_ROOT_PASSWORD || "minioadmin",
});

// Bucket de destino en MinIO
const bucketName = process.env.MINIO_BUCKET || "pdfs";

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

// Función para subir el PDF a MinIO
const uploadToMinio = async (pdfBuffer: Buffer): Promise<string> => {
  const pdfName = `sangria-fiesta-${crypto.randomUUID()}.pdf`;
  const metaData = {
    "Content-Type": "application/pdf",
  };

  // Asegura que el bucket existe
  const bucketExists = await minioClient.bucketExists(bucketName);
  if (!bucketExists) {
    await minioClient.makeBucket(bucketName, "");
  }

  // Sube el archivo PDF a MinIO
  await minioClient.putObject(
    bucketName,
    pdfName,
    pdfBuffer,
    undefined,
    metaData
  );

  // Genera un enlace público al PDF
  const expiry = 24 * 60 * 60; // Enlace válido por 24 horas
  const publicUrl = await minioClient.presignedGetObject(
    bucketName,
    pdfName,
    expiry
  );

  return publicUrl;
};

// Endpoint POST que recibe datos JSON y los convierte en PDF y guarda en MinIO
app.post("/sangria-fiesta", async (req: Request, res: Response) => {
  try {
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
    const pdfBuffer = Buffer.from(pdf);
    await browser.close();

    // Sube el PDF a MinIO y obtiene el enlace público
    const publicUrl = await uploadToMinio(pdfBuffer);

    // Devuelve el enlace público al cliente
    res.json({ url: publicUrl });
  } catch (error) {
    console.error("Error generando PDF o subiendo a MinIO:", error);
    res.status(500).json({ message: "Error generando PDF o subiendo a MinIO" });
  }
});

// Inicia el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
