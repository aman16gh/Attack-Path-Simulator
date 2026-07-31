# frontend/Dockerfile
# Stage 1: Build the React app
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# Nginx runs on port 80 by default
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
