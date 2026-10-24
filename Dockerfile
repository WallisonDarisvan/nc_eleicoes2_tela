# ==========================================
# Estágio 1: Build da aplicação (Node 20)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalação de dependências
COPY package*.json ./
RUN npm ci || npm install

# Cópia do código-fonte e build de produção
COPY . .
RUN npm run build

# ==========================================
# Estágio 2: Nginx Alpine de Alta Performance
# ==========================================
FROM nginx:alpine

# Remove configuração default
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copia configuração otimizada com suporte a SPA e Proxy da API do TSE
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o bundle estático gerado
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
