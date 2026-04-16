import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "./AuthContext";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="page-status">Loading session...</div>;
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
