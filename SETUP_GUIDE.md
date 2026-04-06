# Real Estate Project Setup Guide

This guide provides step-by-step instructions to set up the Real Estate project locally, including the Backend (Node.js/Express), Frontend (React/Vite), and Database (MongoDB).

---

## 1. Prerequisites
Before you begin, ensure you have the following installed on your system:
*   **Node.js** (v18 or higher)
*   **npm** (comes with Node.js)
*   **MongoDB** (Local instance running on `mongodb://localhost:27017` or a MongoDB Atlas URI)

---

## 2. Backend Setup

### 2.1 Navigate to Backend Directory
Open your terminal and navigate to the `backend` folder:
```bash
cd backend
```

### 2.2 Install Dependencies
```bash
npm install
```

### 2.3 Environment Configuration
Create a `.env` file in the `backend` directory (if it doesn't already exist) and add the following:
```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/real_estate
JWT_SECRET=your_secret_key_here
ADMIN_EMAIL=superadmin@gmail.com
ADMIN_PASSWORD=Admin@123
```
*Note: The `superadmin` account is automatically created on the first server start using these credentials.*

### 2.4 Start the Backend Server
```bash
npm start
```
The server will start on `http://localhost:3001`. You should see `MongoDB Connected` in the console.

---

## 3. Frontend Setup

### 3.1 Navigate to Frontend Directory
Open a **new terminal** window and stay in the root project directory:
```bash
cd ..
# (or navigate to the root folder where package.json exists)
```

### 3.2 Install Dependencies
```bash
npm install
```

### 3.3 Configuration
Verify the `src/config.js` file points to your backend URL:
```javascript
export const API_URL = 'http://localhost:3001';
```

### 3.4 Start the Frontend Application
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## 4. Database Setup
The application uses **MongoDB**. 
*   Collections (Users, Properties, Categories, Amenities, Countries, States, Cities) are created automatically when the server runs.
*   **Initial Data:** You may need to add Countries, States, and Cities via the Admin Dashboard or a seed script to populate the dropdowns.

---

## 5. Administrative Access (Superadmin)
To manage the platform (Approve properties, add Categories/Amenities, etc.), log in with:
*   **Email:** `superadmin@gmail.com` (or as defined in your backend .env)
*   **Password:** `Admin@123`

---

## 6. Project Structure
*   `backend/`: Express.js server, Mongoose models, and Controllers.
*   `src/`: React source code.
    *   `src/components/`: Reusable UI components.
    *   `src/pages/`: Main page views.
    *   `src/assets/`: Images and styling assets.
*   `uploads/`: Local directory for property images and profile photos (auto-generated).

---

## 7. Troubleshooting
*   **CORS Issues:** Ensure `CORS` is enabled in `backend/server.js`.
*   **Connection Error:** Verify MongoDB service is running on your machine.
*   **Port Conflicts:** If port 3001 or 5173 is in use, you can change them in `.env` or `vite.config.js`.
