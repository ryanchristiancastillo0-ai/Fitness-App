import { Route, Routes, Navigate } from "react-router-dom";
import Dashboard from "./features/Dashboard/pages/Dashboard";
import Plans from "./features/Plan/pages/Plans";
import Analytics from "./features/Analytics/pages/Analytics";
import CameraWorkout from "./features/CameraWorkout/pages/CameraWorkout";
import Log from "./features/Log/pages/Log";

// Middleware
import { ProtectedRoute, PublicRoute } from "./hooks/useMiddleware";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import NutritionTracker from "./features/MealTracker/pages/MealTreacker";

import BMI from "./features/BMI/pages/BMI";

import VirtualClinic from "./features/Coach/pages/virtual-clinic";
import Profile from "./features/Profile/pages/Profile";
import {  NotificationProvider } from './context/NotificationSystem';
import ActivityMap from "./features/ActivityMap/pages/ActivityMap";
import Register from "./features/Auth/Register/pages/Register";
import Login from "./features/Auth/Login/pages/Login";
import ClinicalMessenger from "./features/Social/pages/Social";
import ForgotPassword from './features/Auth/Forgot-password/pages/ForgotPassword';

export default function App() {
  return (
    <div className="w-auto min-h-screen">
      <AuthProvider>
       <NotificationProvider>
         <RoutesHandler />
       </NotificationProvider>
      </AuthProvider>
    </div>
  );
}

function RoutesHandler() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        }
      />

      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* DASHBOARD (BASE) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* DASHBOARD CHILD ROUTES (ALL FIXED) */}
      <Route
        path="/dashboard/messenger"
        element={
          <ProtectedRoute>
            <ClinicalMessenger />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/plans"
        element={
          <ProtectedRoute>
            <Plans />
          </ProtectedRoute>
        }
      />

     <Route
        path="/dashboard/activity-map"
        element={
          <ProtectedRoute>
            <ActivityMap/>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />

  

      <Route
        path="/dashboard/workouts"
        element={
          <ProtectedRoute>
            <CameraWorkout />
          </ProtectedRoute>
        }
      />

  

  

      <Route
        path="/dashboard/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/logs"
        element={
          <ProtectedRoute>
            <Log />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/meal-tracker"
        element={
          <ProtectedRoute>
            <NutritionTracker/>
          </ProtectedRoute>
        }
      />

      
      <Route
        path="/reset-password"
        element={
         
            <ForgotPassword/>
    
        }
      />

       <Route
        path="/dashboard/live-coaching"
        element={
          <ProtectedRoute>
        <VirtualClinic/>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/bmi"
        element={
          <ProtectedRoute>
         <BMI/>
          </ProtectedRoute>
        }
      />

      

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}