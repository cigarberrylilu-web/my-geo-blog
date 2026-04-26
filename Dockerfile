FROM node:20-alpine AS builder
ARG VITE_MAPBOX_ACCESS_TOKEN
ENV VITE_MAPBOX_ACCESS_TOKEN=$VITE_MAPBOX_ACCESS_TOKEN
WORKDIR /app
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

WORKDIR /api-build
COPY api/package.json ./
RUN npm install
COPY api/ ./
RUN npx tsc --outDir dist

FROM node:20-alpine
RUN apk add --no-cache nginx
COPY --from=builder /app/dist /usr/share/nginx/html
WORKDIR /api
COPY --from=builder /api-build/dist ./dist
COPY --from=builder /api-build/node_modules ./node_modules
COPY api/package.json ./
COPY nginx/nginx.conf /etc/nginx/http.d/default.conf
RUN printf '#!/bin/sh\ncd /api && PORT=3001 node dist/server.js &\nnginx -g "daemon off;"\n' > /start.sh && chmod +x /start.sh
EXPOSE 8080 3001
CMD ["/start.sh"]
