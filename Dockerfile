# Stage 1: Build the frontend
FROM node:20-alpine AS build
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Final runtime image
FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
<<<<<<< HEAD
ENV PORT=8080
RUN apk add --no-cache libc6-compat

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
# Copy built backend
COPY --from=build /app/server.js ./server.js
# Copy built frontend assets
COPY --from=build /app/dist ./dist
# Copy public folder if it exists (for static assets not handled by vite)
COPY --from=build /app/public ./public

=======
RUN apk add --no-cache libc6-compat python3 make g++
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/package.json ./package.json
>>>>>>> 70015ee (fix: updated build and server)
EXPOSE 8080
CMD ["npx", "tsx", "server.ts"]
