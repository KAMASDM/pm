import React from "react";
import { Box, Button, Chip, Paper, Typography } from "@mui/material";
import { LockPerson, Logout } from "@mui/icons-material";
import useAuth from "../../hooks/useAuth";

const AccessDenied = () => {
  const { currentUser, logout } = useAuth();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 3,
        background:
          "radial-gradient(circle at 10% 20%, rgba(139,126,200,.25), transparent 35%), #f8f7fc",
      }}
    >
      <Paper sx={{ maxWidth: 560, p: { xs: 4, md: 6 }, textAlign: "center" }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: 3,
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(107,91,149,.1)",
            color: "primary.main",
            mx: "auto",
            mb: 3,
          }}
        >
          <LockPerson sx={{ fontSize: 38 }} />
        </Box>
        <Chip label="Access pending" color="warning" sx={{ mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Your account needs workspace access
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {currentUser?.email} is authenticated, but it has not been assigned a
          production role. Ask a workspace administrator to activate this account.
        </Typography>
        <Button startIcon={<Logout />} variant="outlined" onClick={logout}>
          Sign out
        </Button>
      </Paper>
    </Box>
  );
};

export default AccessDenied;
