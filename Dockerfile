# Usa una imagen base oficial de Node.js
FROM node:18-slim

RUN apt-get update && apt-get install -y chromium

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia el archivo package.json y package-lock.json al directorio de trabajo
COPY package*.json ./

# Instala wkhtmltopdf
  # RUN apt-get update && apt-get install -y wkhtmltopdf

# Instala typescript globalmente si no está en tu package.json
RUN npm install -g typescript
# RUN npm install -g phantomjs-prebuilt


# Instala las dependencias
RUN npm install

# Copia el resto de los archivos del proyecto
COPY . .

# Compila la aplicación TypeScript
RUN npm run build

ARG PORT
ENV PORT $PORT
EXPOSE $PORT

# Comando para iniciar la aplicación
CMD ["npm", "start"]
