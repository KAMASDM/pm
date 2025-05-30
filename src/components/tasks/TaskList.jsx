import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Menu,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Fade,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  Add,
  MoreVert,
  Assignment,
  CheckCircle,
  Edit,
  Delete,
  Visibility,
  PlayArrow,
} from "@mui/icons-material";
import useProject from "../../hooks/useProject";

const statusOptions = [
  { value: "all", label: "All Tasks", color: "#9E9E9E" },
  { value: "pending", label: "Pending", color: "#64B5F6" },
  { value: "in-progress", label: "In Progress", color: "#FFB74D" },
  { value: "completed", label: "Completed", color: "#81C784" },
  { value: "blocked", label: "Blocked", color: "#F44336" },
];

const priorityOptions = [
  { value: "all", label: "All Priorities", color: "#9E9E9E" },
  { value: "low", label: "Low", color: "#6BBF6B" },
  { value: "medium", label: "Medium", color: "#FFD700" },
  { value: "high", label: "High", color: "#DC3545" },
];

const TaskList = () => {
  const navigate = useNavigate();
  const { tasks, projects, updateTask, deleteTask, loading } = useProject();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    description: "",
    status: "",
    priority: "",
    projectId: "",
    category: "",
  });
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [submittingState, setSubmittingState] = useState({
    saving: false,
    deleting: false,
    updating: null,
  });

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter((task) => {
      const matchesSearch =
        task.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || task.status === filterStatus;
      const matchesPriority =
        filterPriority === "all" || task.priority === filterPriority;
      const matchesProject =
        filterProject === "all" || task.projectId === filterProject;

      return (
        matchesSearch && matchesStatus && matchesPriority && matchesProject
      );
    });

    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "priority": {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        filtered.sort(
          (a, b) =>
            (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
        );
        break;
      }
      case "status":
        filtered.sort((a, b) => (a.status || "").localeCompare(b.status || ""));
        break;
      default:
        filtered.sort((a, b) => {
          const dateA = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(b.createdAt || 0);
          return dateB - dateA;
        });
    }

    return filtered;
  }, [tasks, searchTerm, filterStatus, filterPriority, filterProject, sortBy]);

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status).length;
  };

  const getStatusColor = (status) => {
    return statusOptions.find((s) => s.value === status)?.color || "#E6E6FA";
  };

  const getPriorityColor = (priority) => {
    return (
      priorityOptions.find((p) => p.value === priority)?.color || "#E6E6FA"
    );
  };

  const handleMenuOpen = (event, task) => {
    event.stopPropagation();
    setSelectedTask(task);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedTask(null);
  };

  const handleEditTask = () => {
    if (selectedTask) {
      setEditForm({
        id: selectedTask.id || "",
        name: selectedTask.name || "",
        description: selectedTask.description || "",
        status: selectedTask.status || "pending",
        priority: selectedTask.priority || "medium",
        projectId: selectedTask.projectId || "",
        category: selectedTask.category || "",
      });
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteTask = async () => {
    if (selectedTask) {
      setSubmittingState((prev) => ({ ...prev, deleting: true }));
      try {
        await deleteTask(selectedTask.id);
      } catch (error) {
        console.error("Error deleting task:", error);
      } finally {
        setSubmittingState((prev) => ({ ...prev, deleting: false }));
        setOpenConfirmDialog(false);
        handleMenuClose();
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setSubmittingState((prev) => ({ ...prev, updating: taskId }));
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error("Error updating task status:", error);
    } finally {
      setSubmittingState((prev) => ({ ...prev, updating: null }));
    }
  };

  const handleSaveEdit = async () => {
    if (editForm.id) {
      setSubmittingState((prev) => ({ ...prev, saving: true }));
      try {
        await updateTask(editForm.id, {
          name: editForm.name,
          description: editForm.description,
          status: editForm.status,
          priority: editForm.priority,
          projectId: editForm.projectId,
        });
        setEditDialogOpen(false);
        setSelectedTask(null);
      } catch (error) {
        console.error("Error updating task:", error);
      } finally {
        setSubmittingState((prev) => ({ ...prev, saving: false }));
      }
    }
  };

  const getProjectName = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  const formatDate = (date) => {
    if (!date) return "";
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Skeleton variant="rectangular" height={60} />
        </Paper>
        {[1, 2, 3, 4, 5].map((item) => (
          <Skeleton
            key={item}
            variant="rectangular"
            height={80}
            sx={{ mb: 2, borderRadius: 2 }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Fade in={true} timeout={600}>
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                background: "linear-gradient(135deg, #8B7EC8, #6B5B95)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Tasks
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and track all your tasks across projects
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate("/projects/create")}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Create Project
          </Button>
        </Box>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            background:
              "linear-gradient(135deg, rgba(139, 126, 200, 0.03), rgba(181, 169, 214, 0.05))",
            border: "1px solid rgba(139, 126, 200, 0.1)",
          }}
        >
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                  sx={{ backgroundColor: "white", borderRadius: 2 }}
                  renderValue={(selected) => {
                    const selectedOption = statusOptions.find(
                      (option) => option.value === selected
                    );
                    return (
                      <span style={{ display: "flex", alignItems: "center" }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: selectedOption.color,
                            mr: 1,
                          }}
                        />
                        {selectedOption.label}
                      </span>
                    );
                  }}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: option.color,
                          }}
                        />
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filterPriority}
                  label="Priority"
                  onChange={(e) => setFilterPriority(e.target.value)}
                  sx={{ backgroundColor: "white", borderRadius: 2 }}
                  renderValue={(selected) => {
                    const selectedOption = priorityOptions.find(
                      (option) => option.value === selected
                    );
                    return (
                      <span style={{ display: "flex", alignItems: "center" }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: selectedOption.color,
                            mr: 1,
                          }}
                        />
                        {selectedOption.label}
                      </span>
                    );
                  }}
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: option.color,
                          }}
                        />
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={filterProject}
                  label="Project"
                  onChange={(e) => setFilterProject(e.target.value)}
                  sx={{ backgroundColor: "white", borderRadius: 2 }}
                >
                  <MenuItem value="all">All Projects</MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{ backgroundColor: "white", borderRadius: 2 }}
                >
                  <MenuItem value="recent">Recent</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="priority">Priority</MenuItem>
                  <MenuItem value="status">Status</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "white",
                }}
              >
                <Typography variant="h4" fontWeight={700} color="primary">
                  {tasks.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Tasks
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "white",
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{ color: getStatusColor("in-progress") }}
                >
                  {getTasksByStatus("in-progress")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Progress
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "white",
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{ color: getStatusColor("completed") }}
                >
                  {getTasksByStatus("completed")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "white",
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{ color: getStatusColor("pending") }}
                >
                  {getTasksByStatus("pending")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "white",
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{ color: getStatusColor("blocked") }}
                >
                  {getTasksByStatus("blocked")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Blocked
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        {filteredAndSortedTasks.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: "center",
              borderRadius: 3,
              background:
                "linear-gradient(135deg, rgba(139, 126, 200, 0.03), rgba(181, 169, 214, 0.05))",
              border: "1px solid rgba(139, 126, 200, 0.1)",
            }}
          >
            <Assignment
              sx={{
                fontSize: 60,
                color: "#8E80B1",
                mb: 2,
                opacity: 0.7,
              }}
            />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              {searchTerm || filterStatus !== "all"
                ? "No tasks found"
                : "No tasks yet"}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
            >
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Create your first project to start adding tasks and tracking progress."}
            </Typography>
            {!searchTerm && filterStatus === "all" && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate("/projects/create")}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Create Your First Project
              </Button>
            )}
          </Paper>
        ) : (
          <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden" }}>
            <List sx={{ p: 0 }}>
              {filteredAndSortedTasks.map((task) => (
                <ListItem
                  key={task.id}
                  sx={(theme) => ({
                    p: 3,
                    cursor: "pointer",
                    background:
                      "linear-gradient(135deg, rgba(139, 126, 200, 0.03), rgba(181, 169, 214, 0.05))",
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    mx: 2,
                    mb: 2,
                    opacity: submittingState.updating === task.id ? 0.7 : 1,
                    "&:hover": {
                      backgroundColor: "rgba(139, 126, 200, 0.08)",
                    },
                  })}
                >
                  <ListItemIcon>
                    {submittingState.updating === task.id ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Checkbox
                        checked={task.status === "completed"}
                        onChange={() =>
                          handleStatusChange(
                            task.id,
                            task.status === "completed"
                              ? "pending"
                              : "completed"
                          )
                        }
                        sx={{
                          color:
                            task.status === "completed"
                              ? "#A8E6CF"
                              : "text.secondary",
                          "&.Mui-checked": {
                            color: "#A8E6CF",
                          },
                        }}
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="body1"
                          fontWeight={600}
                          sx={{
                            textDecoration:
                              task.status === "completed"
                                ? "line-through"
                                : "none",
                            color:
                              task.status === "completed"
                                ? "text.secondary"
                                : "text.primary",
                          }}
                        >
                          {task.name}
                        </Typography>
                        <Chip
                          label={task.status}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.7rem",
                            backgroundColor: getStatusColor(task.status),
                            color: "white",
                            fontWeight: 500,
                          }}
                        />
                        <Chip
                          label={task.priority}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 20,
                            fontSize: "0.7rem",
                            borderColor: getPriorityColor(task.priority),
                            color: getPriorityColor(task.priority),
                            fontWeight: 500,
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        {task.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mb: 1,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {task.description}
                          </Typography>
                        )}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            <strong>Project:</strong>{" "}
                            {getProjectName(task.projectId)}
                          </Typography>
                          {task.category && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              <strong>Category:</strong> {task.category}
                            </Typography>
                          )}
                          {task.createdAt && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              <strong>Created:</strong>{" "}
                              {formatDate(task.createdAt)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {submittingState.updating === task.id ? (
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                    ) : (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {task.status === "in-progress" && (
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleStatusChange(task.id, "completed")
                            }
                            sx={{ color: getStatusColor("completed") }}
                          >
                            <CheckCircle />
                          </IconButton>
                        )}
                        {task.status === "pending" && (
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleStatusChange(task.id, "in-progress")
                            }
                            sx={{ color: getStatusColor("in-progress") }}
                          >
                            <PlayArrow />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, task)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { borderRadius: 2, minWidth: 150 },
          }}
        >
          <MenuItem
            onClick={() => navigate(`/projects/${selectedTask?.projectId}`)}
            sx={{ color: "#1976d2" }}
          >
            <Visibility fontSize="small" sx={{ mr: 1, color: "#1976d2" }} />
            View Project
          </MenuItem>
          <MenuItem onClick={handleEditTask} sx={{ color: "#f57c00" }}>
            <Edit fontSize="small" sx={{ mr: 1, color: "#f57c00" }} />
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => setOpenConfirmDialog(true)}
            sx={{ color: "#d32f2f" }}
          >
            <Delete fontSize="small" sx={{ mr: 1, color: "#d32f2f" }} />
            Delete
          </MenuItem>
        </Menu>
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          {submittingState.saving && <LinearProgress />}
          <DialogTitle>Edit Task</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Task Name"
              value={editForm.name}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, name: e.target.value }))
              }
              sx={{ mb: 2, mt: 1 }}
              disabled={submittingState.saving}
            />
            <TextField
              fullWidth
              label="Description"
              value={editForm.description}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              multiline
              rows={3}
              sx={{ mb: 2 }}
              disabled={submittingState.saving}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth disabled={submittingState.saving}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editForm.status}
                    label="Status"
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    renderValue={(selected) => {
                      const selectedOption = statusOptions.find(
                        (option) => option.value === selected
                      );
                      return (
                        <span
                          style={{ color: selectedOption?.color || "#E6E6FA" }}
                        >
                          {selectedOption?.label || "Select Status"}
                        </span>
                      );
                    }}
                  >
                    {statusOptions
                      .filter((opt) => opt.value !== "all")
                      .map((option) => (
                        <MenuItem
                          key={option.value}
                          value={option.value}
                          sx={{ color: option.color }}
                        >
                          {option.label}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth disabled={submittingState.saving}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={editForm.priority}
                    label="Priority"
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                    renderValue={(selected) => {
                      const selectedOption = priorityOptions.find(
                        (option) => option.value === selected
                      );
                      return (
                        <span
                          style={{ color: selectedOption?.color || "#E6E6FA" }}
                        >
                          {selectedOption?.label || "Select Priority"}
                        </span>
                      );
                    }}
                  >
                    {priorityOptions
                      .filter((opt) => opt.value !== "all")
                      .map((option) => (
                        <MenuItem
                          key={option.value}
                          value={option.value}
                          sx={{ color: option.color }}
                        >
                          {option.label}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            {projects.length > 0 && (
              <FormControl
                fullWidth
                sx={{ mt: 2 }}
                disabled={submittingState.saving}
              >
                <InputLabel>Project</InputLabel>
                <Select
                  value={editForm.projectId}
                  label="Project"
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      projectId: e.target.value,
                    }))
                  }
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setEditDialogOpen(false)}
              disabled={submittingState.saving}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveEdit}
              disabled={!editForm.name.trim() || submittingState.saving}
            >
              {submittingState.saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={openConfirmDialog}
          onClose={() => setOpenConfirmDialog(false)}
        >
          <DialogTitle>Delete Task</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this task?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setOpenConfirmDialog(false)}
              disabled={submittingState.deleting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteTask}
              disabled={submittingState.deleting}
            >
              {submittingState.deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default TaskList;
