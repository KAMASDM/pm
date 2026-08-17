import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const RoleRoute = ({ allowedRoles, children }) => {
  const { userRole, mustChangePassword } = useAuth();
  const location = useLocation();

  if (mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    const destination = userRole === "client" ? "/client/dashboard" : "/dashboard";
    return <Navigate to={destination} replace />;
  }

  return children;
};

export default RoleRoute;
