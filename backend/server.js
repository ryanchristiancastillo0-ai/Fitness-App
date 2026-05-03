require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", 
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// ✅ Make io accessible in all route files
app.set('io', io);

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes       = require('./route/auth');
const messengerRoutes  = require('./route/messenger');
const dashboardRoutes  = require('./route/dashboard');
const sleepRoutes      = require('./route/sleep');
const logsRoutes       = require('./route/logs');
const analyticsRoutes  = require('./route/analytics');
const plansRoutes      = require('./route/plans');
const profileRoutes    = require('./route/profile');
const aiRoutes         = require('./route/ai');
const atelierRoutes    = require('./route/atelier');
const foodLogs         = require('./route/foodLogs');
const dailyNutrition   = require('./route/dailyNutrition');
const bmiRoutes        = require('./route/bmi');
const clinicalRoutes    = require('./route/clinic')
const activityRoutes    = require('./route/activity')
const securityRoutes = require('./route/security')

app.use('/api/bmi',       bmiRoutes);
app.use('/api/auth',      authRoutes);
app.use('/api',           messengerRoutes);
app.use('/api',           dashboardRoutes);
app.use('/api/sleep',     sleepRoutes);
app.use('/api/logs',      logsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/plans',     plansRoutes);
app.use('/api/profile',   profileRoutes);
app.use('/api',           aiRoutes);
app.use('/api/atelier',   atelierRoutes);
app.use('/api/food-logs', foodLogs);
app.use('/api/nutrition', dailyNutrition);
app.use('/api/clinic', clinicalRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/security', securityRoutes)


// ─── Socket.IO ────────────────────────────────────────────────────────────────
require('./socket/socketHandler')(io);

server.listen(process.env.PORT || 8000, () => {
    console.log(`Vitalis Backend Engine Running on Port ${process.env.PORT || 8000}`);
});