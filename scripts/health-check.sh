#!/bin/bash

# Health check script for Absen.Digital
# Usage: ./health-check.sh <environment>

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 <staging|production>"
    exit 1
fi

if [ "$ENVIRONMENT" = "staging" ]; then
    BASE_URL="https://staging.absen.digital"
else
    BASE_URL="https://absen.digital"
fi

echo "======================================"
echo "Health Check: $ENVIRONMENT"
echo "======================================"

# Check 1: Health endpoint
echo -n "→ Health endpoint... "
if curl -f -s -o /dev/null -w "%{http_code}" $BASE_URL/health | grep -q "200"; then
    echo "✓ OK"
else
    echo "✗ FAILED"
    FAILED=1
fi

# Check 2: Homepage loads
echo -n "→ Homepage... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL)
if [ "$STATUS" = "200" ]; then
    echo "✓ OK (HTTP $STATUS)"
else
    echo "✗ FAILED (HTTP $STATUS)"
    FAILED=1
fi

# Check 3: PHP-FPM status
echo -n "→ PHP-FPM... "
if systemctl is-active --quiet php8.3-fpm; then
    echo "✓ Running"
else
    echo "✗ Not running"
    FAILED=1
fi

# Check 4: Queue worker
echo -n "→ Queue worker... "
if [ "$ENVIRONMENT" = "staging" ]; then
    WORKER_STATUS=$(sudo supervisorctl status staging-worker:* | grep RUNNING | wc -l)
else
    WORKER_STATUS=$(sudo supervisorctl status production-worker:* | grep RUNNING | wc -l)
fi

if [ "$WORKER_STATUS" -gt 0 ]; then
    echo "✓ Running ($WORKER_STATUS workers)"
else
    echo "✗ Not running"
    FAILED=1
fi

# Check 5: Disk space
echo -n "→ Disk space... "
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo "✓ OK (${DISK_USAGE}% used)"
else
    echo "⚠ WARNING (${DISK_USAGE}% used)"
fi

# Check 6: MySQL connection
echo -n "→ MySQL connection... "
if [ "$ENVIRONMENT" = "staging" ]; then
    DEPLOY_PATH="/var/www/staging"
else
    DEPLOY_PATH="/var/www/production"
fi

cd $DEPLOY_PATH/current
if php artisan tinker --execute="DB::connection()->getPdo();" 2>&1 | grep -q "PDO"; then
    echo "✓ Connected"
else
    echo "✗ Connection failed"
    FAILED=1
fi

echo "======================================"
if [ -z "$FAILED" ]; then
    echo "✓ All checks passed"
    exit 0
else
    echo "✗ Some checks failed"
    exit 1
fi
