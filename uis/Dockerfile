FROM node:22-alpine

WORKDIR /app

# Copiamos primero los archivos de dependencias para aprovechar la cache de Docker.
#COPY website/package*.json ./website/ profe guia
COPY application/package*.json ./application/
COPY backoffice/package*.json ./backoffice/

# Instalamos las dependencias de cada aplicación por separado.
#RUN npm install --prefix ./website profe guia
RUN npm install --prefix ./application
RUN npm install --prefix ./backoffice

# Ahora copiamos el resto del código.
COPY . .

EXPOSE 3000
EXPOSE 3001

CMD ["sh", "/app/start.sh"]
