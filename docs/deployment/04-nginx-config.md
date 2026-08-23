# Nginx Configuration

Setup Nginx virtual hosts untuk staging dan production.

---

## 1. Remove Default Nginx Config

```bash
# SSH ke VPS
ssh deployer@<VPS_IP>

# Hapus default config
sudo rm /etc/nginx/sites-enabled/default
```

---

## 2. Create Staging Virtual Host

```bash
sudo nano /etc/nginx/sites-available/staging.absen.digital
```

Isi:

```nginx
# Staging - staging.absen.digital
server {
    listen 80;
    listen [::]:80;
    server_name staging.absen.digital;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name staging.absen.digital;

    root /var/www/staging/current/public;
    index index.php index.html;

    # SSL Certificate (Cloudflare Origin atau Let's Encrypt)
    ssl_certificate /etc/nginx/ssl/absen.digital.crt;
    ssl_certificate_key /etc/nginx/ssl/absen.digital.key;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logging
    access_log /var/log/nginx/staging.absen.digital.access.log;
    error_log /var/log/nginx/staging.absen.digital.error.log;

    # Client upload size
    client_max_body_size 20M;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Laravel routes
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;

        # Timeout untuk long-running requests
        fastcgi_read_timeout 60s;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

---

## 3. Create Production Virtual Host

```bash
sudo nano /etc/nginx/sites-available/absen.digital
```

Isi:

```nginx
# Production - absen.digital
server {
    listen 80;
    listen [::]:80;
    server_name absen.digital www.absen.digital;

    # Redirect HTTP to HTTPS
    return 301 https://absen.digital$request_uri;
}

# Redirect www to non-www
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.absen.digital;

    ssl_certificate /etc/nginx/ssl/absen.digital.crt;
    ssl_certificate_key /etc/nginx/ssl/absen.digital.key;

    return 301 https://absen.digital$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name absen.digital;

    root /var/www/production/current/public;
    index index.php index.html;

    # SSL Certificate (Cloudflare Origin atau Let's Encrypt)
    ssl_certificate /etc/nginx/ssl/absen.digital.crt;
    ssl_certificate_key /etc/nginx/ssl/absen.digital.key;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS (optional, enable setelah yakin SSL works)
    # add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Logging
    access_log /var/log/nginx/absen.digital.access.log;
    error_log /var/log/nginx/absen.digital.error.log;

    # Client upload size
    client_max_body_size 20M;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Rate limiting (optional, untuk protect dari brute-force)
    # limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    # location /login {
    #     limit_req zone=login burst=2 nodelay;
    #     try_files $uri $uri/ /index.php?$query_string;
    # }

    # Laravel routes
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;

        # Timeout untuk long-running requests
        fastcgi_read_timeout 60s;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Deny access to sensitive files
    location ~ /(\.env|composer\.json|composer\.lock|package\.json|pnpm-lock\.yaml) {
        deny all;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

---

## 4. Enable Virtual Hosts

```bash
# Create symlinks
sudo ln -s /etc/nginx/sites-available/staging.absen.digital /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/absen.digital /etc/nginx/sites-enabled/

# Verify symlinks
ls -la /etc/nginx/sites-enabled/
```

---

## 5. Test Nginx Configuration

```bash
sudo nginx -t
```

Harus muncul:

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Jika ada error:
- Periksa typo di config
- Pastikan SSL certificate path benar
- Pastikan PHP-FPM socket path benar

---

## 6. Reload Nginx

```bash
sudo systemctl reload nginx
```

---

## 7. Verify Nginx Status

```bash
sudo systemctl status nginx
```

Harus: `active (running)`

---

## 8. Setup DNS di Cloudflare

### Di Cloudflare Dashboard:

1. **Add A Record untuk Production:**
   - Type: `A`
   - Name: `@` (untuk absen.digital)
   - Content: `<VPS_IP>`
   - Proxy status: ✓ Proxied (orange cloud)
   - TTL: Auto

2. **Add A Record untuk www:**
   - Type: `A`
   - Name: `www`
   - Content: `<VPS_IP>`
   - Proxy status: ✓ Proxied
   - TTL: Auto

3. **Add A Record untuk Staging:**
   - Type: `A`
   - Name: `staging`
   - Content: `<VPS_IP>`
   - Proxy status: ✓ Proxied
   - TTL: Auto

### Cloudflare SSL Settings:

- SSL/TLS → Overview → Mode: **Full (strict)**
- SSL/TLS → Edge Certificates → Always Use HTTPS: ✓ On
- SSL/TLS → Edge Certificates → Minimum TLS Version: TLS 1.2

---

## 9. Wait DNS Propagation

```bash
# Check DNS (dari local Windows)
nslookup absen.digital
nslookup staging.absen.digital

# Atau via online tool:
# https://dnschecker.org
```

Tunggu sampai IP resolve ke VPS IP (biasanya 5-15 menit).

---

## 10. Test HTTP Access (sementara 502/404 normal)

```bash
# Dari local atau dari VPS
curl -I http://staging.absen.digital
# Expected: HTTP 301 redirect to HTTPS

curl -I https://staging.absen.digital
# Expected: HTTP 502 Bad Gateway (karena /var/www/staging/current belum ada)
# Atau: HTTP 404 Not Found

# Same untuk production
curl -I https://absen.digital
```

**502/404 adalah normal** karena Laravel app belum deployed. Yang penting:
- HTTP → HTTPS redirect works ✓
- HTTPS tidak SSL error ✓
- Nginx serving request ✓

---

## 11. Create Temporary Health Check (untuk test)

```bash
# Staging
sudo mkdir -p /var/www/staging/current/public
echo "OK" | sudo tee /var/www/staging/current/public/health

# Production
sudo mkdir -p /var/www/production/current/public
echo "OK" | sudo tee /var/www/production/current/public/health

# Set ownership
sudo chown -R deployer:www-data /var/www/staging/current
sudo chown -R deployer:www-data /var/www/production/current
```

Test:

```bash
curl https://staging.absen.digital/health
# Expected: OK

curl https://absen.digital/health
# Expected: OK
```

Jika OK, Nginx ✓.

---

## 12. Nginx Logs (untuk debugging)

```bash
# Access logs
sudo tail -f /var/log/nginx/staging.absen.digital.access.log
sudo tail -f /var/log/nginx/absen.digital.access.log

# Error logs
sudo tail -f /var/log/nginx/staging.absen.digital.error.log
sudo tail -f /var/log/nginx/absen.digital.error.log

# PHP-FPM logs
sudo tail -f /var/log/php8.3-fpm.log
```

---

## 13. Nginx Performance Tuning (Optional)

Edit: `/etc/nginx/nginx.conf`

```bash
sudo nano /etc/nginx/nginx.conf
```

Optimize worker:

```nginx
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    # Buffers
    client_body_buffer_size 128k;
    client_max_body_size 20M;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 16k;

    # Timeouts
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout 65;
    send_timeout 10;

    # FastCGI cache (untuk static PHP responses)
    fastcgi_cache_path /var/cache/nginx levels=1:2 keys_zone=WORDPRESS:100m inactive=60m;
    fastcgi_cache_key "$scheme$request_method$host$request_uri";

    # ... rest of config
}
```

Create cache dir:

```bash
sudo mkdir -p /var/cache/nginx
sudo chown www-data:www-data /var/cache/nginx
```

Reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## ✅ Checklist

- [ ] Default Nginx config removed
- [ ] Staging virtual host created & enabled
- [ ] Production virtual host created & enabled
- [ ] Nginx config tested (`nginx -t`)
- [ ] Nginx reloaded
- [ ] DNS A records configured di Cloudflare (staging, @, www)
- [ ] Cloudflare SSL mode: Full (strict)
- [ ] DNS propagation verified
- [ ] HTTP → HTTPS redirect works
- [ ] HTTPS serving (502/404 acceptable sebelum app deployed)
- [ ] Health check endpoint accessible
- [ ] Nginx logs accessible
- [ ] Performance tuning applied (optional)

---

**Next:** [05-supervisor-queue.md](05-supervisor-queue.md)
