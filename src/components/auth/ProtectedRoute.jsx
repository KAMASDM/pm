import React from "react";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import useAuth from "../../hooks/useAuth";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #8B7EC8 0%, #E6E6FA 50%, #F0F0FF 100%)",
        }}
      >
        <CircularProgress
          size={60}
          thickness={4}
          sx={{
            color: "white",
            mb: 3,
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: "white",
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
          }}
        >
          Loading your workspace...
        </Typography>
      </Box>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
