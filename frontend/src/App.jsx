import { Route, Routes, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./features/Dashboard/pages/Dashboard";
import ClinicalMessenger from "./pages/Social";
import Plans from "./features/Plan/pages/Plans";
import Analytics from "./features/Analytics/pages/Analytics";
import Offline from "./pages/Offline";
import CameraWorkout from "./features/CameraWorkout/pages/CameraWorkout";
import Jogging from "./pages/Jogging";
import Log from "./pages/Log";
import Records from "./pages/Record";

// Middleware
import { ProtectedRoute, PublicRoute } from "./hooks/useMiddleware";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import NutritionTracker from "./features/MealTracker/pages/MealTreacker";

import BMI from "./pages/BMI";

import VirtualClinic from "./features/Coach/pages/virtual-clinic";
import ActivityMap from "./pages/ActivityMap";
import Profile from "./features/Profile/pages/Profile";
import {  NotificationProvider } from './context/NotificationSystem';

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
        path="/dashboard/offline"
        element={
          <ProtectedRoute>
            <Offline />
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
        path="/dashboard/jogging"
        element={
          <ProtectedRoute>
            <Jogging />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/records"
        element={
          <ProtectedRoute>
            <Records />
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