# VPS Initial Setup - Absen.Digital

Panduan setup VPS BiznetGio dari fresh Ubuntu 24.04 install.

## Spesifikasi Minimum

- **OS:** Ubuntu 24.04 LTS
- **CPU:** 2 vCPU
- **RAM:** 4GB
- **Storage:** 80GB SSD
- **Provider:** BiznetGio (atau VPS lain dengan spek sama)

---

## 1. Koneksi SSH Awal

```bash
# Dari Windows (PowerShell atau Terminal)
ssh root@<VPS_IP>

# Ganti password root (recommended)
passwd
```

---

## 2. Update Sistem

```bash
apt update && apt upgrade -y
apt install -y software-properties-common curl wget git unzip
```

---

## 3. Install Nginx

```bash
apt install -y nginx

# Cek status
systemctl status nginx

# Enable auto-start
systemctl enable nginx

# Test
curl http://localhost
# Harus muncul "Welcome to nginx!"
```

---

## 4. Install PHP 8.3 + Extensions

```bash
# Add PPA untuk PHP 8.3
add-apt-repository ppa:ondrej/php -y
apt update

# Install PHP 8.3 dan extensions yang dibutuhkan
apt install -y php8.3 \
    php8.3-fpm \
    php8.3-cli \
    php8.3-mysql \
    php8.3-mbstring \
    php8.3-xml \
    php8.3-curl \
    php8.3-zip \
    php8.3-bcmath \
    php8.3-intl \
    php8.3-gd \
    php8.3-redis

# Cek versi
php -v
# Harus: PHP 8.3.x

# Cek PHP-FPM status
systemctl status php8.3-fpm
systemctl enable php8.3-fpm
```

---

## 5. Install MySQL 8.0

```bash
apt install -y mysql-server

# Secure installation
mysql_secure_installation
# - Set root password (SIMPAN PASSWORD INI!)
# - Remove anonymous users: Y
# - Disallow root login remotely: Y
# - Remove test database: Y
# - Reload privilege tables: Y

# Test login
mysql -u root -p
# Masukkan password yang baru dibuat
```

---

## 6. Install Composer

```bash
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
chmod +x /usr/local/bin/composer

# Cek versi
composer --version
# Harus: Composer 2.x
```

---

## 7. Install Node.js 22 + pnpm

```bash
# Install Node 22 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Cek versi
node -v   # Harus: v22.x.x
npm -v

# Install pnpm globally
npm install -g pnpm

# Cek versi
pnpm -v
```

---

## 8. Install Supervisor (untuk Queue Workers)

```bash
apt install -y supervisor

# Enable auto-start
systemctl enable supervisor
systemctl start supervisor

# Cek status
systemctl status supervisor
```

---

## 9. Setup Firewall (UFW)

```bash
# Allow SSH, HTTP, HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'

# Enable firewall
ufw --force enable

# Cek status
ufw status
# Harus muncul: Status: active
# Ports: 22, 80, 443 ALLOW
```

---

## 10. Setup Timezone & Locale

```bash
# Set timezone ke Jakarta (WIB)
timedatectl set-timezone Asia/Jakarta

# Cek timezone
timedatectl
# Harus: Time zone: Asia/Jakarta (WIB, +0700)

# Set locale
locale-gen id_ID.UTF-8
update-locale LANG=id_ID.UTF-8
```

---

## 11. Optimize PHP-FPM untuk Production

Edit: `/etc/php/8.3/fpm/pool.d/www.conf`

```bash
nano /etc/php/8.3/fpm/pool.d/www.conf
```

Ubah/tambahkan:

```ini
; Process management
pm = dynamic
pm.max_children = 20
pm.start_servers = 4
pm.min_spare_servers = 2
pm.max_spare_servers = 6
pm.max_requests = 500

; Performance
request_terminate_timeout = 60s
```

Restart PHP-FPM:

```bash
systemctl restart php8.3-fpm
```

---

## 12. Optimize MySQL

Edit: `/etc/mysql/mysql.conf.d/mysqld.cnf`

```bash
nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Tambahkan di section `[mysqld]`:

```ini
# Performance
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 100

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

Restart MySQL:

```bash
systemctl restart mysql
```

---

## 13. Install SSL (Cloudflare Proxy - Recommended)

Karena domain sudah di Cloudflare, cara termudah:

1. **Di Cloudflare Dashboard:**
   - SSL/TLS → Overview → Set mode: **Full (strict)**
   - SSL/TLS → Origin Server → Create Certificate
   - Copy certificate + private key

2. **Di VPS:**

```bash
mkdir -p /etc/nginx/ssl

# Paste certificate
nano /etc/nginx/ssl/absen.digital.crt
# Paste isi certificate dari Cloudflare

# Paste private key
nano /etc/nginx/ssl/absen.digital.key
# Paste isi private key dari Cloudflare

# Set permissions
chmod 600 /etc/nginx/ssl/absen.digital.key
chmod 644 /etc/nginx/ssl/absen.digital.crt
```

**Alternatif (Let's Encrypt Certbot):**

```bash
apt install -y certbot python3-certbot-nginx

# Generate certificate (untuk production)
certbot --nginx -d absen.digital -d www.absen.digital

# Generate certificate (untuk staging)
certbot --nginx -d staging.absen.digital
```

---

## 14. Optimize Nginx

Edit: `/etc/nginx/nginx.conf`

```bash
nano /etc/nginx/nginx.conf
```

Pastikan setting ini ada:

```nginx
user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 2048;
    multi_accept on;
}

http {
    # Basic
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    # Include configs
    include /etc/nginx/mime.types;
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

Test & restart:

```bash
nginx -t
systemctl restart nginx
```

---

## 15. Test Full Stack

```bash
# PHP
php -v

# PHP-FPM
systemctl status php8.3-fpm

# Nginx
nginx -v
systemctl status nginx

# MySQL
mysql -V
systemctl status mysql

# Composer
composer --version

# Node + pnpm
node -v
pnpm -v

# Supervisor
systemctl status supervisor
```

Jika semua ✓ running, stack ready.

---

## 16. Reboot VPS (Optional tapi Recommended)

```bash
reboot
```

Tunggu 1-2 menit, lalu SSH ulang. Cek semua service auto-start:

```bash
systemctl status nginx php8.3-fpm mysql supervisor
```

---

## ✅ Checklist

- [ ] Ubuntu 24.04 updated
- [ ] Nginx installed & running
- [ ] PHP 8.3-FPM installed & running
- [ ] MySQL 8.0 installed & secured
- [ ] Composer installed (v2.x)
- [ ] Node 22 + pnpm installed
- [ ] Supervisor installed & running
- [ ] UFW firewall enabled (port 22, 80, 443)
- [ ] Timezone set ke Asia/Jakarta
- [ ] SSL certificate ready (Cloudflare atau Certbot)
- [ ] PHP-FPM optimized
- [ ] MySQL optimized
- [ ] Nginx optimized
- [ ] VPS rebooted & services auto-start ✓

---

**Next:** [02-deploy-user-ssh-keys.md](02-deploy-user-ssh-keys.md)
