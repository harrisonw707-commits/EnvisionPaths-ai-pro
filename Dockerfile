# Runtime image — production deps and pre-built artifacts from Cloud Build workspace
FROM node:20-slim
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Install only production dependencies (recompiles native addons like better-sqlite3 for this image)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy pre-built frontend assets and server bundle from Cloud Build workspace
COPY dist/ ./dist/
COPY server.js ./server.js

EXPOSE 8080
CMD ["node", "server.js"]
