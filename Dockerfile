FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Environment variables
ENV NODE_ENV=production

# Run
CMD ["node", "index.js"]

# Or run in watch mode
# CMD ["node", "index.js", "--watch"]
