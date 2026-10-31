// components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../useAuth';

export default function ProtectedRoute() {
  const { accessToken } = useAuth();

  // If there's no access token in state, redirect to signup page
  if (!accessToken) {
    return <Navigate to="/auth" replace />;
  }

  // Otherwise, render the children routes smoothly
  return <Outlet />;
}
