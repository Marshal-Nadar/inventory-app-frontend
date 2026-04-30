import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppSelector";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to='/login' replace />;
};
