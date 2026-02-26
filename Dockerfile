# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the React app
RUN npm run build

# Set environment variable for production
ENV NODE_ENV=production

# Expose port 3000 for the app
EXPOSE 3000

# Start the React app
CMD [ "npm", "start" ]