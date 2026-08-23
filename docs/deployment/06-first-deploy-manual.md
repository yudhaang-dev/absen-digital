# First Manual Deploy

First deployment manual untuk verify setup sebelum enable automation.

---

## Prerequisites Checklist

Pastikan semua sudah ✓:

- [ ] VPS stack installed (Nginx, PHP, MySQL, Node, Supervisor)
- [ ] Deploy user created + SSH key works
- [ ] Databases created + users configured
- [ ] `.env` files created di `/var/www/{env}/shared/.env`
- [ ] Nginx virtual hosts configured
- [ ] DNS pointed ke VPS
- [ ] SSL certificate configured
- [ ] Supervisor workers configured

---

## 1. SSH ke VPS sebagai Deployer

```bash
# Dari local Windows
ssh deployer@<VPS_IP>

# Atau dengan SSH key
ssh -i ~/.ssh/absen_deploy deployer@<VPS_IP>
```

---

## 2. First Deploy ke Staging (Manual)

### Clone Repository

```bash
cd /var/www/staging/releases

# Clone dari GitHub (private repo - perlu token atau deploy key)
# Jika pakai token:
git clone https://<TOKEN>@github.com/yudhaang-dev/absen-digital.git 20260823_080000

# Jika pakai deploy key (recommended):
git clone git@github.com:yudhaang-dev/absen-digital.git 20260823_080000

cd 20260823_080000
```

**Atau pakai branch staging:**

```bash
git clone --branch staging --depth 1 git@github.com:yudhaang-dev/absen-digital.git 20260823_080000
```

### Symlink Shared Resources

```bash
cd /var/www/staging/releases/20260823_080000

# Symlink .env
ln -sfn ../../shared/.env .env

# Symlink storage
ln -sfn ../../shared/storage storage
```

### Install Dependencies

```bash
# Composer
composer install --no-dev --optimize-autoloader --no-interaction

# pnpm (untuk build assets)
pnpm install --frozen-lockfile

# Build frontend
pnpm build

# Cleanup node_modules (tidak perlu di runtime)
rm -rf node_modules
```

**Estimasi waktu: 3-5 menit**

### Generate APP_KEY (jika belum)

```bash
# Check .env
cat .env | grep APP_KEY

# Jika kosong, generate
php artisan key:generate
```

### Run Migrations

```bash
# Run central migrations
php artisan migrate --force

# Check tables
php artisan tinker
>>> Schema::hasTable('users');
>>> exit;
```

### Run Optimizations

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

### Symlink ke Current

```bash
# Atomic symlink swap
cd /var/www/staging
ln -sfn releases/20260823_080000 current

# Verify
ls -la current
# Harus point ke releases/20260823_080000
```

### Reload Services

```bash
# Reload PHP-FPM
sudo systemctl reload php8.3-fpm

# Start queue workers (pertama kali)
sudo supervisorctl start staging-worker:*

# Check status
sudo supervisorctl status staging-worker:*
# Harus: RUNNING
```

---

## 3. Test Staging

```bash
# Health check
curl https://staging.absen.digital/health
# Expected: OK atau Laravel page

# Test homepage
curl -I https://staging.absen.digital
# Expected: HTTP/2 200
```

**Dari browser:**
- Buka: `https://staging.absen.digital`
- Harus muncul Laravel homepage atau login page (tergantung routes)

---

## 4. Check Logs (jika error)

```bash
# Laravel logs
tail -f /var/www/staging/shared/storage/logs/laravel.log

# Nginx error logs
sudo tail -f /var/log/nginx/staging.absen.digital.error.log

# PHP-FPM logs
sudo tail -f /var/log/php8.3-fpm.log

# Queue worker logs
sudo supervisorctl tail -f staging-worker:staging-worker_00
```

---

## 5. First Deploy ke Production (Manual)

**⚠️ HANYA setelah staging verified ✓**

Sama seperti staging, ganti path:

```bash
cd /var/www/production/releases
git clone --branch main --depth 1 git@github.com:yudhaang-dev/absen-digital.git 20260823_081500

cd 20260823_081500

# Symlinks
ln -sfn ../../shared/.env .env
ln -sfn ../../shared/storage storage

# Install
composer install --no-dev --optimize-autoloader --no-interaction
pnpm install --frozen-lockfile
pnpm build
rm -rf node_modules

# Generate key (jika belum)
php artisan key:generate

# ⚠️ REVIEW MIGRATIONS sebelum run di production
php artisan migrate:status

# Run migrations (manual approval)
php artisan migrate --force

# Optimizations
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Symlink
cd /var/www/production
ln -sfn releases/20260823_081500 current

# Reload services
sudo systemctl reload php8.3-fpm
sudo supervisorctl start production-worker:*
```

---

## 6. Test Production

```bash
# Health check
curl https://absen.digital/health

# Homepage
curl -I https://absen.digital

# From browser
# https://absen.digital
```

---

## 7. Seed Initial Data (Optional)

Jika perlu data demo/admin:

```bash
# Staging
cd /var/www/staging/current
php artisan db:seed

# Production (hati-hati!)
cd /var/www/production/current
php artisan db:seed --class=ProductionSeeder
```

---

## 8. Create Admin User (jika perlu)

```bash
cd /var/www/production/current

php artisan tinker
```

```php
// Di Tinker
$user = App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@absen.digital',
    'password' => bcrypt('password_kuat_ganti_ini'),
]);

// Assign role (jika pakai spatie/permission)
$user->assignRole('super-admin');

exit;
```

---

## 9. Test Full Flow

### Test User Registration (jika ada)

```bash
curl -X POST https://staging.absen.digital/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password"}'
```

### Test Login

```bash
curl -X POST https://staging.absen.digital/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Test Queue (dispatch test job)

```bash
cd /var/www/staging/current

php artisan tinker
```

```php
// Dispatch test job
dispatch(function () {
    logger('Test job executed!');
});

exit;
```

Check logs:

```bash
tail /var/www/staging/shared/storage/logs/laravel.log
# Harus muncul: Test job executed!
```

---

## 10. Performance Baseline

```bash
# Install Apache Bench (untuk load test)
sudo apt install -y apache2-utils

# Simple load test (staging)
ab -n 100 -c 10 https://staging.absen.digital/

# Check results:
# - Requests per second
# - Time per request
# - Failed requests (should be 0)
```

Save baseline untuk comparison nanti.

---

## 11. Setup Logrotate (Prevent Log Bloat)

```bash
sudo nano /etc/logrotate.d/laravel
```

Isi:

```
/var/www/staging/shared/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0664 deployer www-data
    sharedscripts
}

/var/www/production/shared/storage/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0664 deployer www-data
    sharedscripts
}
```

Test logrotate:

```bash
sudo logrotate -f /etc/logrotate.d/laravel
```

---

## 12. Document Current State

```bash
# Record deployed versions
cd /var/www/staging/current
git log -1 --oneline > /tmp/staging-version.txt

cd /var/www/production/current
git log -1 --oneline > /tmp/production-version.txt

cat /tmp/staging-version.txt
cat /tmp/production-version.txt
```

---

## 13. Verify Everything

Run health check script:

```bash
cd /var/www/absen.digital/scripts
chmod +x health-check.sh

./health-check.sh staging
./health-check.sh production
```

All checks should pass ✓.

---

## ✅ First Deploy Checklist

### Staging
- [ ] Repository cloned to releases directory
- [ ] Shared resources symlinked (.env, storage)
- [ ] Composer dependencies installed
- [ ] Frontend assets built
- [ ] APP_KEY generated
- [ ] Migrations run successfully
- [ ] Laravel caches generated (config, route, view, event)
- [ ] Symlink `current` points to release
- [ ] PHP-FPM reloaded
- [ ] Queue workers started & running
- [ ] Health check passes
- [ ] Homepage accessible via browser
- [ ] Test user/login works
- [ ] Test queue job executed
- [ ] Logs accessible & clean

### Production
- [ ] All staging steps repeated for production
- [ ] Migrations reviewed before execution
- [ ] Admin user created
- [ ] Production data seeded (if needed)
- [ ] Load test baseline recorded
- [ ] Logrotate configured

### Monitoring
- [ ] Nginx logs accessible
- [ ] Laravel logs accessible
- [ ] Queue worker logs accessible
- [ ] PHP-FPM status monitored
- [ ] Supervisor status monitored
- [ ] Disk space checked

---

## Common Issues & Fixes

### Issue: "Permission denied" saat deploy

```bash
# Fix ownership
sudo chown -R deployer:www-data /var/www/staging
sudo chown -R deployer:www-data /var/www/production

# Fix permissions
sudo chmod -R 775 /var/www/staging
sudo chmod -R 775 /var/www/production
```

### Issue: "Class not found" errors

```bash
# Clear & regenerate autoload
composer dump-autoload
php artisan clear-compiled
php artisan config:clear
php artisan cache:clear
```

### Issue: 500 Internal Server Error

```bash
# Check Laravel logs
tail -50 /var/www/staging/shared/storage/logs/laravel.log

# Check Nginx logs
sudo tail -50 /var/log/nginx/staging.absen.digital.error.log

# Check PHP-FPM logs
sudo tail -50 /var/log/php8.3-fpm.log
```

### Issue: Assets tidak load (404)

```bash
# Verify Vite build
ls -la /var/www/staging/current/public/build/

# Regenerate manifest
cd /var/www/staging/current
pnpm build

# Clear browser cache
```

### Issue: Queue workers tidak jalan

```bash
# Check supervisor status
sudo supervisorctl status staging-worker:*

# Restart workers
sudo supervisorctl restart staging-worker:*

# Check logs
sudo supervisorctl tail staging-worker:staging-worker_00
```

---

**Next:** [07-github-secrets-setup.md](07-github-secrets-setup.md)
