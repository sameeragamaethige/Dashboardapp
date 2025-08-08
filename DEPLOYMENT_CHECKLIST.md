# 🚀 Quick Deployment Checklist

Use this checklist to ensure you don't miss any steps during deployment.

## 📋 Pre-Deployment Checklist

### Local Setup
- [ ] Node.js 18+ installed (`node --version`)
- [ ] MySQL installed and running
- [ ] Project dependencies installed (`npm install`)
- [ ] Environment file created (`.env.local`)
- [ ] Database initialized (`npm run init-db`)
- [ ] Migrations run (`npm run migrate-db`, `npm run migrate-files`, `npm run migrate-admin-step3`)
- [ ] Application runs locally (`npm run dev`)

## 🌐 VPS Deployment Checklist

### Server Setup
- [ ] VPS instance created (Ubuntu 22.04 LTS recommended)
- [ ] SSH access configured
- [ ] Server updated (`sudo apt update && sudo apt upgrade -y`)
- [ ] Essential tools installed (`curl`, `wget`, `git`, `unzip`)

### Software Installation
- [ ] Node.js 18+ installed
- [ ] MySQL installed and secured
- [ ] PM2 installed globally (`sudo npm install -g pm2`)
- [ ] Nginx installed (optional but recommended)

### Database Configuration
- [ ] Database created (`banana_db`)
- [ ] Database user created with proper permissions
- [ ] Database connection tested

### Application Deployment
- [ ] Code uploaded to VPS
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (production settings)
- [ ] Database initialized on VPS
- [ ] Application built (`npm run build`)
- [ ] PM2 process started
- [ ] PM2 configured to start on boot

### Domain & SSL (Optional)
- [ ] Domain pointed to VPS IP
- [ ] Nginx configured for domain
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] HTTPS redirect configured

## ✅ Post-Deployment Verification

### Functionality Tests
- [ ] Website loads at domain/IP
- [ ] User registration works
- [ ] Admin login works
- [ ] File uploads work
- [ ] Database operations work
- [ ] All API endpoints respond correctly

### Security Checks
- [ ] Environment variables are secure
- [ ] Database user has minimal required permissions
- [ ] Firewall configured (if applicable)
- [ ] SSL certificate valid (if using HTTPS)

### Performance Checks
- [ ] Application starts automatically after server reboot
- [ ] PM2 logs show no errors
- [ ] Database connections are stable
- [ ] File uploads complete successfully

## 🔧 Quick Commands Reference

```bash
# Check application status
pm2 status
pm2 logs banana-app

# Restart application
pm2 restart banana-app

# Check database connection
npm run test-mysql

# Check file storage
npm run test-files

# View system resources
htop
df -h
free -h
```

## 🆘 Emergency Commands

```bash
# Stop application
pm2 stop banana-app

# Delete from PM2
pm2 delete banana-app

# Restart MySQL
sudo systemctl restart mysql

# Restart Nginx
sudo systemctl restart nginx

# Check server logs
sudo journalctl -u nginx
sudo journalctl -u mysql
```

## 📞 Support Information

- **Application Logs:** `pm2 logs banana-app`
- **System Logs:** `sudo journalctl -f`
- **Database Status:** `sudo systemctl status mysql`
- **Web Server Status:** `sudo systemctl status nginx`

---

**Remember:** Take your time with each step. It's better to do it right the first time than to fix issues later! 🎯
