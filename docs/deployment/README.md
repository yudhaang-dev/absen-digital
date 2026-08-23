# CI/CD Deployment - README

Complete CI/CD setup untuk Absen.Digital multi-tenant SaaS.

---

## 📋 Overview

**Stack:**
- **VPS:** Ubuntu 24.04, Nginx, PHP 8.3, MySQL 8, Node 22
- **CI/CD:** GitHub Actions (free tier)
- **Deploy Strategy:** Zero-downtime atomic symlink swap
- **Environments:** Staging (auto) + Production (manual approval)

**Architecture:**
```
Developer → Git Push → GitHub Actions (test + build) → SSH Deploy → VPS
                                                          ↓
                                               Staging: auto-deploy
                                               Production: manual-approval
```

---

## 🚀 Quick Start

### Prerequisites
- [ ] VPS provisioned (BiznetGio atau similar)
- [ ] Domain registered & DNS accessible
- [ ] GitHub repo access (private)
- [ ] SSH key pair generated

### Setup Steps

1. **VPS Setup** → [01-vps-initial-setup.md](01-vps-initial-setup.md)
   - Install stack (Nginx, PHP, MySQL, Node, Supervisor)
   - ~30-45 menit

2. **Deploy User** → [02-deploy-user-ssh-keys.md](02-deploy-user-ssh-keys.md)
   - Create non-root deployer user
   - Setup SSH keys
   - ~15 menit

3. **Database** → [03-database-setup.md](03-database-setup.md)
   - Create MySQL databases & users
   - Configure .env files
   - ~10 menit

4. **Nginx** → [04-nginx-config.md](04-nginx-config.md)
   - Setup virtual hosts (staging + production)
   - Configure SSL (Cloudflare Origin)
   - Setup DNS
   - ~20 menit

5. **Queue Workers** → [05-supervisor-queue.md](05-supervisor-queue.md)
   - Configure Supervisor for Laravel queues
   - ~10 menit

6. **First Deploy** → [06-first-deploy-manual.md](06-first-deploy-manual.md)
   - Manual deployment test (staging + production)
   - Verify full stack works
   - ~30 menit

7. **GitHub Secrets** → [07-github-secrets-setup.md](07-github-secrets-setup.md)
   - Configure GitHub repository secrets
   - Setup GitHub Environment (production approval)
   - Test automated deploy
   - ~20 menit

8. **Troubleshooting** → [08-troubleshooting.md](08-troubleshooting.md)
   - Common issues & solutions
   - Rollback procedures
   - Monitoring setup

**Total Setup Time:** ~2-3 jam (first time)

---

## 📁 File Structure

### Workflows
```
.github/workflows/
├─ ci.yml              # PR checks (Pint, PHPStan, Pest, lint)
├─ staging.yml         # Auto-deploy to staging
└─ production.yml      # Manual-approval deploy to production
```

### Scripts
```
scripts/
├─ deploy.sh           # Zero-downtime deploy script
├─ rollback.sh         # Quick rollback to previous release
└─ health-check.sh     # Post-deploy health validation
```

### Documentation
```
docs/deployment/
├─ 01-vps-initial-setup.md
├─ 02-deploy-user-ssh-keys.md
├─ 03-database-setup.md
├─ 04-nginx-config.md
├─ 05-supervisor-queue.md
├─ 06-first-deploy-manual.md
├─ 07-github-secrets-setup.md
├─ 08-troubleshooting.md
└─ README.md (this file)
```

### Environment Templates
```
.env.staging.example      # Template untuk VPS staging
.env.production.example   # Template untuk VPS production
```

---

## 🔄 Deployment Flow

### Staging (Auto-deploy)

```bash
# Developer workflow
git checkout staging
git merge main  # Or develop directly on staging
git push origin staging

# GitHub Actions automatically:
# 1. Run tests (Pest, Pint, PHPStan, lint, types)
# 2. Build assets (Vite)
# 3. Deploy to VPS staging
# 4. Run health check
# ~6-8 minutes total
```

**Result:** https://staging.absen.digital updated.

### Production (Manual Approval)

```bash
# Developer workflow
git checkout main
git merge staging  # After staging verified
git push origin main

# GitHub Actions:
# 1. Run tests + build
# 2. WAIT for manual approval
# 3. Deploy to production (after approved)
# 4. Health check
# 5. Auto-rollback if health check fails
# ~7-10 minutes + approval delay
```

**Approval:** GitHub repo → Actions → Review deployments → Approve.

**Result:** https://absen.digital updated.

---

## 🛠 Common Tasks

### Check Deployment Status
```bash
# GitHub Actions
# https://github.com/yudhaang-dev/absen-digital/actions

# Or CLI (if gh installed)
gh run list --workflow=staging.yml
gh run list --workflow=production.yml
```

### Manual Deploy (Bypass CI)
```bash
# SSH ke VPS
ssh deployer@<VPS_IP>

# Deploy staging
cd /var/www/absen.digital/scripts
./deploy.sh staging staging

# Deploy production
./deploy.sh production main
```

### Rollback Production
```bash
ssh deployer@<VPS_IP>
cd /var/www/absen.digital/scripts

# Rollback to previous release
./rollback.sh production

# Or rollback to specific release
./rollback.sh production 20260823_120000
```

### Check Logs
```bash
# Application logs
ssh deployer@<VPS_IP>
tail -f /var/www/production/shared/storage/logs/laravel.log

# Nginx logs
sudo tail -f /var/log/nginx/absen.digital.error.log

# Queue worker logs
sudo supervisorctl tail -f production-worker:production-worker_00

# GitHub Actions logs
# GitHub repo → Actions → Click workflow run
```

### Health Check
```bash
# From VPS
cd /var/www/absen.digital/scripts
./health-check.sh staging
./health-check.sh production

# Or via curl
curl https://staging.absen.digital/health
curl https://absen.digital/health
```

---

## 🔐 Security

### Secrets Management
- `.env` files disimpan di VPS (`/var/www/{env}/shared/.env`)
- **TIDAK pernah commit** `.env` ke Git
- GitHub Secrets hanya untuk VPS access (SSH key, IP, paths)
- Rotate SSH keys annually

### Access Control
- Deploy user: `deployer` (non-root, limited sudo)
- SSH key-only authentication (password disabled)
- GitHub Environment protection: production requires approval
- Branch protection: main branch requires PR + status checks

### SSL/TLS
- Cloudflare Full (strict) mode
- Auto-renew via Cloudflare Origin Certificate
- **Atau** Let's Encrypt via Certbot

---

## 📊 Monitoring

### GitHub Actions Free Tier
- **2000 minutes/month**
- Average usage: ~440 min/month (10 staging + 5 prod deploys/week)
- **78% quota remaining** ✓

### VPS Resources (2vCPU/4GB)
- Nginx: ~50MB
- PHP-FPM: ~400MB (2 pools × 2 workers)
- MySQL: ~800MB
- Queue workers: ~200MB
- OS: ~500MB
- **Free: ~2GB** ✓

### Disk Space
- Keep last 5 releases (~2GB)
- Logs rotated daily (keep 14 days staging, 30 days prod)
- Database backups daily (keep 7 days)
- Alert jika disk >80%

---

## 🐛 Troubleshooting Quick Links

- **Tests failing?** → [08-troubleshooting.md#2-tests-failing-in-ci](08-troubleshooting.md)
- **SSH connection failed?** → [08-troubleshooting.md#4-ssh-connection-failed](08-troubleshooting.md)
- **502 Bad Gateway?** → [08-troubleshooting.md#9-health-check-failed-502-bad-gateway](08-troubleshooting.md)
- **Queue not working?** → [08-troubleshooting.md#10-queue-workers-not-running](08-troubleshooting.md)
- **Slow performance?** → [08-troubleshooting.md#11-slow-page-load](08-troubleshooting.md)

---

## 📞 Support

- **GitHub Issues:** https://github.com/yudhaang-dev/absen-digital/issues
- **VPS Provider:** BiznetGio support
- **Emergency Rollback:** [08-troubleshooting.md#rollback-procedures](08-troubleshooting.md)

---

## ✅ Post-Setup Checklist

- [ ] VPS fully configured & tested
- [ ] First manual deploy successful (staging + production)
- [ ] GitHub Secrets configured
- [ ] GitHub Environment (production) configured
- [ ] Automated staging deploy tested
- [ ] Automated production deploy tested (with approval)
- [ ] Rollback script tested
- [ ] Health checks passing
- [ ] Logs accessible & clean
- [ ] Monitoring cron jobs setup
- [ ] Backup strategy verified
- [ ] Team trained on workflows

---

**Status:** CI/CD Ready ✓

Lanjut development → [docs/product/ROADMAP.md](../product/ROADMAP.md)
