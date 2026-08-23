#!/bin/bash
set -e

# Quick rollback script for Absen.Digital
# Usage: ./rollback.sh <environment> [release_timestamp]
# Example: ./rollback.sh staging
#          ./rollback.sh production 20260823_120000

ENVIRONMENT=$1
TARGET_RELEASE=$2

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 <staging|production> [release_timestamp]"
    exit 1
fi

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "Environment must be 'staging' or 'production'"
    exit 1
fi

if [ "$ENVIRONMENT" = "staging" ]; then
    DEPLOY_PATH="/var/www/staging"
else
    DEPLOY_PATH="/var/www/production"
fi

CURRENT_PATH="$DEPLOY_PATH/current"
RELEASES_PATH="$DEPLOY_PATH/releases"

# Get current release
CURRENT_RELEASE=$(basename $(readlink -f $CURRENT_PATH))

echo "======================================"
echo "Rollback for: $ENVIRONMENT"
echo "Current release: $CURRENT_RELEASE"
echo "======================================"

# If no target specified, use previous release
if [ -z "$TARGET_RELEASE" ]; then
    cd $RELEASES_PATH
    TARGET_RELEASE=$(ls -t | grep -v "^$CURRENT_RELEASE$" | head -n 1)
    
    if [ -z "$TARGET_RELEASE" ]; then
        echo "✗ No previous release found!"
        exit 1
    fi
    
    echo "→ Rolling back to previous release: $TARGET_RELEASE"
else
    if [ ! -d "$RELEASES_PATH/$TARGET_RELEASE" ]; then
        echo "✗ Release not found: $TARGET_RELEASE"
        echo "Available releases:"
        ls -t $RELEASES_PATH
        exit 1
    fi
    
    echo "→ Rolling back to: $TARGET_RELEASE"
fi

# Confirm rollback
read -p "Continue with rollback? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rollback cancelled"
    exit 1
fi

# Atomic symlink swap
echo "→ Switching to release: $TARGET_RELEASE"
ln -sfn $RELEASES_PATH/$TARGET_RELEASE ${CURRENT_PATH}_tmp
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
    echo "Check: $HEALTH_URL"
fi

echo "======================================"
echo "✓ Rollback complete!"
echo "From: $CURRENT_RELEASE"
echo "To:   $TARGET_RELEASE"
echo "======================================"
echo ""
echo "⚠ NOTE: Database migrations are NOT rolled back automatically."
echo "If the previous release had migrations, you may need to rollback manually:"
echo "  cd $CURRENT_PATH"
echo "  php artisan migrate:rollback"
