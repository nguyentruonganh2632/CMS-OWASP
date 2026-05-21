# ---- Stage 1: Build React App ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files trước để tận dụng cache
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code và build
COPY . .
RUN npm run build

# ---- Stage 2: Serve với Nginx ----
FROM nginx:alpine

# Copy file build từ stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config tùy chỉnh
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
