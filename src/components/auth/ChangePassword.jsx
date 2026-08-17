import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Key, Security } from "@mui/icons-material";
import { Navigate, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const ChangePassword = () => {
  const { changePassword, isClient, mustChangePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!mustChangePassword) {
    return <Navigate to={isClient ? "/client/dashboard" : "/dashboard"} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 12) {
      setError("Use at least 12 characters for your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await changePassword(password);
      navigate(isClient ? "/client/dashboard" : "/dashboard", { replace: true });
    } catch (changeError) {
      setError(changeError.message || "Your password could not be changed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 3,
        background:
          "linear-gradient(135deg, #241b3d 0%, #6B5B95 55%, #b7a8df 100%)",
      }}
    >
      <Paper component="form" onSubmit={handleSubmit} sx={{ width: "100%", maxWidth: 520, p: 5 }}>
        {saving && <LinearProgress sx={{ mx: -5, mt: -5, mb: 4 }} />}
        <Security color="primary" sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Secure your portal
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Your temporary password worked. Create a private password before entering
          your project workspace.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          fullWidth
          type="password"
          label="New password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          helperText="At least 12 characters"
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          type="password"
          label="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          sx={{ mb: 3 }}
        />
        <Button fullWidth type="submit" variant="contained" startIcon={<Key />} disabled={saving}>
          Save password and continue
        </Button>
      </Paper>
    </Box>
  );
};

export default ChangePassword;
