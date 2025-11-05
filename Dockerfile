# =============================================================
#  Dockerfile - Projeto Backend Node.js + Prisma + MySQL
#  Baseado em Oracle Linux 10 Slim (recomendado pelo Docker Scout)
# =============================================================

# 1️⃣ — Escolher imagem base recomendada (segura e leve)
FROM oraclelinux:10-slim

# 2️⃣ — Instalar Node.js (versão estável LTS) + dependências necessárias ao Prisma
RUN microdnf install -y oracle-nodejs-release-el10 && \
    microdnf install -y nodejs npm git openssl-devel libssl3 && \
    microdnf clean all

# 3️⃣ — Definir diretório de trabalho dentro do container
WORKDIR /app

# 4️⃣ — Copiar ficheiros de configuração primeiro (para cache eficiente)
COPY package*.json ./

# 5️⃣ — Instalar dependências (sem devDependencies)
RUN npm install --omit=dev

# 6️⃣ — Copiar o resto do código da aplicação
COPY . .

# 7️⃣ — Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=5050

# 8️⃣ — Expor porta do servidor Express
EXPOSE 5050

# 9️⃣ — Comando padrão
CMD ["npm", "start"]

# =============================================================
#  Notas:
#  - Oracle Linux 10 Slim = imagem mais leve e segura
#  - microdnf clean all = remove cache (imagem menor)
#  - npm --omit=dev = evita pacotes desnecessários em produção
# =============================================================
