# Imagem base
FROM node:20

# Diretório de trabalho
WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm install

# Instalar nodemon globalmente (para hot reload)
RUN npm install -g nodemon

# Copiar código
COPY . .

# Expor a porta do backend
EXPOSE 5050

# Comando padrão
CMD ["npm", "run", "dev"]
