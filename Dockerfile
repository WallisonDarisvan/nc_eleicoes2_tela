# ==============================================================
# Estágio 1: Build da aplicação (Node.js 20 Alpine)
# ==============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Otimização de memória para build estável em VPS/Easypanel
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Instalação de dependências com cache otimizado
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Cópia do código-fonte e build de produção (Vite + TS)
COPY . .
RUN npm run build

# ==============================================================
# Estágio 2: Nginx Alpine de Alta Performance para Produção
# ==============================================================
FROM nginx:alpine

# Remove configuração padrão do Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copia configuração otimizada com suporte a SPA, Gzip e Proxy da CDN do TSE
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos compilados do estágio de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Porta padrão exposta para o Easypanel
EXPOSE 80

# Healthcheck nativo do Docker para monitoramento contínuo no painel do Easypanel
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
