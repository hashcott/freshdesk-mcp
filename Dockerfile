FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* tsconfig.json ./
RUN npm install --include=dev
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

# Default to stdio. Override with -e MCP_TRANSPORT=http -p 3000:3000
ENV MCP_TRANSPORT=stdio
ENV PORT=3000

ENTRYPOINT ["node", "dist/index.js"]
