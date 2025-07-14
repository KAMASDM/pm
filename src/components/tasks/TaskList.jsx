// src/components/tasks/TaskList.jsx

import React, { useState, useMemo, useCallback } from "react";
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
  Autocomplete,
  Avatar,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  useMediaQuery,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Search,
  Add,
  MoreVert,
  Assignment,
  CheckCircle,
  Edit,
  Delete,
  Category,
  Person,
  NavigateNext,
  ArrowBack as ArrowBackIcon,
  Save,
  ViewList,
  ViewKanban,
} from "@mui/icons-material";
import useProject from "../../hooks/useProject";
import TaskCard from "./TaskCard";

const statusOptionsForFilter = [
  { value: "all", label: "All Tasks", color: "#9E9E9E" },
  { value: "pending", label: "Pending", color: "#64B5F6" },
  { value: "in-progress", label: "In Progress", color: "#FFB74D" },
  { value: "completed", label: "Completed", color: "#81C784" },
  { value: "blocked", label: "Blocked", color: "#F44336" },
];
const priorityOptionsForFilter = [
  { value: "all", label: "All Priorities", color: "#9E9E9E" },
  { value: "low", label: "Low", color: "#6BBF6B" },
  { value: "medium", label: "Medium", color: "#FFD700" },
  { value: "high", label: "High", color: "#DC3545" },
];

const statusOptions = statusOptionsForFilter.filter(
  (opt) => opt.value !== "all"
);
const priorityOptions = priorityOptionsForFilter.filter(
  (opt) => opt.value !== "all"
);

const steps = [
  {
    label: "Basic Information",
    description: "Task name, description, and project",
    icon: <Assignment />,
  },
  {
    label: "Categorization",
    description: "Category, priority, and status",
    icon: <Category />,
  },
  {
    label: "Assignment",
    description: "Assign to team member and set timeline",
    icon: <Person />,
  },
  {
    label: "Details & Review",
    description: "Additional details and final review",
    icon: <CheckCircle />,
  },
];

const TaskList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const {
    tasks,
    projects,
    categories = [],
    employees = [],
    updateTask,
    deleteTask,
    loading,
  } = useProject();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeEditStep, setActiveEditStep] = useState(0);
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    description: "",
    projectId: "",
    category: "",
    subcategory: "",
    status: "pending",
    priority: "medium",
    assignedTo: null,
    dueDate: null,
    estimatedHours: "",
  });
  const [editErrors, setEditErrors] = useState({});
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [submittingState, setSubmittingState] = useState({
    saving: false,
    deleting: false,
  });
  const [viewMode, setViewMode] = useState("list");

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
        filtered.sort(
          (a, b) =>
            new Date(
              b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt || 0
            ) -
            new Date(
              a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt || 0
            )
        );
    }
    return filtered;
  }, [tasks, searchTerm, filterStatus, filterPriority, filterProject, sortBy]);

  const getTasksByStatus = useCallback(
    (statusValue) => tasks.filter((task) => task.status === statusValue).length,
    [tasks]
  );
  const getStatusColor = useCallback(
    (statusValue) =>
      statusOptionsForFilter.find((s) => s.value === statusValue)?.color ||
      theme.palette.grey[500],
    [theme.palette.grey]
  );
  const getPriorityColor = useCallback(
    (priorityValue) =>
      priorityOptionsForFilter.find((p) => p.value === priorityValue)?.color ||
      theme.palette.grey[500],
    [theme.palette.grey]
  );

  const handleMenuOpen = (event, task) => {
    event.stopPropagation();
    setSelectedTask(task);
    setMenuAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setMenuAnchorEl(null);

  const handleEditTask = () => {
    if (selectedTask) {
      let assigneeObject = null;
      if (selectedTask.assignedTo) {
        if (typeof selectedTask.assignedTo === "string")
          assigneeObject =
            employees.find((emp) => emp.id === selectedTask.assignedTo) || null;
        else if (typeof selectedTask.assignedTo === "object")
          assigneeObject = selectedTask.assignedTo;
      }
      setEditForm({
        id: selectedTask.id || "",
        name: selectedTask.name || "",
        description: selectedTask.description || "",
        projectId: selectedTask.projectId || "",
        category: selectedTask.category || "",
        subcategory: selectedTask.subcategory || "",
        status: selectedTask.status || "pending",
        priority: selectedTask.priority || "medium",
        assignedTo: assigneeObject,
        dueDate: selectedTask.dueDate ? new Date(selectedTask.dueDate) : null,
        estimatedHours: selectedTask.estimatedHours || "",
      });
      setActiveEditStep(0);
      setEditErrors({});
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteConfirmation = () => setOpenConfirmDialog(true);
  const handleDeleteTask = async () => {
    if (selectedTask) {
      setSubmittingState((prev) => ({ ...prev, deleting: true }));
      try {
        await deleteTask(selectedTask.id);
        setSelectedTask(null);
      } catch (error) {
        console.error("Error deleting task:", error);
      } finally {
        setSubmittingState((prev) => ({ ...prev, deleting: false }));
        setOpenConfirmDialog(false);
        handleMenuClose();
      }
    }
  };

  const handleEditFormChange = useCallback(
    (field, value) => {
      setEditForm((prev) => ({ ...prev, [field]: value }));
      if (editErrors[field])
        setEditErrors((prev) => ({ ...prev, [field]: null }));
      if (field === "category")
        setEditForm((prev) => ({ ...prev, subcategory: "" }));
    },
    [editErrors]
  );

  const validateEditStep = useCallback(
    (step) => {
      const newErrors = {};
      switch (step) {
        case 0:
          if (!editForm.name.trim()) newErrors.name = "Task name is required.";
          if (!editForm.projectId) newErrors.projectId = "Project is required.";
          break;
        case 1:
          if (!editForm.category) newErrors.category = "Category is required.";
          break;
        case 2:
          if (
            editForm.estimatedHours &&
            isNaN(parseFloat(editForm.estimatedHours))
          ) {
            newErrors.estimatedHours = "Must be a valid number.";
          }
          break;
      }
      setEditErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [editForm]
  );

  const handleNextEditStep = () => {
    if (validateEditStep(activeEditStep)) {
      if (activeEditStep < steps.length - 1) {
        setActiveEditStep((prevActiveStep) => prevActiveStep + 1);
      }
    }
  };
  const handleBackEditStep = () =>
    setActiveEditStep((prevActiveStep) => prevActiveStep - 1);

  const handleSaveEdit = async () => {
    for (let i = 0; i < steps.length - 1; i++) {
      if (!validateEditStep(i)) {
        setActiveEditStep(i);
        return;
      }
    }

    if (editForm.id) {
      setSubmittingState((prev) => ({ ...prev, saving: true }));
      try {
        const updateData = {
          name: editForm.name,
          description: editForm.description,
          projectId: editForm.projectId,
          category: editForm.category,
          subcategory: editForm.subcategory,
          status: editForm.status,
          priority: editForm.priority,
          assignedTo: editForm.assignedTo ? editForm.assignedTo.id : null,
          dueDate: editForm.dueDate ? editForm.dueDate.toISOString() : null,
          estimatedHours: editForm.estimatedHours || "",
        };
        await updateTask(editForm.id, updateData);
        setEditDialogOpen(false);
        setSelectedTask(null);
      } catch (error) {
        console.error("Error updating task:", error);
        setEditErrors((prev) => ({
          ...prev,
          submission: error.message || "Failed to save changes.",
        }));
      } finally {
        setSubmittingState((prev) => ({ ...prev, saving: false }));
      }
    }
  };

  const getProjectName = useCallback(
    (projectId) => projects.find((p) => p.id === projectId)?.name || "Unknown",
    [projects]
  );
  const formatDate = useCallback(
    (dateStr) => (dateStr ? new Date(dateStr).toLocaleDateString() : "N/A"),
    []
  );
  const getSelectedCategoryForEdit = useMemo(
    () =>
      editForm.category && categories.length
        ? categories.find((c) => c.name === editForm.category)
        : null,
    [editForm.category, categories]
  );
  const getAvailableSubcategoriesForEdit = useMemo(
    () => getSelectedCategoryForEdit?.subcategories || [],
    [getSelectedCategoryForEdit]
  );

  const renderEditStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2.5} sx={{ pt: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task Name"
                value={editForm.name}
                error={!!editErrors.name}
                helperText={editErrors.name}
                onChange={(e) => handleEditFormChange("name", e.target.value)}
                disabled={submittingState.saving}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={editForm.description}
                onChange={(e) =>
                  handleEditFormChange("description", e.target.value)
                }
                multiline
                rows={4}
                disabled={submittingState.saving}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl
                fullWidth
                disabled={submittingState.saving}
                error={!!editErrors.projectId}
              >
                <InputLabel>Project</InputLabel>
                <Select
                  value={editForm.projectId}
                  label="Project"
                  onChange={(e) =>
                    handleEditFormChange("projectId", e.target.value)
                  }
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
                {editErrors.projectId && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ ml: 2, mt: 0.5 }}
                  >
                    {editErrors.projectId}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2.5} sx={{ pt: 2 }}>
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                disabled={submittingState.saving}
                error={!!editErrors.category}
              >
                <InputLabel>Category</InputLabel>
                <Select
                  value={editForm.category}
                  label="Category"
                  onChange={(e) =>
                    handleEditFormChange("category", e.target.value)
                  }
                >
                  {(categories || []).map((cat) => (
                    <MenuItem key={cat.id || cat.name} value={cat.name}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
                {editErrors.category && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ ml: 2, mt: 0.5 }}
                  >
                    {editErrors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            {getAvailableSubcategoriesForEdit.length > 0 && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={submittingState.saving}>
                  <InputLabel>Subcategory</InputLabel>
                  <Select
                    value={editForm.subcategory}
                    label="Subcategory"
                    onChange={(e) =>
                      handleEditFormChange("subcategory", e.target.value)
                    }
                  >
                    {getAvailableSubcategoriesForEdit.map((subcat) => (
                      <MenuItem key={subcat.name} value={subcat.name}>
                        {subcat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={submittingState.saving}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status}
                  label="Status"
                  onChange={(e) =>
                    handleEditFormChange("status", e.target.value)
                  }
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={submittingState.saving}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={editForm.priority}
                  label="Priority"
                  onChange={(e) =>
                    handleEditFormChange("priority", e.target.value)
                  }
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
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
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2.5} sx={{ pt: 2 }}>
            <Grid item xs={12} sm={editForm.assignedTo ? 7 : 12}>
              <Autocomplete
                options={employees || []}
                getOptionLabel={(option) => option?.name || ""}
                value={editForm.assignedTo}
                onChange={(event, newValue) =>
                  handleEditFormChange("assignedTo", newValue)
                }
                isOptionEqualToValue={(option, value) =>
                  option?.id === value?.id
                }
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Avatar
                      sx={{
                        mr: 1.5,
                        width: 32,
                        height: 32,
                        fontSize: "0.9rem",
                      }}
                      src={option.photoURL}
                    >
                      {option.name?.charAt(0)}
                    </Avatar>
                    {option.name}{" "}
                    <Typography
                      variant="caption"
                      sx={{ ml: 0.5, color: "text.secondary" }}
                    >
                      ({option.email})
                    </Typography>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Assign To (Optional)" />
                )}
                disabled={submittingState.saving}
              />
            </Grid>
            {editForm.assignedTo && (
              <Grid
                item
                xs={12}
                sm={5}
                sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
              >
                <Avatar
                  src={editForm.assignedTo.photoURL}
                  sx={{ width: 48, height: 48 }}
                >
                  {editForm.assignedTo.name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {editForm.assignedTo.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {editForm.assignedTo.email}
                  </Typography>
                </Box>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Due Date (Optional)"
                value={editForm.dueDate}
                onChange={(newValue) =>
                  handleEditFormChange("dueDate", newValue)
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!editErrors.dueDate,
                    helperText: editErrors.dueDate,
                  },
                }}
                disabled={submittingState.saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Hours (Optional)"
                type="number"
                value={editForm.estimatedHours}
                error={!!editErrors.estimatedHours}
                helperText={editErrors.estimatedHours}
                onChange={(e) =>
                  handleEditFormChange("estimatedHours", e.target.value)
                }
                inputProps={{ min: 0, step: 0.5 }}
                disabled={submittingState.saving}
              />
            </Grid>
          </Grid>
        );
      case 3: {
        // Review & Save
        const project = projects.find((p) => p.id === editForm.projectId);
        const priority = priorityOptions.find(
          (p) => p.value === editForm.priority
        );
        const status = statusOptions.find((s) => s.value === editForm.status);
        return (
          <Box sx={{ pt: 2 }}>
            {editErrors.submission && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {editErrors.submission}
              </Alert>
            )}
            <Typography variant="h6" gutterBottom>
              Review Your Changes
            </Typography>
            <Card variant="outlined" sx={{ mb: 1.5 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Basic Information
                </Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {editForm.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Description:</strong> {editForm.description || "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Project:</strong> {project?.name || "N/A"}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ mb: 1.5 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Categorization
                </Typography>
                <Typography variant="body2">
                  <strong>Category:</strong> {editForm.category || "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Subcategory:</strong> {editForm.subcategory || "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {status?.label || "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Priority:</strong> {priority?.label || "N/A"}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Assignment & Timeline
                </Typography>
                <Typography variant="body2">
                  <strong>Assigned To:</strong>{" "}
                  {editForm.assignedTo?.name || "Not Assigned"}
                </Typography>
                <Typography variant="body2">
                  <strong>Due Date:</strong>{" "}
                  {editForm.dueDate ? formatDate(editForm.dueDate) : "Not Set"}
                </Typography>
                <Typography variant="body2">
                  <strong>Estimated Hours:</strong>{" "}
                  {editForm.estimatedHours || "Not Set"}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );
      }
      default:
        return "Unknown step";
    }
  };

  if (loading && !tasks.length) {
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
              Manage and track all your tasks across projects.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton onClick={() => setViewMode("list")}>
              <ViewList color={viewMode === "list" ? "primary" : "inherit"} />
            </IconButton>
            <IconButton onClick={() => setViewMode("kanban")}>
              <ViewKanban
                color={viewMode === "kanban" ? "primary" : "inherit"}
              />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate("/tasks/create")}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Create Task
            </Button>
          </Box>
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
                    const selectedOption = statusOptionsForFilter.find(
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
                  {statusOptionsForFilter.map((option) => (
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
                    const selectedOption = priorityOptionsForFilter.find(
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
                  {priorityOptionsForFilter.map((option) => (
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
        {viewMode === "list" ? (
          filteredAndSortedTasks.length === 0 ? (
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
                {searchTerm ||
                filterStatus !== "all" ||
                filterPriority !== "all" ||
                filterProject !== "all"
                  ? "No tasks match your filters"
                  : "No tasks yet"}{" "}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
              >
                {searchTerm ||
                filterStatus !== "all" ||
                filterPriority !== "all" ||
                filterProject !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by creating a new task."}{" "}
              </Typography>
              {!searchTerm &&
                filterStatus === "all" &&
                filterPriority === "all" &&
                filterProject === "all" && (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate("/tasks/create")}
                    sx={{
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Create Task
                  </Button>
                )}
            </Paper>
          ) : (
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
                  <ListItemText
                    primary={
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
                    }
                    secondaryTypographyProps={{ component: "div" }}
                    secondary={
                      <>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          sx={{ mb: 0.5 }}
                        >
                          {task.description}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Chip
                            label={task.status}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(task.status),
                              color: "#fff",
                              fontWeight: 500,
                              height: 20,
                              fontSize: "0.65rem",
                            }}
                          />
                          <Chip
                            label={task.priority}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: getPriorityColor(task.priority),
                              color: getPriorityColor(task.priority),
                              fontWeight: 500,
                              height: 20,
                              fontSize: "0.65rem",
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Project: {getProjectName(task.projectId)}
                          </Typography>
                          {task.dueDate && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Due: {formatDate(task.dueDate)}
                            </Typography>
                          )}
                        </Box>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, task)}
                      title="More options"
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )
        ) : (
          <Grid container spacing={2}>
            {statusOptions
              .filter((s) => s.value !== "all")
              .map((status) => (
                <Grid item xs={12} md={3} key={status.value}>
                  <Paper sx={{ p: 2, backgroundColor: "grey.100" }}>
                    <Typography
                      variant="h6"
                      sx={{ color: getStatusColor(status.value) }}
                    >
                      {status.label}
                    </Typography>
                    {filteredAndSortedTasks
                      .filter((task) => task.status === status.value)
                      .map((task) => (
                        <Box
                          key={task.id}
                          onClick={() => {
                            setSelectedTask(task);
                            handleEditTask();
                          }}
                          sx={{ my: 1, cursor: "pointer" }}
                        >
                          <TaskCard
                            task={task}
                            onEdit={() => {
                              setSelectedTask(task);
                              handleEditTask();
                            }}
                            onDelete={() => {
                              setSelectedTask(task);
                              handleDeleteConfirmation();
                            }}
                            compact
                          />
                        </Box>
                      ))}
                  </Paper>
                </Grid>
              ))}
          </Grid>
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
            onClick={handleEditTask}
            disabled={!selectedTask}
            sx={{ color: "#f57c00" }}
          >
            <Edit fontSize="small" sx={{ mr: 1, color: "#f57c00" }} /> Edit
          </MenuItem>
          <MenuItem
            onClick={handleDeleteConfirmation}
            sx={{ color: "#d32f2f" }}
            disabled={!selectedTask}
          >
            <Delete fontSize="small" sx={{ mr: 1, color: "#d32f2f" }} /> Delete
          </MenuItem>
        </Menu>
        <Dialog
          open={editDialogOpen}
          onClose={() => {
            if (!submittingState.saving) setEditDialogOpen(false);
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            Edit Task - {steps[activeEditStep].label}
            <Typography variant="caption">
              Step {activeEditStep + 1} of {steps.length}
            </Typography>
          </DialogTitle>
          {submittingState.saving && (
            <LinearProgress
              color="primary"
              sx={{ position: "absolute", top: 0, width: "100%" }}
            />
          )}

          <DialogContent sx={{ py: 0, px: { xs: 2, sm: 3 } }}>
            <Stepper
              activeStep={activeEditStep}
              alternativeLabel={!isMobile}
              orientation={isMobile ? "vertical" : "horizontal"}
              sx={{ pt: 3, pb: 2 }}
            >
              {steps.map((step, index) => (
                <Step key={step.label} completed={activeEditStep > index}>
                  <StepLabel
                    StepIconComponent={(props) => (
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: props.active
                            ? theme.palette.primary.main
                            : props.completed
                            ? theme.palette.success.main
                            : theme.palette.action.disabledBackground,
                          color:
                            props.active || props.completed
                              ? theme.palette.common.white
                              : theme.palette.text.secondary,
                          boxShadow: props.active ? theme.shadows[2] : "none",
                        }}
                      >
                        {props.completed ? (
                          <CheckCircle sx={{ fontSize: "1.2rem" }} />
                        ) : (
                          React.cloneElement(step.icon, {
                            sx: { fontSize: "1.2rem" },
                          })
                        )}
                      </Box>
                    )}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: activeEditStep === index ? 500 : "normal",
                      }}
                    >
                      {step.label}
                    </Typography>
                    {!isMobile && (
                      <Typography variant="caption" color="textSecondary">
                        {step.description}
                      </Typography>
                    )}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
            <Divider sx={{ mb: 2, mt: isMobile ? 1 : 0 }} />
            {renderEditStepContent(activeEditStep)}
          </DialogContent>
          <DialogActions
            sx={{
              px: { xs: 2, sm: 3 },
              py: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Button
              onClick={() => setEditDialogOpen(false)}
              disabled={submittingState.saving}
            >
              Cancel
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              onClick={handleBackEditStep}
              disabled={activeEditStep === 0 || submittingState.saving}
              startIcon={<ArrowBackIcon />}
            >
              Back
            </Button>
            {activeEditStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveEdit}
                disabled={submittingState.saving}
                startIcon={<Save />}
                sx={{ minWidth: 140 }}
              >
                {submittingState.saving ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                ) : null}
                {submittingState.saving ? "Saving..." : "Save Changes"}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNextEditStep}
                disabled={submittingState.saving}
                endIcon={<NavigateNext />}
              >
                Next
              </Button>
            )}
          </DialogActions>
        </Dialog>
        <Dialog
          open={openConfirmDialog}
          onClose={() => {
            if (!submittingState.deleting) setOpenConfirmDialog(false);
          }}
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the task "{selectedTask?.name}"?
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
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
              {submittingState.deleting ? (
                <CircularProgress size={20} sx={{ mr: 1 }} />
              ) : null}
              {submittingState.deleting ? "Deleting..." : "Delete Task"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default TaskList;