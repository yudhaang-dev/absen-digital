# Database Setup

Setup MySQL databases untuk staging dan production environments.

---

## 1. Login MySQL sebagai Root

```bash
# SSH ke VPS
ssh deployer@<VPS_IP>

# Login MySQL
sudo mysql -u root -p
# Masukkan password root MySQL yang dibuat saat setup
```

---

## 2. Create Database Users

```sql
-- User untuk Staging
CREATE USER 'abdigi_staging'@'localhost' IDENTIFIED BY 'STAGING_PASSWORD_STRONG_HERE';

-- User untuk Production
CREATE USER 'abdigi_production'@'localhost' IDENTIFIED BY 'PRODUCTION_PASSWORD_STRONG_HERE';
```

**⚠️ PENTING:**
- Ganti `STAGING_PASSWORD_STRONG_HERE` dengan password kuat (min 20 karakter random)
- Ganti `PRODUCTION_PASSWORD_STRONG_HERE` dengan password berbeda & kuat
- **SIMPAN PASSWORD INI!** Akan digunakan di `.env` files

Generate password kuat:

```bash
# Generate random password (di VPS)
openssl rand -base64 32
```

---

## 3. Create Databases

```sql
-- Database Staging (Central DB)
CREATE DATABASE abdigi_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Database Production (Central DB)
CREATE DATABASE abdigi_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 4. Grant Privileges

```sql
-- Staging: full access pada abdigi_staging + tenant databases
GRANT ALL PRIVILEGES ON abdigi_staging.* TO 'abdigi_staging'@'localhost';
GRANT ALL PRIVILEGES ON `tenant_%`.* TO 'abdigi_staging'@'localhost';

-- Production: full access pada abdigi_production + tenant databases
GRANT ALL PRIVILEGES ON abdigi_production.* TO 'abdigi_production'@'localhost';
GRANT ALL PRIVILEGES ON `tenant_%`.* TO 'abdigi_production'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;
```

**Penjelasan:**
- `abdigi_staging.*` = central database untuk staging
- `` `tenant_%`.* `` = semua database dengan prefix `tenant_` (stancl/tenancy auto-create)
- Production sama tapi isolated

---

## 5. Verify User & Database

```sql
-- List databases
SHOW DATABASES;
-- Harus muncul: abdigi_staging, abdigi_production

-- List users
SELECT User, Host FROM mysql.user WHERE User LIKE 'abdigi%';
-- Harus muncul:
-- abdigi_staging@localhost
-- abdigi_production@localhost

-- Check privileges (staging)
SHOW GRANTS FOR 'abdigi_staging'@'localhost';
-- Harus muncul grant untuk abdigi_staging.* dan tenant_%.*

-- Check privileges (production)
SHOW GRANTS FOR 'abdigi_production'@'localhost';

-- Exit MySQL
EXIT;
```

---

## 6. Test Connection (Staging)

```bash
# Test login dengan user staging
mysql -u abdigi_staging -p abdigi_staging
# Masukkan password staging

# Di MySQL prompt:
SHOW TABLES;
# Masih kosong (normal, belum ada migrations)

SELECT DATABASE();
# Harus: abdigi_staging

EXIT;
```

---

## 7. Test Connection (Production)

```bash
# Test login dengan user production
mysql -u abdigi_production -p abdigi_production
# Masukkan password production

# Di MySQL prompt:
SHOW TABLES;
SELECT DATABASE();
# Harus: abdigi_production

EXIT;
```

---

## 8. Create .env Files di VPS

### Staging .env

```bash
# SSH sebagai deployer
ssh deployer@<VPS_IP>

# Copy template
cd /var/www/staging/shared
nano .env
```

Copy dari `.env.staging.example`, isi:

```env
APP_NAME="Absen Digital - Staging"
APP_ENV=staging
APP_KEY=                              # Kosong dulu, generate nanti
APP_DEBUG=true
APP_URL=https://staging.absen.digital

APP_LOCALE=id
APP_FALLBACK_LOCALE=en

BCRYPT_ROUNDS=10

LOG_CHANNEL=stack
LOG_STACK=daily
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=abdigi_staging
DB_USERNAME=abdigi_staging
DB_PASSWORD=PASTE_STAGING_PASSWORD_HERE    # Paste password dari step 2

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=.absen.digital

FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
CACHE_STORE=database

MAIL_MAILER=log
MAIL_FROM_ADDRESS="staging@absen.digital"
MAIL_FROM_NAME="${APP_NAME}"

TENANCY_CENTRAL_DOMAINS=staging.absen.digital
```

Simpan (Ctrl+X, Y, Enter).

### Production .env

```bash
cd /var/www/production/shared
nano .env
```

Copy dari `.env.production.example`, isi:

```env
APP_NAME="Absen Digital"
APP_ENV=production
APP_KEY=                              # Kosong dulu, generate nanti
APP_DEBUG=false
APP_URL=https://absen.digital

APP_LOCALE=id
APP_FALLBACK_LOCALE=en

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=daily
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=abdigi_production
DB_USERNAME=abdigi_production
DB_PASSWORD=PASTE_PRODUCTION_PASSWORD_HERE    # Paste password dari step 2

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=.absen.digital

FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
CACHE_STORE=database

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=                        # Isi nanti kalau sudah setup email
MAIL_PASSWORD=                        # Isi nanti
MAIL_FROM_ADDRESS="noreply@absen.digital"
MAIL_FROM_NAME="${APP_NAME}"

TENANCY_CENTRAL_DOMAINS=absen.digital
```

Simpan.

---

## 9. Set Permissions

```bash
# Set ownership & permissions
sudo chown deployer:www-data /var/www/staging/shared/.env
sudo chown deployer:www-data /var/www/production/shared/.env

chmod 640 /var/www/staging/shared/.env
chmod 640 /var/www/production/shared/.env
```

---

## 10. Generate APP_KEY (nanti setelah first deploy)

APP_KEY akan di-generate otomatis saat first deployment via:

```bash
php artisan key:generate
```

Atau manual (setelah code deployed):

```bash
# Staging
cd /var/www/staging/current
php artisan key:generate

# Production
cd /var/www/production/current
php artisan key:generate
```

---

## 11. MySQL Performance Tuning (Optional)

Jika tenant mulai banyak, optimize MySQL:

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Tambahkan/ubah:

```ini
[mysqld]
# Connection
max_connections = 200

# InnoDB
innodb_buffer_pool_size = 2G          # 50-70% dari RAM
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 2    # Balance antara speed & durability
innodb_flush_method = O_DIRECT

# Query Cache (disabled di MySQL 8, sudah optimal)
# Tidak perlu setting

# Slow query log (untuk debugging)
slow_query_log = 1
slow_query_log_file = /var/log/mysql/mysql-slow.log
long_query_time = 2
```

Restart MySQL:

```bash
sudo systemctl restart mysql
```

---

## 12. Backup Strategy (Important!)

### Manual Backup Script

Create backup script:

```bash
nano ~/backup-db.sh
```

Isi:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/deployer/backups"
mkdir -p $BACKUP_DIR

# Backup staging
mysqldump -u abdigi_staging -p'STAGING_PASSWORD' abdigi_staging | gzip > $BACKUP_DIR/staging_$DATE.sql.gz

# Backup production
mysqldump -u abdigi_production -p'PRODUCTION_PASSWORD' abdigi_production | gzip > $BACKUP_DIR/production_$DATE.sql.gz

# Backup all tenant databases (production)
mysql -u root -p'ROOT_PASSWORD' -e "SHOW DATABASES LIKE 'tenant_%'" | grep tenant | while read DB; do
    mysqldump -u abdigi_production -p'PRODUCTION_PASSWORD' $DB | gzip > $BACKUP_DIR/${DB}_$DATE.sql.gz
done

# Keep last 7 days only
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable:

```bash
chmod +x ~/backup-db.sh
```

Test backup:

```bash
~/backup-db.sh
ls ~/backups/
```

### Cron untuk Auto-backup (Daily)

```bash
crontab -e
```

Tambahkan:

```
# Backup database setiap hari jam 2 pagi
0 2 * * * /home/deployer/backup-db.sh >> /home/deployer/backup.log 2>&1
```

---

## ✅ Checklist

- [ ] MySQL databases created (abdigi_staging, abdigi_production)
- [ ] MySQL users created (abdigi_staging, abdigi_production)
- [ ] Strong passwords generated & saved
- [ ] Privileges granted (central + tenant_% databases)
- [ ] Connection tested untuk staging user
- [ ] Connection tested untuk production user
- [ ] .env file created di /var/www/staging/shared/.env
- [ ] .env file created di /var/www/production/shared/.env
- [ ] Database credentials filled in .env
- [ ] .env permissions set (640, deployer:www-data)
- [ ] MySQL performance tuned (optional)
- [ ] Backup script created & tested
- [ ] Cron backup scheduled

---

**Next:** [04-nginx-config.md](04-nginx-config.md)
