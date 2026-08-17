import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  Api,
  CheckCircle,
  Code,
  ContentCopy,
  Delete,
  Key,
  Sync,
  Terminal,
} from "@mui/icons-material";
import {
  createProjectApiKey,
  listProjectApiKeys,
  revokeProjectApiKey,
} from "../../services/firebase";

const hostedCliUrl = `${window.location.origin}/orbit-pm.mjs`;

const CodeBlock = ({ children, onCopy }) => (
  <Box sx={{ position: "relative" }}>
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 2.5,
        pr: 6,
        borderRadius: 2,
        bgcolor: "#171321",
        color: "#ebe7f5",
        overflowX: "auto",
        fontSize: 13,
        lineHeight: 1.65,
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
      }}
    >
      {children}
    </Box>
    <IconButton
      aria-label="Copy code"
      onClick={() => onCopy(children)}
      sx={{ position: "absolute", top: 8, right: 8, color: "#d8cfee" }}
    >
      <ContentCopy fontSize="small" />
    </IconButton>
  </Box>
);

const ApiIntegration = () => {
  const [keys, setKeys] = useState([]);
  const [endpoint, setEndpoint] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listProjectApiKeys();
      setKeys(result.keys || []);
      setEndpoint(result.endpoint || "");
    } catch (loadError) {
      setError(loadError.message || "API keys could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const copy = async (value) => {
    await navigator.clipboard.writeText(String(value));
    setToast("Copied to clipboard");
  };

  const createKey = async () => {
    if (!keyName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const result = await createProjectApiKey(keyName.trim());
      setCreatedKey(result);
      setEndpoint(result.endpoint || endpoint);
      setCreateOpen(false);
      setKeyName("");
      await loadKeys();
    } catch (createError) {
      setError(createError.message || "The API key could not be created.");
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (keyId) => {
    if (!window.confirm("Revoke this API key? Connected repositories will stop syncing immediately.")) return;
    try {
      await revokeProjectApiKey(keyId);
      await loadKeys();
    } catch (revokeError) {
      setError(revokeError.message || "The API key could not be revoked.");
    }
  };

  const bootstrapCommand = useMemo(
    () => `mkdir -p .orbit\ncurl -fsSL ${hostedCliUrl} -o .orbit/orbit-pm.mjs\nnode .orbit/orbit-pm.mjs init`,
    []
  );
  const syncCommand = "ORBIT_API_KEY=orbit_sk_... node .orbit/orbit-pm.mjs sync";
  const hookCommand = "node .orbit/orbit-pm.mjs install-hook";
  const commitExample = "git commit -m \"feat: finish authentication [done:AUTH-01]\"\ngit push";
  const requestExample = `${endpoint || "https://asia-south1-YOUR_PROJECT.cloudfunctions.net/projectSyncApi"}/v1/projects/sync`;

  return (
    <Box sx={{ pb: 6 }}>
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          color: "white",
          background: "linear-gradient(125deg, #171321 0%, #4f3f77 58%, #7968a6 100%)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={3}>
          <Box>
            <Chip label="Developer automation" sx={{ mb: 2, color: "white", bgcolor: "rgba(255,255,255,.13)" }} />
            <Typography variant="h3" color="inherit" gutterBottom>
              ASC-OS Project Sync API
            </Typography>
            <Typography sx={{ maxWidth: 720, color: "rgba(255,255,255,.74)" }}>
              Connect any VS Code repository, generate its project-management plan, and keep projects,
              milestones, tasks, clients, progress, and delivery status synchronized on every push.
            </Typography>
          </Box>
          <Api sx={{ fontSize: 76, opacity: 0.25, alignSelf: "center" }} />
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h5">API keys</Typography>
                  <Typography variant="body2">One key can connect multiple repositories.</Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
                  New key
                </Button>
              </Stack>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Store keys as environment secrets. Never commit them to Git.
              </Alert>
              {loading ? (
                <Box sx={{ py: 5, textAlign: "center" }}><CircularProgress /></Box>
              ) : (
                <List disablePadding>
                  {keys.map((apiKey, index) => (
                    <React.Fragment key={apiKey.id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        sx={{ px: 0, py: 2 }}
                        secondaryAction={apiKey.active ? (
                          <IconButton color="error" aria-label={`Revoke ${apiKey.name}`} onClick={() => revokeKey(apiKey.id)}>
                            <Delete />
                          </IconButton>
                        ) : null}
                      >
                        <Key sx={{ mr: 2, color: apiKey.active ? "primary.main" : "text.disabled" }} />
                        <ListItemText
                          primary={<Stack direction="row" gap={1} alignItems="center"><span>{apiKey.name}</span><Chip size="small" label={apiKey.active ? "Active" : "Revoked"} color={apiKey.active ? "success" : "default"} /></Stack>}
                          secondary={`${apiKey.prefix}… · Last used ${apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleString() : "never"}`}
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                  {!keys.length && <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>Create your first API key to connect a repository.</Typography>}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" gap={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Terminal color="primary" />
                <Typography variant="h5">Connect a repository</Typography>
              </Stack>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Run this once in the repository root. The initializer scans common project metadata and creates
                <code> .orbit/project.json</code> with a complete delivery lifecycle template.
              </Typography>
              <CodeBlock onCopy={copy}>{bootstrapCommand}</CodeBlock>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>First sync</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                First run <code>node .orbit/orbit-pm.mjs configure</code> and paste the key, or provide it only for this command:
              </Typography>
              <CodeBlock onCopy={copy}>{syncCommand}</CodeBlock>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>Sync automatically before every push</Typography>
              <CodeBlock onCopy={copy}>{hookCommand}</CodeBlock>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" gap={1.5} alignItems="center" sx={{ mb: 2 }}>
                <CheckCircle color="success" />
                <Typography variant="h5">Complete tasks from commits</Typography>
              </Stack>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Put a task’s external ID in the commit subject. The pre-push hook marks it complete locally,
                synchronizes ASC-OS, and recalculates project progress before Git pushes.
              </Typography>
              <CodeBlock onCopy={copy}>{commitExample}</CodeBlock>
              <Typography variant="body2" sx={{ mt: 2 }}>
                You can also run <code>node .orbit/orbit-pm.mjs complete AUTH-01</code> at any time.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" gap={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Sync color="primary" />
                <Typography variant="h5">REST endpoint</Typography>
              </Stack>
              <TextField
                fullWidth
                label="Project sync endpoint"
                value={requestExample}
                InputProps={{
                  readOnly: true,
                  endAdornment: <IconButton onClick={() => copy(requestExample)}><ContentCopy /></IconButton>,
                }}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Send <code>POST</code> with <code>Authorization: Bearer orbit_sk_...</code>. Sync is idempotent:
                stable external IDs update existing records instead of creating duplicates. Set <code>replace: true</code>
                to remove integration-managed tasks and milestones omitted from the next manifest.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" gap={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Code color="primary" />
                <Typography variant="h5">What the manifest controls</Typography>
              </Stack>
              <Grid container spacing={2}>
                {["Project name, description, status, priority, due date and repository", "Milestones with stable IDs, status and due dates", "Tasks, checklists, estimates, categories, priorities and assignee snapshots", "Client account provisioning and project membership", "Automatic progress and project-status calculation", "Merge-safe or replace-mode synchronization"].map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item}>
                    <Stack direction="row" gap={1} alignItems="flex-start"><CheckCircle color="success" fontSize="small" /><Typography variant="body2">{item}</Typography></Stack>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={createOpen} onClose={() => !creating && setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create API key</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Key name" placeholder="My VS Code projects" value={keyName} onChange={(event) => setKeyName(event.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
          <Button variant="contained" onClick={createKey} disabled={creating || !keyName.trim()}>{creating ? <CircularProgress size={20} color="inherit" /> : "Create key"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(createdKey)} onClose={() => setCreatedKey(null)} fullWidth maxWidth="sm" disableEscapeKeyDown>
        <DialogTitle>Copy your API key</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>This secret is shown only once. Store it in your password manager or VS Code environment.</Alert>
          <TextField
            fullWidth
            multiline
            value={createdKey?.token || ""}
            InputProps={{ readOnly: true, endAdornment: <IconButton onClick={() => copy(createdKey?.token || "")}><ContentCopy /></IconButton> }}
          />
        </DialogContent>
        <DialogActions><Button variant="contained" onClick={() => setCreatedKey(null)}>I stored the key</Button></DialogActions>
      </Dialog>
      <Snackbar open={Boolean(toast)} autoHideDuration={2500} onClose={() => setToast("")} message={toast} />
    </Box>
  );
};

export default ApiIntegration;
