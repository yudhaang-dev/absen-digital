# Supervisor Queue Workers

Setup Supervisor untuk menjalankan Laravel queue workers sebagai background service.

---

## 1. Create Supervisor Config untuk Staging

```bash
# SSH ke VPS
ssh deployer@<VPS_IP>

# Create config
sudo nano /etc/supervisor/conf.d/staging-worker.conf
```

Isi:

```ini
[program:staging-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/staging/current/artisan queue:work database --sleep=3 --tries=3 --max-time=3600 --timeout=60
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=deployer
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/staging/shared/storage/logs/worker.log
stopwaitsecs=3600
```

**Penjelasan:**
- `numprocs=2` = 2 worker processes (cukup untuk staging)
- `--sleep=3` = sleep 3 detik jika queue kosong
- `--tries=3` = retry failed job 3x
- `--max-time=3600` = restart worker setiap 1 jam (prevent memory leak)
- `--timeout=60` = job timeout 60 detik
- `user=deployer` = run sebagai deployer user
- `stdout_logfile` = log ke Laravel storage

---

## 2. Create Supervisor Config untuk Production

```bash
sudo nano /etc/supervisor/conf.d/production-worker.conf
```

Isi:

```ini
[program:production-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/production/current/artisan queue:work database --sleep=3 --tries=3 --max-time=3600 --timeout=60
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=deployer
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/production/shared/storage/logs/worker.log
stopwaitsecs=3600
```

---

## 3. Create Log Files

```bash
# Create log directories
mkdir -p /var/www/staging/shared/storage/logs
mkdir -p /var/www/production/shared/storage/logs

# Create log files
touch /var/www/staging/shared/storage/logs/worker.log
touch /var/www/production/shared/storage/logs/worker.log

# Set permissions
chmod 775 /var/www/staging/shared/storage/logs
chmod 775 /var/www/production/shared/storage/logs
chmod 664 /var/www/staging/shared/storage/logs/worker.log
chmod 664 /var/www/production/shared/storage/logs/worker.log
```

---

## 4. Reload Supervisor

```bash
# Reread config files
sudo supervisorctl reread

# Update supervisor (add new programs)
sudo supervisorctl update

# Check status
sudo supervisorctl status
```

Expected output:

```
production-worker:production-worker_00   FATAL     Exited too quickly
production-worker:production-worker_01   FATAL     Exited too quickly
staging-worker:staging-worker_00         FATAL     Exited too quickly
staging-worker:staging-worker_01         FATAL     Exited too quickly
```

**FATAL adalah normal** karena `/var/www/{env}/current/artisan` belum ada (Laravel app belum deployed).

---

## 5. Verify Supervisor Configs

```bash
# List all supervisor programs
sudo supervisorctl avail

# Should show:
# production-worker         in use    auto      999:999
# staging-worker            in use    auto      999:999
```

---

## 6. Supervisor Commands Reference

```bash
# Start workers
sudo supervisorctl start staging-worker:*
sudo supervisorctl start production-worker:*

# Stop workers
sudo supervisorctl stop staging-worker:*
sudo supervisorctl stop production-worker:*

# Restart workers (digunakan saat deploy)
sudo supervisorctl restart staging-worker:*
sudo supervisorctl restart production-worker:*

# Check status
sudo supervisorctl status staging-worker:*
sudo supervisorctl status production-worker:*

# View logs (real-time)
sudo supervisorctl tail -f staging-worker:staging-worker_00
sudo supervisorctl tail -f production-worker:production-worker_00

# Reload all supervisor configs
sudo supervisorctl reread
sudo supervisorctl update
```

---

## 7. Increase Worker Capacity (jika perlu)

Jika queue mulai backlog, tambahkan worker:

Edit config:

```bash
sudo nano /etc/supervisor/conf.d/production-worker.conf
```

Ubah:

```ini
numprocs=4  # Dari 2 ke 4 workers
```

Reload:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status production-worker:*
```

Sekarang ada 4 workers: `production-worker_00` s/d `production-worker_03`.

---

## 8. Monitor Queue Performance

### Check Queue Size

```bash
# SSH ke VPS
cd /var/www/production/current

# Check jobs in queue
php artisan queue:work database --once --quiet
php artisan tinker
>>> DB::table('jobs')->count();
```

### Check Failed Jobs

```bash
php artisan queue:failed

# Retry failed job
php artisan queue:retry {job_id}

# Retry all failed
php artisan queue:retry all

# Clear failed jobs
php artisan queue:flush
```

---

## 9. Worker Logs Location

```bash
# Laravel worker logs
tail -f /var/www/staging/shared/storage/logs/worker.log
tail -f /var/www/production/shared/storage/logs/worker.log

# Laravel app logs (error dari jobs)
tail -f /var/www/staging/shared/storage/logs/laravel.log
tail -f /var/www/production/shared/storage/logs/laravel.log

# Supervisor logs
tail -f /var/log/supervisor/supervisord.log
```

---

## 10. Optimize Queue (Optional)

### Prioritize Queues

Jika ada multiple queues dengan priority berbeda:

Edit supervisor config:

```ini
command=php /var/www/production/current/artisan queue:work database --queue=high,default,low --sleep=3 --tries=3 --max-time=3600
```

Dispatch job ke specific queue:

```php
// Di Laravel code
SomeJob::dispatch()->onQueue('high');
```

### Use Redis (jika traffic tinggi)

Database queue cukup untuk early stage, tapi kalau job >1000/menit, pindah ke Redis:

```bash
# Install Redis
sudo apt install -y redis-server

# Enable & start
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Test
redis-cli ping
# Response: PONG
```

Update `.env`:

```env
QUEUE_CONNECTION=redis
```

Update supervisor config:

```ini
command=php /var/www/production/current/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
```

---

## 11. Troubleshooting

### Worker FATAL: Exited too quickly

```bash
# Check artisan executable
ls -la /var/www/staging/current/artisan
# Jika tidak ada: Laravel app belum deployed (normal)

# Check permissions
ls -la /var/www/staging/current/
# Harus: deployer:www-data

# Check PHP path
which php
# Harus: /usr/bin/php

# Test artisan manually
cd /var/www/staging/current
php artisan queue:work --once
# Jika error, baca error message
```

### Worker Running tapi Job Tidak Diproses

```bash
# Check queue connection di .env
grep QUEUE_CONNECTION /var/www/production/shared/.env
# Harus match dengan supervisor command (database/redis)

# Check database jobs table exists
cd /var/www/production/current
php artisan tinker
>>> Schema::hasTable('jobs');
# Harus: true

# Manually run queue once untuk debug
php artisan queue:work database --once -vvv
```

### Memory Leak

```bash
# Check worker memory usage
ps aux | grep queue:work

# Jika memory tinggi (>500MB per worker):
# 1. Kurangi --max-time (restart lebih sering)
# 2. Reduce numprocs
# 3. Investigate memory leak di job code
```

---

## 12. Supervisor Auto-restart on Reboot

```bash
# Enable supervisor auto-start
sudo systemctl enable supervisor

# Check status
sudo systemctl status supervisor

# Test reboot
sudo reboot

# Setelah reboot, SSH ulang dan check
sudo supervisorctl status
# Workers harus auto-start
```

---

## 13. Advanced: Horizon (Optional - untuk nanti)

Jika queue sudah complex, pertimbangkan Laravel Horizon:

```bash
# Install via Composer
composer require laravel/horizon

# Publish config
php artisan horizon:install

# Run via Supervisor (ganti queue:work dengan horizon)
```

Config supervisor untuk Horizon:

```ini
[program:production-horizon]
process_name=%(program_name)s
command=php /var/www/production/current/artisan horizon
autostart=true
autorestart=true
user=deployer
redirect_stderr=true
stdout_logfile=/var/www/production/shared/storage/logs/horizon.log
stopwaitsecs=3600
```

**Recommended untuk nanti** kalau:
- Perlu queue monitoring UI
- Multiple queues dengan priority complex
- Perlu metrics & throughput stats

---

## ✅ Checklist

- [ ] Supervisor installed & running
- [ ] Staging worker config created (`/etc/supervisor/conf.d/staging-worker.conf`)
- [ ] Production worker config created (`/etc/supervisor/conf.d/production-worker.conf`)
- [ ] Worker log directories created
- [ ] Supervisor configs reloaded (`supervisorctl reread && update`)
- [ ] Worker status checked (FATAL acceptable sebelum deploy)
- [ ] Supervisor commands reference documented
- [ ] Supervisor auto-start enabled
- [ ] Worker monitoring strategy planned
- [ ] Queue optimization options noted (Redis, Horizon)

---

**Next:** [06-first-deploy-manual.md](06-first-deploy-manual.md)
