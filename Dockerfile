# Stage 1: Build the frontend
FROM node:20-alpine AS build
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm install --include=optional
COPY . .
RUN npm run build

# Stage 2: Install production dependencies (including native modules)
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --include=optional

# Stage 3: Final runtime image
FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
RUN apk add --no-cache libc6-compat

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
# Copy source files for tsx
COPY . .
# Copy built assets
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["npm", "start"]
