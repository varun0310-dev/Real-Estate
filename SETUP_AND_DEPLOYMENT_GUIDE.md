# Real Estate Platform - Complete Setup & Deployment Guide

This document provides complete, step-by-step instructions for setting up, running, seeding, and deploying the **Real Estate Platform**. It covers both **local development** and **production server deployment** (Linux / Ubuntu VPS / Cloud Server).

---

## Table of Contents
1. [Project Overview & Architecture](#1-project-overview--architecture)
2. [Prerequisites & System Requirements](#2-prerequisites--system-requirements)
3. [Local Development Setup](#3-local-development-setup)
   - [3.1 Environment Variables Configuration](#31-environment-variables-configuration)
   - [3.2 Installing Dependencies](#32-installing-dependencies)
   - [3.3 Database Setup](#33-database-setup)
   - [3.4 Database Seeders & Migrations](#34-database-seeders--migrations)
   - [3.5 Background Cron Jobs](#35-background-cron-jobs)
   - [3.6 Running the Application](#36-running-the-application)
   - [3.7 Default Admin Login](#37-default-admin-login)
4. [Production Deployment Guide (Linux / Ubuntu VPS)](#4-production-deployment-guide-linux--ubuntu-vps)
   - [4.1 Server Preparation & Prerequisites](#41-server-preparation--prerequisites)
   - [4.2 Cloning the Project](#42-cloning-the-project)
   - [4.3 Configuring Production Environment Variables](#43-configuring-production-environment-variables)
   - [4.4 Backend Setup & PM2 Process Manager](#44-backend-setup--pm2-process-manager)
   - [4.5 Building the Frontend for Production](#45-building-the-frontend-for-production)
   - [4.6 Nginx Web Server & Reverse Proxy Configuration](#46-nginx-web-server--reverse-proxy-configuration)
   - [4.7 Free SSL Certificate (Let's Encrypt / Certbot)](#47-free-ssl-certificate-lets-encrypt--certbot)
   - [4.8 File Upload Permissions](#48-file-upload-permissions)
   - [4.9 Payment Gateway (Razorpay Live Mode) Checklist](#49-payment-gateway-razorpay-live-mode-checklist)
5. [Maintenance & Useful Commands](#5-maintenance--useful-commands)
6. [Troubleshooting FAQ](#6-troubleshooting-faq)

---

## 1. Project Overview & Architecture

The application is structured into two main layers:
- **Frontend**: Single Page Application built with **React 19**, **Vite**, **Tailwind CSS v4**, **Recharts**, and **Socket.IO Client**.
- **Backend**: RESTful API & WebSocket server built with **Node.js**, **Express 5**, **MongoDB (Mongoose)**, **Socket.IO**, and **node-cron**.

```
real-estate-main/
├── backend/                  # Node.js + Express API server
│   ├── config/               # Database connection & configurations
│   ├── controllers/          # Business logic (Dashboard, Properties, Payments, Chat, etc.)
│   ├── cron/                 # Automated background jobs (Subscription expiry)
│   ├── middleware/           # Authentication & RBAC middleware
│   ├── models/               # MongoDB Mongoose models
│   ├── routes/               # API endpoint definitions
│   ├── scripts/              # Seeders and migration scripts
│   ├── sockets/              # Socket.IO real-time chat handlers
│   ├── uploads/              # Local storage for user avatars & property photos
│   ├── .env                  # Backend environment variables
│   ├── package.json          # Backend package dependencies
│   └── server.js             # Entry point for backend
├── src/                      # React frontend source code
│   ├── components/           # UI components (Dashboard, Chat widgets, Headers, Forms)
│   ├── layouts/              # Dashboard and Public layouts
│   ├── pages/                # Route pages (Home, Properties, Pricing, Dashboard, Chat)
│   ├── config.js             # API base URL configuration
│   └── main.jsx              # Frontend React entry
├── package.json              # Frontend package dependencies
└── vite.config.js            # Vite build configuration
```

---

## 2. Prerequisites & System Requirements

Before running the application, ensure the following software is installed on your machine or server:

| Software | Recommended Version | Download / Installation Link |
| :--- | :--- | :--- |
| **Node.js** | `v18.x` or `v20.x` (LTS) | [https://nodejs.org](https://nodejs.org) |
| **npm** | `v9.x` or higher | Included with Node.js |
| **MongoDB** | `v6.x` or `v7.x` (or MongoDB Atlas Cloud) | [https://www.mongodb.com](https://www.mongodb.com) |
| **Git** | Latest | [https://git-scm.com](https://git-scm.com) |

> **Verify installations via terminal:**
> ```bash
> node -v
> npm -v
> mongod --version   # (If running MongoDB locally)
> ```

---

## 3. Local Development Setup

### 3.1 Environment Variables Configuration

The project requires environment files for both the backend and frontend.

#### 1. Backend Environment File (`backend/.env`)
Create or verify the file `backend/.env`:

```env
# Server Port
PORT=3001

# MongoDB Connection String (Local instance or MongoDB Atlas)
MONGO_URI=mongodb://localhost:27017/real_estate

# JWT Authentication Secret Key (Replace with a random 32+ character string)
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Default Super Admin Account (Auto-created on first server boot)
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=Admin@123

# Frontend URL (Used for CORS and email links)
FRONTEND_URL=http://localhost:5173

# Google OAuth Client ID (Optional: For Google Sign-in)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Razorpay Payment Gateway (Test Mode Keys)
RAZORPAY_KEY_ID=rzp_test_Ts4SevsBahiMk4
RAZORPAY_KEY_SECRET=PiItTDyzlLJSnv3VzvvPGfhA

# SMTP Email Settings (Optional: For automated expiry & alert emails)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

#### 2. Frontend Environment File (`.env`)
Create an `.env` file in the root project folder:

```env
# Backend API Base URL
VITE_API_URL=http://localhost:3001
```

---

### 3.2 Installing Dependencies

Open a terminal and install dependencies for both the frontend and backend:

#### 1. Install Root (Frontend) Dependencies:
```bash
npm install
```

#### 2. Install Backend Dependencies:
```bash
cd backend
npm install
cd ..
```

---

### 3.3 Database Setup

#### Option A: Local MongoDB
1. Ensure your local MongoDB service is running:
   - **Windows**: Start the MongoDB service from `services.msc` or run `net start MongoDB`.
   - **Linux/macOS**: `sudo systemctl start mongod` or `brew services start mongodb-community`.
2. The database `real_estate` will be automatically initialized when the backend connects.

#### Option B: MongoDB Atlas (Cloud Database)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Go to **Database Access** → create a database user and password.
3. Go to **Network Access** → add IP `0.0.0.0/0` (allow access from anywhere) or your specific IP.
4. Copy the connection string and update `MONGO_URI` in `backend/.env`:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/real_estate?retryWrites=true&w=majority
   ```

---

### 3.4 Database Seeders & Migrations

The platform includes both **automatic** startup seeders and **manual** dataset seeders.

#### 1. Automatic Seeders (Run automatically on `node server.js`):
Every time the backend starts, it automatically executes:
- **Super Admin Auto-Creation**: Checks if the admin specified in `ADMIN_EMAIL` exists; if not, creates the account with hashed password.
- **Default System Roles**: Upserts the three core roles: `superadmin`, `seller`, and `buyer` with appropriate permissions.
- **Subscription Packages**: Upserts default listing tiers:
  - `Basic (Free)`: 30-Day Listing, 1 Property.
  - `Standard (Verified)`: 60-Day Listing, 2x Visibility Boost, 3 Listings.
  - `Premium (Gold)`: 90-Day Listing, 5x Visibility Boost, 6 Listings.

#### 2. Manual Seeders (Optional data initialization):
To populate countries, states, and cities for property search filters, run:

```bash
cd backend
npm run seed:locations
cd ..
```
*(This loads verified geographic location data for India, USA, UK, UAE, and Canada).*

To manually re-sync fixed RBAC roles:
```bash
cd backend
npm run seed:roles
cd ..
```

---

### 3.5 Background Cron Jobs

The backend includes an automated daily cron job (`backend/cron/subscriptionCron.js`) powered by `node-cron`.

- **Schedule**: Runs automatically **every night at midnight (`00:00:00`)**.
- **Responsibilities**:
  1. Identifies all seller subscriptions whose `expiryDate` is in the past.
  2. Updates subscription status from `active` → `expired`.
  3. Dispatches automated expiry notification emails to affected sellers.
- **How to verify**:
  When starting the server, you will see the console log:
  `📅 Subscription expiry cron job scheduled (daily at midnight)`

---

### 3.6 Running the Application

For local development, run the backend and frontend in separate terminal windows:

#### Terminal 1 — Start Backend Server:
```bash
cd backend
npm start
```
*(Or use `node server.js`). Server runs on **`http://localhost:3001`**.*

#### Terminal 2 — Start Frontend Application:
```bash
npm run dev
```
*Frontend runs on **`http://localhost:5173`**.*

---

### 3.7 Default Admin Login

Open your browser and navigate to **`http://localhost:5173/login`**:

- **Email**: `admin@gmail.com`
- **Password**: `Admin@123`
- **Role**: Super Admin

Once logged in, click **Dashboard** in the top navigation or sidebar to access platform analytics, revenue summaries, subscription management, user administration, and downloadable PDF invoices.

---

## 4. Production Deployment Guide (Linux / Ubuntu VPS)

This section guides you through deploying the application to an Ubuntu server (AWS EC2, DigitalOcean, Linode, or any VPS) with **PM2**, **Nginx**, and **Let's Encrypt SSL**.

### 4.1 Server Preparation & Prerequisites

Connect to your server via SSH and update package repositories:

```bash
sudo apt update && sudo apt upgrade -y
```

Install Node.js (v20 LTS), Git, Nginx, and build essentials:

```bash
# Install Node.js 20.x LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# Install PM2 Process Manager globally
sudo npm install -g pm2

# Verify versions
node -v
npm -v
pm2 -v
nginx -v
```

---

### 4.2 Cloning the Project

Create a web directory and clone your repository:

```bash
sudo mkdir -p /var/www/real-estate
sudo chown -R $USER:$USER /var/www/real-estate

cd /var/www/real-estate
git clone <YOUR_GIT_REPOSITORY_URL> .
```

---

### 4.3 Configuring Production Environment Variables

#### 1. Production Backend `.env`
Create `/var/www/real-estate/backend/.env`:

```bash
nano /var/www/real-estate/backend/.env
```

Paste your production configuration:

```env
PORT=3001
MONGO_URI=mongodb+srv://<db_user>:<db_password>@cluster0.mongodb.net/real_estate_prod?retryWrites=true&w=majority
JWT_SECRET=your_super_strong_random_secret_string_minimum_32_chars

ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourStrongAdminPassword123!

FRONTEND_URL=https://yourdomain.com

# Razorpay LIVE credentials
RAZORPAY_KEY_ID=rzp_live_YourLiveKeyIdHere
RAZORPAY_KEY_SECRET=YourLiveKeySecretHere

# Email Notifications (Gmail or SendGrid)
EMAIL_USER=notifications@yourdomain.com
EMAIL_PASS=your_email_app_password
```

#### 2. Production Frontend `.env`
Create `/var/www/real-estate/.env`:

```bash
nano /var/www/real-estate/.env
```

Add your production API URL:

```env
VITE_API_URL=https://yourdomain.com
```

---

### 4.4 Backend Setup & PM2 Process Manager

1. Install backend packages and run seeders:
   ```bash
   cd /var/www/real-estate/backend
   npm install --production=false
   
   # Seed roles and locations
   npm run seed:roles
   npm run seed:locations
   ```

2. Start the backend with **PM2**:
   ```bash
   pm2 start server.js --name "real-estate-api"
   ```

3. Configure PM2 to restart automatically on system reboots:
   ```bash
   pm2 startup
   # (Copy and run the command printed in terminal by pm2 startup, if any)
   pm2 save
   ```

4. Verify backend status:
   ```bash
   pm2 status
   pm2 logs real-estate-api --lines 20
   ```

---

### 4.5 Building the Frontend for Production

Compile the Vite React frontend into optimized static files:

```bash
cd /var/www/real-estate
npm install
npm run build
```

This creates the production-ready distribution folder at `/var/www/real-estate/dist`.

---

### 4.6 Nginx Web Server & Reverse Proxy Configuration

Configure Nginx to serve the frontend, reverse-proxy API calls, support Socket.IO WebSockets, and serve uploaded files.

Create a new Nginx server configuration:

```bash
sudo nano /etc/nginx/sites-available/real-estate
```

Paste the following Nginx configuration (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Maximum file upload size for property images
    client_max_body_size 50M;

    # 1. Frontend: Serve Static React App
    root /var/www/real-estate/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 2. Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 3. Socket.IO Real-time Chat WebSocket Proxy
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 4. Uploaded Files (Photos, Logos, Avatars)
    location /uploads/ {
        alias /var/www/real-estate/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

Enable the configuration and test Nginx:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/real-estate /etc/nginx/sites-enabled/

# Remove default Nginx site (if present)
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration syntax
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

### 4.7 Free SSL Certificate (Let's Encrypt / Certbot)

Install Certbot and obtain an SSL certificate:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

- Follow the prompt to enter your email and agree to the Terms of Service.
- Certbot will automatically configure SSL inside your Nginx configuration and set up automatic renewal.

Verify SSL auto-renewal:
```bash
sudo certbot renew --dry-run
```

---

### 4.8 File Upload Permissions

Ensure the `backend/uploads` directory exists and has proper permissions so users can upload property images and avatars:

```bash
mkdir -p /var/www/real-estate/backend/uploads
chmod -R 775 /var/www/real-estate/backend/uploads
```

---

### 4.9 Payment Gateway (Razorpay Live Mode) Checklist

When transitioning from testing to real payments:
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Toggle the switch in header from **Test Mode** to **Live Mode**.
3. Generate **Live API Keys** (`Key Id` and `Key Secret`).
4. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`.
5. Restart backend process: `pm2 restart real-estate-api`.

---

## 5. Maintenance & Useful Commands

| Task | Command |
| :--- | :--- |
| **Check Backend Status** | `pm2 status` |
| **View Live Backend Logs** | `pm2 logs real-estate-api` |
| **Restart Backend** | `pm2 restart real-estate-api` |
| **Stop Backend** | `pm2 stop real-estate-api` |
| **Test Nginx Config** | `sudo nginx -t` |
| **Restart Nginx** | `sudo systemctl restart nginx` |
| **Pull Latest Code & Rebuild** | `git pull && npm run build && pm2 restart real-estate-api` |

---

## 6. Troubleshooting FAQ

#### Q1: "Cannot connect to MongoDB" on startup
- Check if your IP is whitelisted in MongoDB Atlas under **Network Access**.
- If using local MongoDB, ensure service is running: `sudo systemctl status mongod`.

#### Q2: Chat messages don't update in real time
- Verify Socket.IO connection in browser console (`F12 → Console`).
- Ensure Nginx has `/socket.io/` proxy block with `Upgrade` and `Connection` headers configured as shown in section 4.6.

#### Q3: Uploaded property images return 404
- Verify permissions: `chmod -R 775 /var/www/real-estate/backend/uploads`.
- Ensure Nginx `location /uploads/` points to the absolute path of `backend/uploads/`.

#### Q4: Subscriptions didn't expire automatically
- The cron job runs daily at `00:00:00` server time. Verify server time with `date`.
- You can check PM2 logs for cron execution: `pm2 logs real-estate-api | grep -i cron`.

