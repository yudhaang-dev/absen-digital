# Troubleshooting CI/CD

Common issues & solutions untuk deployment Absen.Digital.

---

## GitHub Actions Issues

### 1. Workflow Not Triggering

**Symptoms:**
- Push ke staging/main tapi tidak ada workflow run

**Diagnosis:**
```bash
# Check workflow files exist
ls -la .github/workflows/

# Check branch trigger
cat .github/workflows/staging.yml | grep -A 5 "on:"
```

**Fixes:**
1. Verify workflow YAML syntax:
   - GitHub → Actions → Klik workflow → Check for syntax errors
2. Check branch name match trigger:
   - Workflow: `branches: [staging]`
   - Your branch: `git branch --show-current`
3. Workflow file must be in branch yang di-push:
   ```bash
   git checkout staging
   ls .github/workflows/staging.yml  # Harus exist
   ```

---

### 2. Tests Failing in CI

**Symptoms:**
```
Error: Tests Failed
PHPUnit\Framework\ExpectationFailedException
```

**Diagnosis:**
```bash
# Run tests locally
composer test

# Check DB connection in CI
# GitHub Actions log → Search for "DB_CONNECTION"
```

**Fixes:**
1. **MySQL Service Not Ready:**
   ```yaml
   # Tambahkan health check wait di workflow
   - name: Wait for MySQL
     run: |
       until mysqladmin ping -h127.0.0.1 --silent; do
         echo 'waiting for mysql...'
         sleep 1
       done
   ```

2. **Missing .env in CI:**
   ```yaml
   # Pastikan step ini ada
   - name: Prepare environment
     run: |
       cp .env.example .env
       php artisan key:generate
   ```

3. **Test-specific Config:**
   ```bash
   # Create .env.ci untuk override
   nano .env.ci
   ```
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_DATABASE=testing
   ```

---

### 3. Build Assets Failed

**Symptoms:**
```
Error: ENOENT: no such file or directory, open 'resources/react/...'
```

**Diagnosis:**
```bash
# Check pnpm version
pnpm -v

# Check lock file
ls -la pnpm-lock.yaml
```

**Fixes:**
1. **pnpm Version Mismatch:**
   ```yaml
   # Update workflow
   - name: Setup pnpm
     uses: pnpm/action-setup@v4
     with:
       version: 9  # Match version di package.json
   ```

2. **Missing Files:**
   ```bash
   # Check .gitignore tidak exclude files penting
   cat .gitignore | grep resources
   ```

3. **Node Modules Cache Corrupt:**
   ```yaml
   # Clear cache di workflow (temporary)
   - name: Clear pnpm cache
     run: pnpm store prune
   ```

---

### 4. SSH Connection Failed

**Symptoms:**
```
Error: ssh: connect to host X.X.X.X port 22: Connection refused
```

**Diagnosis:**
```bash
# Test SSH manual dari local
ssh -i ~/.ssh/absen_deploy deployer@<VPS_IP>

# Check VPS SSH service
ssh root@<VPS_IP>
sudo systemctl status sshd
```

**Fixes:**
1. **Wrong IP/Port:**
   - Verify secret: GitHub → Settings → Secrets → VPS_HOST
   - Check VPS IP: `curl ifconfig.me`

2. **Firewall Blocking:**
   ```bash
   # Di VPS
   sudo ufw status
   sudo ufw allow 22/tcp
   ```

3. **SSH Key Format Issue:**
   ```powershell
   # Re-copy private key (dari Windows)
   cat ~/.ssh/absen_deploy | clip
   # Paste ulang ke GitHub secret
   # PENTING: Include -----BEGIN dan -----END lines
   ```

4. **SSH Service Down:**
   ```bash
   sudo systemctl restart sshd
   sudo systemctl enable sshd
   ```

---

### 5. Permission Denied During Deploy

**Symptoms:**
```
Error: Permission denied: /var/www/staging/releases
```

**Diagnosis:**
```bash
# SSH ke VPS
ssh deployer@<VPS_IP>

# Check ownership
ls -la /var/www/

# Check groups
groups deployer
```

**Fixes:**
```bash
# Fix ownership
sudo chown -R deployer:www-data /var/www/staging
sudo chown -R deployer:www-data /var/www/production

# Fix permissions
sudo chmod -R 775 /var/www/staging
sudo chmod -R 775 /var/www/production

# Add deployer to www-data (jika belum)
sudo usermod -aG www-data deployer

# Re-login untuk apply group changes
exit
ssh deployer@<VPS_IP>
```

---

## VPS Deployment Issues

### 6. Composer Install Failed

**Symptoms:**
```
Error: The requested PHP extension ext-soap is missing
```

**Diagnosis:**
```bash
# Check installed extensions
php -m | grep soap
```

**Fixes:**
```bash
# Install missing extension
sudo apt install -y php8.3-soap

# Restart PHP-FPM
sudo systemctl restart php8.3-fpm

# Verify
php -m | grep soap
```

**Common Missing Extensions:**
- `php8.3-soap` (jika pakai SOAP)
- `php8.3-gd` (image manipulation)
- `php8.3-imagick` (advanced images)
- `php8.3-redis` (jika pakai Redis)

---

### 7. pnpm Build Failed di VPS

**Symptoms:**
```
Error: Cannot find module 'vite'
```

**Diagnosis:**
```bash
# Check Node version
node -v  # Harus v22.x

# Check pnpm
pnpm -v  # Harus v9.x

# Check pnpm store
pnpm store path
```

**Fixes:**
1. **Node Version Wrong:**
   ```bash
   # Update Node
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **pnpm Not Installed:**
   ```bash
   npm install -g pnpm
   ```

3. **Corrupted Cache:**
   ```bash
   pnpm store prune
   rm -rf node_modules
   pnpm install --frozen-lockfile
   ```

---

### 8. Migration Failed

**Symptoms:**
```
Error: SQLSTATE[42S01]: Base table or view already exists
```

**Diagnosis:**
```bash
cd /var/www/staging/current

# Check migration status
php artisan migrate:status

# Check database
mysql -u abdigi_staging -p abdigi_staging
SHOW TABLES;
```

**Fixes:**
1. **Migrations Already Ran:**
   ```bash
   # Skip error, database sudah up-to-date
   # Atau reset (HATI-HATI, data hilang):
   php artisan migrate:fresh --force  # STAGING ONLY!
   ```

2. **Migration Conflict:**
   ```bash
   # Rollback last batch
   php artisan migrate:rollback

   # Re-run
   php artisan migrate --force
   ```

3. **Tenancy Migration Issue:**
   ```bash
   # Run central migrations
   php artisan migrate --force

   # Run tenant migrations
   php artisan tenants:migrate --force
   ```

---

### 9. Health Check Failed (502 Bad Gateway)

**Symptoms:**
```
Error: Health check failed: HTTP 502
```

**Diagnosis:**
```bash
# Check PHP-FPM
sudo systemctl status php8.3-fpm

# Check Nginx
sudo systemctl status nginx

# Check error logs
sudo tail -50 /var/log/nginx/staging.absen.digital.error.log
sudo tail -50 /var/log/php8.3-fpm.log
```

**Fixes:**
1. **PHP-FPM Not Running:**
   ```bash
   sudo systemctl start php8.3-fpm
   sudo systemctl enable php8.3-fpm
   ```

2. **Socket Permission Issue:**
   ```bash
   # Check socket
   ls -la /run/php/php8.3-fpm.sock

   # Fix permissions
   sudo chmod 666 /run/php/php8.3-fpm.sock
   sudo systemctl restart php8.3-fpm
   ```

3. **PHP-FPM Pool Config:**
   ```bash
   sudo nano /etc/php/8.3/fpm/pool.d/www.conf
   ```
   Verify:
   ```ini
   listen = /run/php/php8.3-fpm.sock
   listen.owner = www-data
   listen.group = www-data
   listen.mode = 0660
   ```

4. **Nginx Config Wrong:**
   ```bash
   # Test config
   sudo nginx -t

   # Check PHP-FPM path di virtual host
   sudo nano /etc/nginx/sites-available/staging.absen.digital
   ```
   Verify:
   ```nginx
   fastcgi_pass unix:/run/php/php8.3-fpm.sock;
   ```

---

### 10. Queue Workers Not Running

**Symptoms:**
- Jobs stuck in queue
- `supervisorctl status` shows FATAL

**Diagnosis:**
```bash
# Check supervisor
sudo supervisorctl status staging-worker:*

# Check logs
sudo supervisorctl tail staging-worker:staging-worker_00

# Check artisan
cd /var/www/staging/current
php artisan queue:work --once -vvv
```

**Fixes:**
1. **Artisan Not Found:**
   ```bash
   # Verify current symlink
   ls -la /var/www/staging/current

   # Re-create symlink
   cd /var/www/staging
   ln -sfn releases/LATEST_RELEASE current
   ```

2. **Wrong Queue Connection:**
   ```bash
   # Check .env
   grep QUEUE_CONNECTION /var/www/staging/shared/.env

   # Should match supervisor config
   sudo nano /etc/supervisor/conf.d/staging-worker.conf
   # command=... queue:work database (or redis)
   ```

3. **Supervisor Config Error:**
   ```bash
   # Reread config
   sudo supervisorctl reread

   # Update
   sudo supervisorctl update

   # Restart
   sudo supervisorctl restart staging-worker:*
   ```

4. **Database Jobs Table Missing:**
   ```bash
   cd /var/www/staging/current
   php artisan queue:table
   php artisan migrate --force
   ```

---

## Performance Issues

### 11. Slow Page Load

**Diagnosis:**
```bash
# Check Laravel debug bar (staging only)
# Or check logs
cd /var/www/production/current
php artisan route:list --sort=uri

# Check queries
tail -f storage/logs/laravel.log | grep "SELECT"
```

**Fixes:**
1. **Caching Not Applied:**
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   php artisan event:cache
   ```

2. **N+1 Query Problem:**
   ```php
   // Fix di code (example)
   // Bad: User::all()
   // Good: User::with('roles')->get()
   ```

3. **Nginx Caching:**
   ```bash
   sudo nano /etc/nginx/sites-available/production.conf
   ```
   Add:
   ```nginx
   # Static file caching already configured
   # For API responses:
   location /api {
       add_header Cache-Control "public, max-age=300";
   }
   ```

---

### 12. High Memory Usage (PHP-FPM)

**Symptoms:**
```
systemctl status php8.3-fpm
# Memory: 1.2G
```

**Diagnosis:**
```bash
# Check PHP-FPM processes
ps aux | grep php-fpm

# Check pool config
sudo nano /etc/php/8.3/fpm/pool.d/www.conf
```

**Fixes:**
```ini
# Reduce workers
pm = dynamic
pm.max_children = 10       # Dari 20
pm.start_servers = 2       # Dari 4
pm.min_spare_servers = 1
pm.max_spare_servers = 3   # Dari 6
```

Restart:
```bash
sudo systemctl restart php8.3-fpm
```

---

### 13. Disk Full

**Symptoms:**
```
Error: No space left on device
```

**Diagnosis:**
```bash
# Check disk usage
df -h

# Find large directories
du -sh /var/www/*
du -sh /var/log/*
```

**Fixes:**
1. **Old Releases:**
   ```bash
   # Keep only last 3 releases
   cd /var/www/staging/releases
   ls -t | tail -n +4 | xargs rm -rf

   cd /var/www/production/releases
   ls -t | tail -n +4 | xargs rm -rf
   ```

2. **Large Logs:**
   ```bash
   # Truncate logs
   sudo truncate -s 0 /var/log/nginx/*.log
   sudo truncate -s 0 /var/www/*/shared/storage/logs/*.log

   # Ensure logrotate running
   sudo systemctl status logrotate
   ```

3. **Old Backups:**
   ```bash
   # Remove old backups
   find ~/backups -name "*.sql.gz" -mtime +30 -delete
   ```

---

## Rollback Procedures

### 14. Rollback Staging

```bash
ssh deployer@<VPS_IP>
cd /var/www/staging

# List releases
ls -lt releases/

# Rollback to previous
ln -sfn releases/PREVIOUS_RELEASE current

# Restart services
sudo systemctl reload php8.3-fpm
sudo supervisorctl restart staging-worker:*

# Verify
curl https://staging.absen.digital/health
```

---

### 15. Rollback Production (Emergency)

```bash
ssh deployer@<VPS_IP>

# Use rollback script
cd /var/www/absen.digital/scripts
./rollback.sh production

# Or manual:
cd /var/www/production
ls -lt releases/
ln -sfn releases/PREVIOUS_RELEASE current
sudo systemctl reload php8.3-fpm
sudo supervisorctl restart production-worker:*
```

**⚠️ Migration Rollback (Manual):**
```bash
cd /var/www/production/current

# Check migrations
php artisan migrate:status

# Rollback last batch
php artisan migrate:rollback --step=1
```

---

## Monitoring & Prevention

### 16. Setup Basic Monitoring

```bash
# Disk space alert
crontab -e
```
Add:
```bash
# Check disk space daily
0 8 * * * df -h / | awk '$5+0 > 80 {print "Disk usage warning:", $0}' | mail -s "Disk Alert" admin@absen.digital
```

### 17. Health Check Cron

```bash
crontab -e
```
Add:
```bash
# Health check every 5 minutes
*/5 * * * * curl -f https://absen.digital/health || echo "Production down!" | mail -s "ALERT" admin@absen.digital
```

---

## Emergency Contacts & Commands

### Quick Reference

```bash
# Status semua services
sudo systemctl status nginx php8.3-fpm mysql supervisor

# Restart semua (emergency)
sudo systemctl restart nginx php8.3-fpm supervisor

# Check latest errors
sudo tail -100 /var/log/nginx/absen.digital.error.log
sudo tail -100 /var/www/production/shared/storage/logs/laravel.log

# Rollback production
cd /var/www/production
ls -t releases/ | sed -n 2p  # Get previous release
./rollback.sh production

# Clear all caches
cd /var/www/production/current
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

---

## ✅ Prevention Checklist

- [ ] Monitoring cron jobs setup
- [ ] Disk space alerts configured
- [ ] Health check alerts configured
- [ ] Backup cron verified running
- [ ] Logrotate working
- [ ] Old releases auto-cleanup
- [ ] Rollback script tested
- [ ] Emergency procedures documented
- [ ] Team trained on troubleshooting
- [ ] Escalation contacts documented

---

**Complete!** CI/CD setup finished. Return to [ROADMAP](../../product/ROADMAP.md) untuk lanjut development.
