# Deploy User & SSH Keys Setup

Setup user khusus untuk deployment (non-root) dan SSH key untuk GitHub Actions.

---

## 1. Create Deploy User

```bash
# SSH sebagai root
ssh root@<VPS_IP>

# Create user 'deployer'
adduser deployer
# Set password (SIMPAN PASSWORD INI!)

# Add to www-data group (Nginx user)
usermod -aG www-data deployer

# Give sudo privileges (terbatas)
usermod -aG sudo deployer
```

---

## 2. Setup Sudo Tanpa Password (untuk service reload)

```bash
visudo
```

Tambahkan di bagian bawah:

```
# Deployer can reload/restart specific services without password
deployer ALL=(ALL) NOPASSWD: /bin/systemctl reload php8.3-fpm
deployer ALL=(ALL) NOPASSWD: /bin/systemctl restart php8.3-fpm
deployer ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl restart staging-worker:*
deployer ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl restart production-worker:*
deployer ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl status staging-worker:*
deployer ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl status production-worker:*
```

Simpan (Ctrl+X, Y, Enter).

---

## 3. Generate SSH Key Pair (di Local Windows)

```powershell
# Dari Windows PowerShell/Terminal
ssh-keygen -t ed25519 -C "github-actions-absen-digital" -f ~/.ssh/absen_deploy

# Generate 2 file:
# - absen_deploy (private key) → untuk GitHub Secrets
# - absen_deploy.pub (public key) → untuk VPS
```

---

## 4. Copy Public Key ke VPS

### Opsi A: Manual Copy-Paste

```powershell
# Di Windows, baca public key
cat ~/.ssh/absen_deploy.pub
# Copy isi file ini
```

```bash
# Di VPS, SSH sebagai deployer
ssh deployer@<VPS_IP>

# Create .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Paste public key
nano ~/.ssh/authorized_keys
# Paste isi absen_deploy.pub, simpan

# Set permissions
chmod 600 ~/.ssh/authorized_keys
```

### Opsi B: ssh-copy-id (Linux/WSL)

```bash
ssh-copy-id -i ~/.ssh/absen_deploy.pub deployer@<VPS_IP>
```

---

## 5. Test SSH Key Login

```powershell
# Dari Windows
ssh -i ~/.ssh/absen_deploy deployer@<VPS_IP>
```

Jika berhasil login tanpa password prompt, SSH key ✓.

---

## 6. Disable Password Authentication (Optional - Recommended)

```bash
# SSH sebagai root
ssh root@<VPS_IP>

# Edit SSH config
nano /etc/ssh/sshd_config
```

Ubah/uncomment:

```
PasswordAuthentication no
PubkeyAuthentication yes
PermitRootLogin no
```

Restart SSH:

```bash
systemctl restart sshd
```

**⚠️ PENTING:** Pastikan SSH key sudah tested sebelum disable password! Kalau tidak, bisa terkunci dari VPS.

---

## 7. Create Deployment Directories

```bash
# SSH sebagai deployer
ssh deployer@<VPS_IP>

# Create directory structure
sudo mkdir -p /var/www/staging/{releases,shared/{storage/{app,framework,logs},}}
sudo mkdir -p /var/www/production/{releases,shared/{storage/{app,framework,logs},}}

# Set ownership ke deployer:www-data
sudo chown -R deployer:www-data /var/www/staging
sudo chown -R deployer:www-data /var/www/production

# Set permissions
sudo chmod -R 775 /var/www/staging
sudo chmod -R 775 /var/www/production
```

---

## 8. Create Laravel Storage Subdirectories

```bash
# Staging storage
mkdir -p /var/www/staging/shared/storage/framework/{cache,sessions,testing,views}
mkdir -p /var/www/staging/shared/storage/app/public

# Production storage
mkdir -p /var/www/production/shared/storage/framework/{cache,sessions,testing,views}
mkdir -p /var/www/production/shared/storage/app/public

# Set permissions
chmod -R 775 /var/www/staging/shared/storage
chmod -R 775 /var/www/production/shared/storage
```

---

## 9. Add GitHub to known_hosts (untuk Git Clone)

```bash
# SSH sebagai deployer
ssh deployer@<VPS_IP>

# Add github.com ke known hosts
ssh-keyscan -H github.com >> ~/.ssh/known_hosts
```

---

## 10. Test Git Clone (Public Repo)

```bash
# Test clone repo (sebagai deployer)
cd /tmp
git clone https://github.com/yudhaang-dev/absen-digital.git test-clone

# Jika berhasil clone, Git ✓
rm -rf test-clone
```

---

## 11. Setup Deploy Token (untuk Private Repo)

Karena repo private, GitHub Actions perlu token untuk clone.

### Di GitHub:

1. Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Name: `absen-digital-deploy`
4. Scopes: `repo` (full control)
5. Generate token
6. **COPY TOKEN** (hanya muncul sekali!)

### Di VPS:

```bash
# SSH sebagai deployer
ssh deployer@<VPS_IP>

# Setup Git credentials helper
git config --global credential.helper store

# Clone sekali dengan token (untuk save credentials)
cd /tmp
git clone https://<TOKEN>@github.com/yudhaang-dev/absen-digital.git test
# Token akan disimpan di ~/.git-credentials

rm -rf test
```

**Alternatif (lebih aman): Deploy Key**

### Di GitHub:

1. Repo → Settings → Deploy keys → Add deploy key
2. Title: `VPS Deployer`
3. Generate key pair di VPS:

```bash
ssh-keygen -t ed25519 -C "vps-deploy-key" -f ~/.ssh/github_deploy
cat ~/.ssh/github_deploy.pub
# Copy output, paste ke GitHub Deploy Key
```

4. Paste public key
5. ✓ Allow write access (jika perlu push)
6. Add key

### Di VPS:

```bash
# Add ke SSH config
nano ~/.ssh/config
```

Isi:

```
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_deploy
```

Test:

```bash
ssh -T git@github.com
# Harus: "Hi yudhaang-dev/absen-digital! You've successfully authenticated"
```

---

## 12. Read Private Key (untuk GitHub Secrets)

```powershell
# Di Windows, baca private key
cat ~/.ssh/absen_deploy

# Copy SELURUH OUTPUT (termasuk -----BEGIN/END-----)
# Akan dimasukkan ke GitHub Secrets nanti
```

---

## ✅ Checklist

- [ ] User `deployer` created
- [ ] Deployer added to www-data group
- [ ] Sudo privileges configured (tanpa password untuk service reload)
- [ ] SSH key pair generated (local Windows)
- [ ] Public key added ke VPS (~/.ssh/authorized_keys)
- [ ] SSH key login tested ✓
- [ ] Password authentication disabled (optional)
- [ ] Deployment directories created (/var/www/staging, /var/www/production)
- [ ] Storage subdirectories created
- [ ] Ownership & permissions set (deployer:www-data, 775)
- [ ] GitHub added to known_hosts
- [ ] Git clone tested ✓
- [ ] Deploy token/key configured
- [ ] Private key copied (untuk GitHub Secrets)

---

**Next:** [03-database-setup.md](03-database-setup.md)
