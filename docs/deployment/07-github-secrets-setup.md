# GitHub Secrets Setup

Setup GitHub repository secrets untuk CI/CD automation.

---

## 1. Collect Required Information

Sebelum setup secrets, siapkan informasi ini:

### VPS Information
```bash
# SSH ke VPS untuk verify info
ssh deployer@<VPS_IP>

# Check paths
ls -la /var/www/staging
ls -la /var/www/production

# Check SSH port (default 22)
sudo cat /etc/ssh/sshd_config | grep Port
```

### SSH Private Key
```powershell
# Dari Windows, baca private key yang dibuat di step 02
cat ~/.ssh/absen_deploy

# Copy SELURUH OUTPUT termasuk:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...
# -----END OPENSSH PRIVATE KEY-----
```

---

## 2. Open GitHub Repository Settings

1. Buka: `https://github.com/yudhaang-dev/absen-digital`
2. Klik tab **Settings**
3. Di sidebar kiri, klik **Secrets and variables** → **Actions**

---

## 3. Add Repository Secrets

Klik **New repository secret** untuk setiap secret:

### Secret 1: VPS_HOST
- **Name:** `VPS_HOST`
- **Value:** `<VPS_IP_ADDRESS>`
- Example: `103.xxx.xxx.xxx`

### Secret 2: VPS_PORT
- **Name:** `VPS_PORT`
- **Value:** `22`
- (Ganti jika SSH port berbeda)

### Secret 3: VPS_USER
- **Name:** `VPS_USER`
- **Value:** `deployer`

### Secret 4: VPS_SSH_PRIVATE_KEY
- **Name:** `VPS_SSH_PRIVATE_KEY`
- **Value:** Paste SELURUH isi file `~/.ssh/absen_deploy`
- **⚠️ PENTING:** Include `-----BEGIN` dan `-----END` lines
- **⚠️ PENTING:** Jangan ada spasi/newline extra di awal/akhir

### Secret 5: STAGING_PATH
- **Name:** `STAGING_PATH`
- **Value:** `/var/www/staging`

### Secret 6: PRODUCTION_PATH
- **Name:** `PRODUCTION_PATH`
- **Value:** `/var/www/production`

---

## 4. Verify Secrets

Setelah semua ditambahkan, di halaman Secrets harus muncul:

```
VPS_HOST                   Updated X seconds ago
VPS_PORT                   Updated X seconds ago
VPS_USER                   Updated X seconds ago
VPS_SSH_PRIVATE_KEY        Updated X seconds ago
STAGING_PATH               Updated X seconds ago
PRODUCTION_PATH            Updated X seconds ago
```

**Secrets tidak bisa di-view lagi setelah disimpan** (security).

---

## 5. Setup GitHub Environment untuk Production

GitHub Environments = manual approval gate untuk production deploy.

### Create Environment

1. Di repo Settings → **Environments**
2. Klik **New environment**
3. Name: `production`
4. Klik **Configure environment**

### Add Required Reviewers

1. Di Production environment settings
2. Enable **Required reviewers**
3. Add reviewers: Pilih username kamu (`yudhaang-dev`)
4. Save protection rules

### Environment URL (Optional)

- Environment URL: `https://absen.digital`
- Ini akan muncul di deployment logs

---

## 6. Create Staging Branch

```bash
# Dari local repo
cd E:\Laragon\www\absen.digital

# Create staging branch dari main
git checkout -b staging

# Push ke GitHub
git push -u origin staging
```

Sekarang ada 2 branches:
- `main` → auto-deploy to production (with approval)
- `staging` → auto-deploy to staging (no approval)

---

## 7. Setup Branch Protection Rules (Recommended)

### Protect Main Branch

1. Repo Settings → **Branches**
2. Klik **Add rule**
3. Branch name pattern: `main`
4. Enable:
   - ✓ Require a pull request before merging
   - ✓ Require status checks to pass before merging
   - Search & add status checks: `test-and-build`
   - ✓ Require conversation resolution before merging
5. Save changes

### Staging Branch (No Protection)

Staging branch tidak perlu protection (untuk fast iteration).

---

## 8. Test SSH Connection dari GitHub Actions

Create test workflow untuk verify SSH:

```bash
# Local repo
cd E:\Laragon\www\absen.digital
```

Create temporary test file:

```yaml
# .github/workflows/test-ssh.yml
name: Test SSH Connection

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          port: ${{ secrets.VPS_PORT }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_PRIVATE_KEY }}
          script: |
            echo "SSH connection successful!"
            whoami
            pwd
            ls -la /var/www/
```

Push & run:

```bash
git add .github/workflows/test-ssh.yml
git commit -m "test: SSH connection workflow"
git push origin main
```

### Run Test Workflow

1. GitHub repo → **Actions** tab
2. Pilih workflow **Test SSH Connection**
3. Klik **Run workflow** → **Run workflow**
4. Tunggu complete

Expected result:
```
SSH connection successful!
deployer
/home/deployer
drwxrwxr-x ... staging
drwxrwxr-x ... production
```

Jika error:
- Check secret values (typo?)
- Check SSH key format (include BEGIN/END?)
- Check VPS firewall (port 22 open?)

### Cleanup Test Workflow

```bash
git rm .github/workflows/test-ssh.yml
git commit -m "chore: remove SSH test workflow"
git push origin main
```

---

## 9. Update Existing CI Workflow

Update `ci.yml` untuk tidak conflict dengan new workflows:

```bash
# Local repo
nano .github/workflows/ci.yml
```

Change trigger (skip staging/main push, hanya untuk PR):

```yaml
on:
  pull_request:
    branches: ['main', 'staging']
```

Commit:

```bash
git add .github/workflows/ci.yml
git commit -m "ci: update CI workflow trigger"
git push origin main
```

---

## 10. Verify Workflows Ready

Check workflows exist:

```bash
ls -la .github/workflows/
```

Should have:
- `ci.yml` (for PR checks)
- `staging.yml` (auto-deploy staging)
- `production.yml` (manual-approval production)
- `tests.yml` (existing, bisa di-disable atau keep)

---

## 11. First Automated Deploy Test (Staging)

```bash
# Create dummy change
echo "# CI/CD Enabled" >> README.md

git add README.md
git commit -m "test: trigger staging deploy"
git checkout staging
git merge main
git push origin staging
```

### Monitor Deploy

1. GitHub → **Actions** tab
2. Should see: **Deploy to Staging** workflow running
3. Watch logs real-time

Expected flow:
1. ✓ Checkout code
2. ✓ Setup PHP/Node
3. ✓ Cache dependencies
4. ✓ Install dependencies
5. ✓ Run Pint
6. ✓ Run PHPStan
7. ✓ Run Pest
8. ✓ Lint frontend
9. ✓ TypeScript check
10. ✓ Build assets
11. ✓ Deploy to staging
12. ✓ Health check

### If Deployment Fails

Common issues:

#### SSH Connection Failed
```
Error: ssh: connect to host X.X.X.X port 22: Connection refused
```

Fix:
- Check VPS_HOST secret (correct IP?)
- Check VPS firewall: `sudo ufw status`
- Check SSH service: `sudo systemctl status sshd`

#### Permission Denied
```
Error: Permission denied (publickey)
```

Fix:
- Check VPS_SSH_PRIVATE_KEY format
- Verify public key di VPS: `cat ~/.ssh/authorized_keys`
- Test SSH manual: `ssh -i ~/.ssh/absen_deploy deployer@VPS_IP`

#### Deploy Script Failed
```
Error: composer: command not found
```

Fix:
- SSH ke VPS as deployer
- Check PATH: `echo $PATH`
- Check composer location: `which composer`
- May need to adjust PATH in deploy script

---

## 12. First Automated Deploy Test (Production)

```bash
# Push to main (will trigger production workflow)
git checkout main
git merge staging
git push origin main
```

### Approve Deployment

1. GitHub → **Actions** tab
2. See: **Deploy to Production** workflow (⏸ Waiting for approval)
3. Klik workflow → Klik **Review deployments**
4. Check: ✓ production
5. Klik **Approve and deploy**

Workflow akan continue setelah approval.

---

## 13. Setup Notifications (Optional)

### Email Notifications

GitHub default: email notif untuk workflow failures.

Settings → **Notifications** → Check: ✓ Actions

### Slack/Discord Webhook (Optional)

Add webhook secret:

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
```

Update workflow (contoh untuk staging.yml):

```yaml
- name: Notify Success
  if: success()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
      -H 'Content-Type: application/json' \
      -d '{"text":"✅ Staging deployed: ${{ github.sha }}"}'

- name: Notify Failure
  if: failure()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
      -H 'Content-Type: application/json' \
      -d '{"text":"❌ Staging deploy failed: ${{ github.sha }}"}'
```

---

## 14. Security Best Practices

### Rotate SSH Keys Annually

```bash
# Generate new key pair
ssh-keygen -t ed25519 -C "github-actions-2027" -f ~/.ssh/absen_deploy_2027

# Add new public key ke VPS (keep old key dulu)
ssh-copy-id -i ~/.ssh/absen_deploy_2027.pub deployer@VPS_IP

# Update GitHub secret VPS_SSH_PRIVATE_KEY with new private key
# Test deployment
# Remove old key dari VPS: edit ~/.ssh/authorized_keys
```

### Limit Secret Access

1. Repo Settings → **Actions** → **General**
2. Workflow permissions: **Read repository contents and packages permissions**
3. ✓ Allow GitHub Actions to create and approve pull requests: **Uncheck**

### Audit Secret Usage

1. Repo Settings → **Logs**
2. Review actions logs regularly
3. Check for suspicious SSH activity di VPS: `sudo tail /var/log/auth.log`

---

## ✅ Checklist

### GitHub Secrets
- [ ] VPS_HOST configured
- [ ] VPS_PORT configured
- [ ] VPS_USER configured
- [ ] VPS_SSH_PRIVATE_KEY configured (include BEGIN/END lines)
- [ ] STAGING_PATH configured
- [ ] PRODUCTION_PATH configured
- [ ] All secrets verified (tidak typo)

### GitHub Environment
- [ ] Production environment created
- [ ] Required reviewers configured
- [ ] Environment URL set

### Branches
- [ ] Staging branch created & pushed
- [ ] Main branch protection enabled (optional)
- [ ] Branch strategy documented

### Workflows
- [ ] ci.yml updated (PR only)
- [ ] staging.yml exists & configured
- [ ] production.yml exists & configured
- [ ] SSH connection test passed

### Testing
- [ ] Test SSH workflow ran successfully
- [ ] First staging deploy triggered & passed
- [ ] First production deploy triggered, approved & passed
- [ ] Health checks passed post-deploy

### Monitoring
- [ ] GitHub Actions email notifications enabled
- [ ] Slack/Discord webhook configured (optional)
- [ ] VPS auth logs monitored

### Security
- [ ] SSH key rotation plan documented
- [ ] Secret access limited
- [ ] Audit logging enabled

---

**Next:** [08-troubleshooting.md](08-troubleshooting.md)
