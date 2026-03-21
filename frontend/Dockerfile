FROM node:20-slim

WORKDIR /app

# Copy dependency files and install
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
