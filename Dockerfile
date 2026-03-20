# Stage 1: Build the frontend
FROM node:18-alpine AS build
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Install production dependencies (including native modules)
FROM node:18-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 3: Final runtime image
FROM node:18-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
RUN apk add --no-cache libc6-compat

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
# Copy built assets
COPY --from=build /app/dist ./dist
# Copy compiled server
COPY --from=build /app/server.js ./server.js
# Copy package.json for npm start
COPY package.json ./

EXPOSE 8080
CMD ["npm", "start"]
