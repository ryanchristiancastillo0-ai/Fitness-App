import { Route, Routes, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ClinicalMessenger from "./pages/Social";
import Plans from "./pages/Plans";
import Analytics from "./pages/Analytics";
import Offline from "./pages/Offline";
import CameraWorkout from "./pages/CameraWorkout";
import Jogging from "./pages/Jogging";
import Profile from "./pages/Profile";
import Log from "./pages/Log";
import Records from "./pages/Record";

// Middleware
import { ProtectedRoute, PublicRoute } from "./hooks/useMiddleware";
import NutritionTracker from "./features/MealTracker/pages/MealTreacker";
import LiveCoaching from "./features/LiveCoaching/pages/LiveCoaching";

export default function App() {
  return (
    <div className="container">
      <RoutesHandler />
    </div>
  );
}

function RoutesHandler() {
  const token = localStorage.getItem("token");

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
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
          <LiveCoaching/>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}