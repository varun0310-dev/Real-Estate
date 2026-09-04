const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load .env
dotenv.config();

// Connect to MongoDB
connectDB();

// Create app and server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ["GET", "POST"],
        credentials: true
    }
});

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
console.log('Amenity routes registered');
console.log('Category routes registered');
console.log('Settings routes registered');
console.log('Role & Admin routes registered');

// Seed default roles
const { seedDefaultRoles } = require('./controllers/roleController');
seedDefaultRoles();

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
