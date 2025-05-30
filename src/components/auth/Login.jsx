import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Alert,
  CircularProgress,
  Fade,
  Grow,
} from "@mui/material";
import { Google as GoogleIcon, BusinessCenter } from "@mui/icons-material";
import useAuth from "../../hooks/useAuth";

const Login = () => {
  const { currentUser, login, loading, error } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await login();
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #8B7EC8 0%, #E6E6FA 50%, #F0F0FF 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Fade in={true} timeout={1000}>
          <Card
            sx={{
              maxWidth: 450,
              margin: "0 auto",
              borderRadius: 4,
              boxShadow: "0 20px 60px rgba(139, 126, 200, 0.2)",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(139, 126, 200, 0.1)",
            }}
          >
            <CardContent sx={{ p: 6 }}>
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <Grow in={true} timeout={1200}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #8B7EC8, #B5A9D6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 24px",
                      boxShadow: "0 10px 30px rgba(139, 126, 200, 0.3)",
                    }}
                  >
                    <BusinessCenter sx={{ fontSize: 40, color: "white" }} />
                  </Box>
                </Grow>
                <Typography
                  variant="h3"
                  component="h1"
                  gutterBottom
                  sx={{
                    background: "linear-gradient(135deg, #8B7EC8, #6B5B95)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  Project Manager
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 4, fontSize: "1.1rem", lineHeight: 1.6 }}
                >
                  Streamline your projects, manage tasks efficiently, and
                  collaborate with your team seamlessly.
                </Typography>
              </Box>
              {error && (
                <Fade in={true}>
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                      "& .MuiAlert-message": {
                        fontSize: "0.95rem",
                      },
                    }}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleGoogleLogin}
                disabled={loading || isLoggingIn}
                startIcon={
                  isLoggingIn ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <GoogleIcon />
                  )
                }
                sx={{
                  py: 2,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  borderRadius: 3,
                  textTransform: "none",
                  background:
                    "linear-gradient(135deg, #8B7EC8 0%, #B5A9D6 100%)",
                  boxShadow: "0 8px 25px rgba(139, 126, 200, 0.3)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #6B5B95 0%, #8B7EC8 100%)",
                    boxShadow: "0 12px 35px rgba(139, 126, 200, 0.4)",
                    transform: "translateY(-2px)",
                  },
                  "&:disabled": {
                    background: "rgba(139, 126, 200, 0.6)",
                    color: "white",
                  },
                  transition: "all 0.3s ease-in-out",
                }}
              >
                {isLoggingIn ? "Signing in..." : "Continue with Google"}
              </Button>
              <Box sx={{ mt: 4, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Secure authentication powered by Google
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Fade>
        <Fade in={true} timeout={1500}>
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              © 2025 Project Management System. Built with Modern Technologies.
            </Typography>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;
