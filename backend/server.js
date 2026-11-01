const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load .env
dotenv.config();

// Connect to MongoDB
// Initialize DB and then start the app
(async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Seed default roles and package settings after connection is ready
    const { seedDefaultRoles } = require('./controllers/roleController');
    const { seedPackageSettings } = require('./controllers/packageSettingsController');
    await seedDefaultRoles();
    await seedPackageSettings();

    // Start subscription expiry cron
    const { startSubscriptionCron } = require('./cron/subscriptionCron');
    startSubscriptionCron();

    // Start the HTTP server
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('🚨 Server startup error:', err);
    process.exit(1);
  }
})();

// Create app and server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps, curl, postman) or localhost/vite dev servers
            if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === process.env.FRONTEND_URL) {
                callback(null, true);
            } else {
                callback(null, true);
            }
        },
        methods: ["GET", "POST", "PATCH", "DELETE"],
        credentials: true
    }
});

app.set('io', io);

const { initializeChatSocket } = require('./sockets/chat.socket');
initializeChatSocket(io);

// Middleware
app.use(cors());
app.use(express.json());

// Serve images from uploads folder
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api', require('./routes/contactRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/amenities', require('./routes/amenityRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/package-settings', require('./routes/packageSettingsRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
console.log('Coupon & payment routes registered');
console.log('Amenity routes registered');
console.log('Category routes registered');
console.log('Settings routes registered');
console.log('Role & Admin routes registered');

// Seed default roles
// Seeding moved to async init above

// Start subscription expiry cron
// Server startup handled in async IIFE above
