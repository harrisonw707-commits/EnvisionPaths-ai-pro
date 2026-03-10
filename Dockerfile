FROM node:18-alpine AS build
# Install build tools for native modules (better-sqlite3, bcrypt, etc.)
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.ts ./server.ts
COPY --from=build /app/dist ./dist
EXPOSE 8080
CMD ["node", "--import", "tsx", "server.ts"]
