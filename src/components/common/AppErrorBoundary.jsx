import React from "react";
import { Alert, Box, Button, Paper, Typography } from "@mui/material";
import { ErrorOutline, Refresh } from "@mui/icons-material";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, details) {
    console.error("Application error boundary:", error, details);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3, bgcolor: "#f7f6fb" }}>
        <Paper sx={{ maxWidth: 560, p: 5, textAlign: "center" }}>
          <ErrorOutline color="error" sx={{ fontSize: 54, mb: 2 }} />
          <Typography variant="h4" gutterBottom>That view hit a snag</Typography>
          <Alert severity="error" sx={{ my: 2, textAlign: "left" }}>
            Your data is safe. Refresh the workspace to recover this view.
          </Alert>
          <Button variant="contained" startIcon={<Refresh />} onClick={() => window.location.reload()}>
            Refresh workspace
          </Button>
        </Paper>
      </Box>
    );
  }
}

export default AppErrorBoundary;
