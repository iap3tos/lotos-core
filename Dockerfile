# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

# Create a folder for persistent data mounting
RUN mkdir -p /app/data
ENV STATE_PATH="/app/data/state.json"

EXPOSE 3000
CMD ["npm", "run", "start"]
