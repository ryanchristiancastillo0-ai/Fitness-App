import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";

// ✅ Blocks unauthorized users from reaching private pages
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// ✅ Blocks logged-in users from reaching Login/Register pages
export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};