FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source files
COPY . .

# Build the TypeScript code
RUN npm run build

# Remove dev dependencies and source files
RUN npm prune --production && \
    rm -rf src/ tsconfig.json

# Run as non-root user
USER node

# Start the MCP server
CMD ["node", "dist/index.js"] 