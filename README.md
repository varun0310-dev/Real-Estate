# 🏢 Real Estate Platform

A full-stack, enterprise-grade Real Estate Marketplace and Property Management solution built with **React 19**, **Vite**, **Node.js**, **Express**, **MongoDB**, **Socket.IO**, and **Razorpay**.

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18.x or v20.x LTS
- **MongoDB**: Local MongoDB or MongoDB Atlas
- **Git**

### 2. Installation
```bash
# Clone the repository
git clone <repository-url>
cd real-estate-main

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Variables
- Copy/create `backend/.env` (see detailed template in [SETUP_AND_DEPLOYMENT_GUIDE.md](./SETUP_AND_DEPLOYMENT_GUIDE.md))
- Copy/create `.env` in root for frontend:
  ```env
  VITE_API_URL=http://localhost:3001
  ```

### 4. Run Seeders (Optional data initialization)
```bash
cd backend
npm run seed:roles       # Seed RBAC permissions & default roles
npm run seed:locations   # Seed Countries, States & Cities
cd ..
```
*(Super Admin, system roles, and subscription packages are also auto-created on first server boot).*

### 5. Start the Application
Open two terminals:

```bash
# Terminal 1 - Backend (runs on http://localhost:3001)
cd backend
npm start

# Terminal 2 - Frontend (runs on http://localhost:5173)
npm run dev
```

### 6. Default Super Admin Login
- **URL**: `http://localhost:5173/login`
- **Email**: `admin@gmail.com`
- **Password**: `Admin@123`

---

## 📖 Complete Client & Deployment Guide

For full setup details, database configuration, cron jobs, seeders, and step-by-step production server deployment instructions (Ubuntu, Nginx, PM2, Let's Encrypt SSL, and Razorpay Live setup), read:

👉 **[SETUP_AND_DEPLOYMENT_GUIDE.md](./SETUP_AND_DEPLOYMENT_GUIDE.md)**

---

## 🚀 Key Features

- **Role-Tailored Dashboards**: Distinct, customized dashboard hubs for **Super Admin**, **Seller**, and **Buyer**.
- **Real-Time Messaging**: WebSocket (Socket.IO) buyer-seller chat with message history, unread counters, and typing indicators.
- **Subscription & Invoicing**: Automated subscription tiers (Basic, Standard, Premium) with Razorpay integration, coupon discounts, and instant 1-click **PDF Invoice Downloads**.
- **Automated Cron Jobs**: Background daily subscription expiry and notification engine.
- **Property Management**: Multi-image uploads, geo-location mapping, approval workflows, and advanced filter discovery.
- **Role-Based Access Control (RBAC)**: Fine-grained permission system protecting administrative routes and actions.
