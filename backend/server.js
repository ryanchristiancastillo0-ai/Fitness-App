require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
// https://0p00rg61-5173.asse.devtunnels.ms
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", 
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
const foodLogs = require('./route/foodLogs');
const dailyNutrition = require('./route/dailyNutrition');
const bmiRoutes = require('./route/bmi');
app.use('/api/bmi', bmiRoutes);
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
app.use('api/activity', sleepRoutes)
app.use('/api/food-logs', foodLogs);
app.use('/api/nutrition', dailyNutrition);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
require('./socket/socketHandler')(io);

server.listen(process.env.PORT || 8000, () => {
    console.log(`Vitalis Backend Engine Running on Port ${process.env.PORT || 8000}`);
});