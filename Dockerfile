FROM node:14-alpine

#Argumentos DockerFile

#Variables de entorno
ENV HTTP_PORT=8080

#Instalación paquetes
RUN apk update &&\
    apk add --no-cache \
    supervisor \
    nginx \
    redis \
    ffmpeg

# Compilar aplicación
WORKDIR /app
COPY . .
RUN npm install --force
RUN npm run build

#Configuración nginx
COPY ./docker/nginx/nginx.conf /etc/nginx/nginx.conf

#Configuración supervisord
COPY ./docker/supervisord/supervisord.conf /etc/supervisord.conf

#Iniciar supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
