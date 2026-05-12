require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const server = http.createServer(app);

// ✅ Trust the proxy so req.secure and x-forwarded-proto work correctly
// This is required for dev tunnels, ngrok, and production reverse proxies
app.set('trust proxy', 1);


const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://mv4cjrhd-5173.asse.devtunnels.ms',
  'https://mv4cjrhd-8000.asse.devtunnels.ms',
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // ✅ Allow ALL devtunnels subdomains dynamically
    // so you don't have to update this every time tunnel restarts
    if (origin.endsWith('.devtunnels.ms')) {
      return callback(null, true);
    }

    console.warn('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // 🔥 Required for cookies to be sent cross-origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      if (origin.endsWith('.devtunnels.ms')) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// ✅ Make io accessible in all route files
app.set('io', io);

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes          = require('./route/auth');
const messengerRoutes     = require('./route/messenger');
const dashboardRoutes     = require('./route/dashboard');
const sleepRoutes         = require('./route/sleep');
const logsRoutes          = require('./route/logs');
const analyticsRoutes     = require('./route/analytics');
const plansRoutes         = require('./route/plans');
const profileRoutes       = require('./route/profile');
const aiRoutes            = require('./route/ai');
const atelierRoutes       = require('./route/atelier');
const foodLogs            = require('./route/foodLogs');
const dailyNutrition      = require('./route/dailyNutrition');
const bmiRoutes           = require('./route/bmi');
const clinicalRoutes      = require('./route/clinic');
const activityRoutes      = require('./route/activity');
const securityRoutes      = require('./route/security');
const notificationRoutes  = require('./route/notification');
const sessionRoutes       = require('./route/session');
const coachRoutes         = require('./route/coach');
const workoutLogRoutes    = require('./route/workoutLogs');
const forgotPasswordRoutes = require('./route/forgotpassword');

app.use('/api/bmi',              bmiRoutes);
app.use('/api/auth',             authRoutes);
app.use('/api',                  messengerRoutes);
app.use('/api',                  dashboardRoutes);
app.use('/api/sleep',            sleepRoutes);
app.use('/api/logs',             logsRoutes);
app.use('/api/analytics',        analyticsRoutes);
app.use('/api/plans',            plansRoutes);
app.use('/api/profile',          profileRoutes);
app.use('/api',                  aiRoutes);
app.use('/api/atelier',          atelierRoutes);
app.use('/api/food-logs',        foodLogs);
app.use('/api/nutrition',        dailyNutrition);
app.use('/api/clinic',           clinicalRoutes);
app.use('/api/activity',         activityRoutes);
app.use('/api/security',         securityRoutes);
app.use('/api/notifications',    notificationRoutes);
app.use('/api/workout-sessions', sessionRoutes);
app.use('/api/coach',            coachRoutes);
app.use('/api/workout-logs',     workoutLogRoutes);
app.use('/api/forgot-password',  forgotPasswordRoutes);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
require('./socket/socketHandler')(io);

server.listen(process.env.PORT || 8000, () => {
  console.log(`Vitalis Backend Engine Running on Port ${process.env.PORT || 8000}`);
});