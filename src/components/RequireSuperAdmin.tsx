import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (user?.role !== "SUPER_ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
