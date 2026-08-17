// src/components/clients/ClientManager.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Add, Delete, Email, ContentCopy, CheckCircle, Key } from "@mui/icons-material";
import { stringToColor } from "../../helpers/stringToColor";

const ClientManager = ({ clients = [], onAddClient, onRemoveClient, onResetClient }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    company: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const handleOpenDialog = () => {
    setClientForm({ name: "", email: "", company: "" });
    setError("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setClientForm({ name: "", email: "", company: "" });
    setError("");
  };

  const handleAddClient = async () => {
    // Validation
    if (!clientForm.email || !clientForm.email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!clientForm.name) {
      setError("Please enter the client's name");
      return;
    }

    // Check if client already exists
    if (
      clients.some(
        (client) => client.email?.toLowerCase() === clientForm.email.toLowerCase()
      )
    ) {
      setError("This client is already added to the project");
      return;
    }

    const newClient = {
      name: clientForm.name,
      email: clientForm.email.toLowerCase(),
      company: clientForm.company,
      role: "client",
      addedAt: new Date().toISOString(),
    };

    setSaving(true);
    setError("");
    try {
      const access = await onAddClient(newClient);
      setCredentials({ ...newClient, ...access });
      handleCloseDialog();
    } catch (saveError) {
      setError(saveError.message || "The client account could not be created.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box>
          <Typography variant="h6">Client access</Typography>
          <Typography variant="body2" color="text.secondary">
            Create a private Client ID and temporary password for this project.
          </Typography>
        </Box>
        <Button
          startIcon={<Add />}
          variant="outlined"
          size="small"
          onClick={handleOpenDialog}
          sx={{ textTransform: "none" }}
        >
          Create client login
        </Button>
      </Box>

      {clients.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No client logins yet. Create one to give a client private access to this project's progress.
        </Alert>
      ) : (
        <List>
          {clients.map((client) => (
            <ListItem
              key={client.id || client.email}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                mb: 1,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: stringToColor(client.name || client.email),
                  mr: 2,
                }}
              >
                {(client.name || client.email).charAt(0).toUpperCase()}
              </Avatar>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body1" fontWeight={500}>
                      {client.name}
                    </Typography>
                    <Chip label="Client" size="small" color="primary" />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      <Email fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />
                      {client.email || client.clientId || "Portal client"}
                    </Typography>
                    {client.company && (
                      <Typography variant="caption" color="text.secondary">
                        {client.company}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                {client.uid && onResetClient && (
                  <IconButton
                    edge="end"
                    aria-label={`Reset access for ${client.name}`}
                    title="Reset temporary password"
                    onClick={async () => {
                      try {
                        const access = await onResetClient(client);
                        setCredentials({ ...client, ...access });
                      } catch (resetError) {
                        setError(resetError.message || "Access could not be reset.");
                      }
                    }}
                    color="primary"
                    sx={{ mr: 0.5 }}
                  >
                    <Key />
                  </IconButton>
                )}
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => onRemoveClient(client.id || client.email)}
                  color="error"
                >
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* Add Client Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create client login</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Client Name"
              value={clientForm.name}
              onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={clientForm.email}
              onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
              margin="normal"
              required
              helperText="Used for access notifications. The generated Client ID is used to sign in."
            />
            <TextField
              fullWidth
              label="Company (Optional)"
              value={clientForm.company}
              onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAddClient} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : "Generate credentials"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={Boolean(credentials)} onClose={() => setCredentials(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CheckCircle color="success" /> Client access created
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Copy the temporary password now. It will not be shown again.
          </Alert>
          <TextField
            fullWidth
            label="Client ID"
            value={credentials?.clientId || ""}
            InputProps={{ readOnly: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={credentials?.temporaryPassword ? "Temporary password" : "Account status"}
            value={credentials?.temporaryPassword || "Existing client account linked"}
            InputProps={{
              readOnly: true,
              endAdornment: credentials?.temporaryPassword ? (
                <IconButton
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `Client ID: ${credentials.clientId}\nTemporary password: ${credentials.temporaryPassword}`
                    )
                  }
                >
                  <ContentCopy />
                </IconButton>
              ) : null,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setCredentials(null)}>Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientManager;
