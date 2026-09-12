# Etapa 1: Compilación (Builder)
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install
COPY . .
RUN pnpm run build

# Etapa 2: Servidor (Nginx)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Nota: Verifica si tu carpeta de salida es 'browser' o solo 'pedidos360-frontend' dentro de dist/
COPY --from=builder /app/dist/pedidos360-frontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]