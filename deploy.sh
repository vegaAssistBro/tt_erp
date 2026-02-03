#!/bin/bash
# Deploy webhook script - TT ERP

# Simple security check
if [ "$1" != "deploy_secret_key_12345" ]; then
    echo "Unauthorized"
    exit 1
fi

echo "Starting deployment at $(date)"

# Pull latest image
docker pull ghcr.io/vegaassistbro/tt_erp:latest

# Stop and remove existing containers
docker stop tt_erp_prod || true
docker rm tt_erp_prod || true
docker stop tt_erp_mysql || true
docker rm tt_erp_mysql || true

# Run MySQL
docker run -d \
    --name tt_erp_mysql \
    -p 3306:3306 \
    -e MYSQL_ROOT_PASSWORD=password \
    -e MYSQL_DATABASE=tt_erp \
    -v mysql_data:/var/lib/mysql \
    mysql:8 \
    --character-set-server=utf8mb4 \
    --collation-server=utf8mb4_unicode_ci

echo "MySQL started, waiting 30 seconds..."
sleep 30

# Run application
docker run -d \
    --name tt_erp_prod \
    -p 5000:3000 \
    --link tt_erp_mysql:mysql \
    -e NODE_ENV=production \
    -e DATABASE_URL=mysql://root:password@tt_erp_mysql:3306/tt_erp \
    -e NEXTAUTH_URL=http://localhost:5000 \
    -e NEXTAUTH_SECRET=HVIRRhQ+TWeP9KWigUxh8i4wWrHJR/ERFdMrQWhcDU8= \
    ghcr.io/vegaassistbro/tt_erp:latest

echo "Deployment completed at $(date)"
