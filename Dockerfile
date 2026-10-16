FROM nginx:alpine

# Copy production Nginx server configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static frontend assets to Nginx html root
COPY index.html /usr/share/nginx/html/
COPY src /usr/share/nginx/html/src

# Create uploads directory for runtime PMTiles mounts
RUN mkdir -p /usr/share/nginx/html/uploads/pmtiles

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:80/ || exit 1
