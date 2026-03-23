FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages ./packages

RUN npm install

COPY apps/api ./apps/api

WORKDIR /app/apps/api

RUN node ../../node_modules/typescript/bin/tsc -p tsconfig.json

EXPOSE 5000

CMD ["node", "dist/index.js"]
