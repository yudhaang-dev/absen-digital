#!/bin/bash
set -e

# Zero-downtime deployment script for Absen.Digital
# Usage: ./deploy.sh <environment> <branch>
# Example: ./deploy.sh staging staging
#          ./deploy.sh production main

ENVIRONMENT=$1
BRANCH=${2:-main}

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 <staging|production> [branch]"
    exit 1
fi

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "Environment must be 'staging' or 'production'"
    exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPO_URL="https://github.com/yudhaang-dev/absen-digital.git"

if [ "$ENVIRONMENT" = "staging" ]; then
    DEPLOY_PATH="/var/www/staging"
else
    DEPLOY_PATH="/var/www/production"
fi

RELEASE_PATH="$DEPLOY_PATH/releases/$TIMESTAMP"
SHARED_PATH="$DEPLOY_PATH/shared"
CURRENT_PATH="$DEPLOY_PATH/current"

echo "======================================"
echo "Deploying to: $ENVIRONMENT"
echo "Branch: $BRANCH"
echo "Release: $TIMESTAMP"
echo "======================================"

# Clone repository
echo "→ Cloning repository..."
git clone --branch $BRANCH --depth 1 $REPO_URL $RELEASE_PATH

cd $RELEASE_PATH

# Symlink shared resources
echo "→ Linking shared resources..."
ln -sfn $SHARED_PATH/.env .env
ln -sfn $SHARED_PATH/storage storage

# Install Composer dependencies
echo "→ Installing Composer dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Install Node dependencies and build assets
echo "→ Installing Node dependencies..."
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"
pnpm install --frozen-lockfile

echo "→ Building frontend assets..."
pnpm build

# Clean up node_modules (not needed in runtime)
rm -rf node_modules

# Run Laravel optimizations
echo "→ Running Laravel optimizations..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Run migrations (staging only by default)
if [ "$ENVIRONMENT" = "staging" ]; then
    echo "→ Running database migrations..."
    php artisan migrate --force
else
    echo "⚠ Skipping migrations for production (run manually)"
    echo "  Command: php artisan migrate --force"
fi

# Atomic symlink swap (zero-downtime)
echo "→ Switching to new release..."
ln -sfn $RELEASE_PATH ${CURRENT_PATH}_tmp
mv -Tf ${CURRENT_PATH}_tmp $CURRENT_PATH

# Reload PHP-FPM
echo "→ Reloading PHP-FPM..."
sudo systemctl reload php8.3-fpm

# Restart queue workers
echo "→ Restarting queue workers..."
if [ "$ENVIRONMENT" = "staging" ]; then
    sudo supervisorctl restart staging-worker:*
else
    sudo supervisorctl restart production-worker:*
fi

# Clean up old releases (keep last 5)
echo "→ Cleaning up old releases..."
cd $DEPLOY_PATH/releases
ls -t | tail -n +6 | xargs -r rm -rf

# Health check
echo "→ Running health check..."
sleep 3
if [ "$ENVIRONMENT" = "staging" ]; then
    HEALTH_URL="https://staging.absen.digital/health"
else
    HEALTH_URL="https://absen.digital/health"
fi

if curl -f -s $HEALTH_URL > /dev/null; then
    echo "✓ Health check passed"
else
    echo "✗ Health check failed!"
    echo "Deployment completed but health check did not pass."
    echo "Check: $HEALTH_URL"
fi

echo "======================================"
echo "✓ Deployment complete!"
echo "Release: $TIMESTAMP"
echo "Path: $CURRENT_PATH"
echo "======================================"
