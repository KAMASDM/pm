import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowForward,
  BusinessCenter,
  CheckCircle,
  Google as GoogleIcon,
  LockOutlined,
} from "@mui/icons-material";
import useAuth from "../../hooks/useAuth";

const Login = () => {
  const { currentUser, login, loginClient, loading, error } = useAuth();
  const [portal, setPortal] = useState("client");
  const [clientId, setClientId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (currentUser) return <Navigate to="/" replace />;

  const runLogin = async (action) => {
    setIsLoggingIn(true);
    try {
      await action();
    } catch {
      // AuthProvider exposes a user-friendly error message.
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleClientLogin = (event) => {
    event.preventDefault();
    runLogin(() => loginClient(clientId, password));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: 5,
        overflow: "hidden",
        position: "relative",
        background:
          "radial-gradient(circle at 15% 15%, rgba(181,169,214,.55), transparent 30%), radial-gradient(circle at 90% 80%, rgba(92,225,230,.2), transparent 35%), #f7f6fb",
        "&::before": {
          content: '""',
          position: "absolute",
          width: 460,
          height: 460,
          borderRadius: "50%",
          bgcolor: "rgba(107,91,149,.06)",
          top: -220,
          right: -100,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.08fr .92fr" },
            overflow: "hidden",
            border: "1px solid rgba(107,91,149,.1)",
            boxShadow: "0 30px 90px rgba(47,34,80,.16)",
          }}
        >
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              justifyContent: "space-between",
              p: 7,
              minHeight: 650,
              color: "white",
              background:
                "linear-gradient(145deg, rgba(31,24,54,.97), rgba(107,91,149,.96))",
            }}
          >
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 8 }}>
                <BusinessCenter />
                <Typography variant="h6" color="inherit">ASC-OS</Typography>
              </Box>
              <Chip
                label="Your work, beautifully clear"
                sx={{ color: "white", bgcolor: "rgba(255,255,255,.12)", mb: 3 }}
              />
              <Typography variant="h2" color="inherit" sx={{ fontSize: "3.2rem", lineHeight: 1.08, mb: 3 }}>
                From kickoff to impact, everyone stays aligned.
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,.72)", fontSize: "1.08rem", maxWidth: 520 }}>
                A private workspace where teams deliver and clients see progress,
                decisions, and momentum without the status-meeting noise.
              </Typography>
            </Box>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {["Private project access", "Live progress and milestones", "Instant push updates"].map((item) => (
                <Box key={item} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <CheckCircle sx={{ color: "#74e0c1", fontSize: 20 }} />
                  <Typography sx={{ color: "rgba(255,255,255,.86)" }}>{item}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ p: { xs: 3, sm: 6, md: 7 }, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1, mb: 4, color: "primary.main" }}>
              <BusinessCenter />
              <Typography variant="h6">ASC-OS</Typography>
            </Box>
            <Typography variant="h3" sx={{ mb: 1 }}>Welcome back</Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Choose the portal created for your role.
            </Typography>

            <Tabs
              value={portal}
              onChange={(_, value) => setPortal(value)}
              variant="fullWidth"
              sx={{ mb: 4, bgcolor: "rgba(107,91,149,.06)", borderRadius: 2, p: 0.5 }}
            >
              <Tab value="client" label="Client portal" />
              <Tab value="team" label="Team workspace" />
            </Tabs>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {portal === "client" ? (
              <Box component="form" onSubmit={handleClientLogin}>
                <TextField
                  fullWidth
                  label="Client ID"
                  placeholder="CL-7K4M2P9Q"
                  value={clientId}
                  onChange={(event) => setClientId(event.target.value.toUpperCase())}
                  autoComplete="username"
                  InputProps={{ startAdornment: <LockOutlined sx={{ mr: 1, color: "text.disabled" }} /> }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  sx={{ mb: 3 }}
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  endIcon={isLoggingIn ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
                  disabled={loading || isLoggingIn || !clientId.trim() || !password}
                >
                  Enter client portal
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 2 }}>
                  Your client ID and temporary password are provided by your project team.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={isLoggingIn ? <CircularProgress size={18} /> : <GoogleIcon />}
                  onClick={() => runLogin(login)}
                  disabled={loading || isLoggingIn}
                  sx={{ py: 1.5 }}
                >
                  Continue with Google
                </Button>
                <Alert severity="info" sx={{ mt: 3 }}>
                  Team access is invitation-only and verified against your workspace role.
                </Alert>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
