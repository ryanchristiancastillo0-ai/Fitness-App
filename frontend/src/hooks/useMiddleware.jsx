import { Navigate } from "react-router-dom";

// ✅ Blocks unauthorized users from reaching private pages
export const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// ✅ Blocks logged-in users from reaching Login/Register pages
export const PublicRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};