import React, { useState, useEffect, useMemo, useCallback } from "react"; // Added useMemo
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Card,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Fade,
  Skeleton,
  useTheme,
  useMediaQuery,
  Badge,
  ListItemButton,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  Delete,
  Add,
  MoreVert,
  Assignment,
  Timeline,
  CalendarToday,
  InfoOutlined,
  PeopleOutline,
  BarChart,
  AccountCircle,
  CheckCircleOutline,
  DonutLarge,
  Cached,
  HourglassEmpty,
  Block,
} from "@mui/icons-material";
import useProject from "../../hooks/useProject";
import { stringToColor } from "../../helpers/stringToColor";

const statusOptions = [
  { value: "planning", label: "Planning", color: "#64B5F6" },
  { value: "in-progress", label: "In Progress", color: "#FFB74D" },
  { value: "completed", label: "Completed", color: "#81C784" },
  { value: "on-hold", label: "On Hold", color: "#F44336" },
];

const priorityOptions = [
  { value: "low", label: "Low", color: "#6BBF6B" },
  { value: "medium", label: "Medium", color: "#FFD700" },
  { value: "high", label: "High", color: "#DC3545" },
];

const taskStatusOptions = [
  { value: "pending", label: "Pending", color: "#64B5F6" },
  { value: "in-progress", label: "In Progress", color: "#FFB74D" },
  { value: "completed", label: "Completed", color: "#81C784" },
  { value: "blocked", label: "Blocked", color: "#F44336" },
];

const taskPriorityOptions = [
  { value: "low", label: "Low", color: "#6BBF6B" },
  { value: "medium", label: "Medium", color: "#FFD700" },
  { value: "high", label: "High", color: "#DC3545" },
];

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, updateProject, deleteProject, createTask } = useProject();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [project, setProject] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]); // Derived from project state
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState({
    projectEdit: false,
    projectDelete: false,
    taskCreate: false,
    taskUpdate: null, // Stores the ID of the task being updated
  });

  // Form states
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    status: "",
    priority: "",
    dueDate: null,
  });

  const [taskForm, setTaskForm] = useState({
    name: "",
    description: "",
    status: "pending",
    priority: "medium",
    assignedTo: null,
    category: "",
    subcategory: "",
  });

  useEffect(() => {
    setLoading(true);
    const foundProject = projects.find((p) => p.id === id);
    if (foundProject) {
      setProject(foundProject);
      setEditForm({
        name: foundProject.name || "",
        description: foundProject.description || "",
        status: foundProject.status || "planning",
        priority: foundProject.priority || "medium",
        dueDate: foundProject.dueDate || null,
      });
      setProjectTasks(foundProject.tasks || []);
    } else {
      setProject(null);
      setProjectTasks([]);
    }
    setLoading(false);
  }, [id, projects]);

  const groupedTasks = useMemo(() => {
    const groups = {};
    if (project && project.tasks && Array.isArray(project.tasks)) {
      project.tasks.forEach((task) => {
        const category = task.category || "Uncategorized";
        const subcategory = task.subcategory || "General";

        if (!groups[category]) {
          groups[category] = {};
        }
        if (!groups[category][subcategory]) {
          groups[category][subcategory] = [];
        }
        groups[category][subcategory].push(task);
      });
    }
    return groups;
  }, [project]);

  const calculateProgress = useMemo(() => {
    if (!projectTasks || projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter(
      (task) => task.status === "completed"
    ).length;
    return Math.round((completedTasks / projectTasks.length) * 100);
  }, [projectTasks]);

  const handleMenuClick = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEditProject = async () => {
    if (!project) return;
    setIsSubmitting((prev) => ({ ...prev, projectEdit: true }));
    try {
      await updateProject(project.id, editForm);
      setEditDialogOpen(false);
      handleMenuClose();
    } catch (error) {
      console.error("Error updating project:", error);
    } finally {
      setIsSubmitting((prev) => ({ ...prev, projectEdit: false }));
    }
  };

  const handleConfirmDelete = async () => {
    if (!project) return;
    setIsSubmitting((prev) => ({ ...prev, projectDelete: true }));
    try {
      await deleteProject(project.id);
      navigate("/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setIsSubmitting((prev) => ({ ...prev, projectDelete: false }));
      setDeleteDialogOpen(false);
    }
  };

  const handleCreateTask = async () => {
    if (!project) return;
    setIsSubmitting((prev) => ({ ...prev, taskCreate: true }));
    try {
      await createTask({
        ...taskForm,
        projectId: project.id,
        projectName: project.name,
        createdAt: new Date(),
      });
      setTaskDialogOpen(false);
      setTaskForm({
        name: "",
        description: "",
        status: "pending",
        priority: "medium",
        assignedTo: null,
        category: "",
        subcategory: "",
      });
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsSubmitting((prev) => ({ ...prev, taskCreate: false }));
    }
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return "Not set";
    try {
      const dateObj = dateInput.toDate
        ? dateInput.toDate()
        : new Date(dateInput);
      if (isNaN(dateObj.getTime())) {
        return "Invalid date";
      }
      return dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", dateInput, error);
      return "Error in date";
    }
  };

  const getTasksByStatus = useCallback(
    (status) => {
      return projectTasks.filter((task) => task.status === status);
    },
    [projectTasks]
  );

  const quickStats = useMemo(
    () => [
      {
        label: "Total Tasks",
        value: projectTasks.length,
        icon: <DonutLarge />,
        color: theme.palette.primary.main,
      },
      {
        label: "Completed",
        value: getTasksByStatus("completed").length,
        icon: <CheckCircleOutline />,
        color:
          taskStatusOptions.find((opt) => opt.value === "completed")?.color ||
          "#81C784",
      },
      {
        label: "In Progress",
        value: getTasksByStatus("in-progress").length,
        icon: <Cached />,
        color:
          taskStatusOptions.find((opt) => opt.value === "in-progress")?.color ||
          "#FFB74D",
      },
      {
        label: "Pending",
        value: getTasksByStatus("pending").length,
        icon: <HourglassEmpty />,
        color:
          taskStatusOptions.find((opt) => opt.value === "pending")?.color ||
          "#64B5F6",
      },
      {
        label: "Blocked",
        value: getTasksByStatus("blocked").length,
        icon: <Block />,
        color:
          taskStatusOptions.find((opt) => opt.value === "blocked")?.color ||
          "#F44336",
      },
    ],
    [getTasksByStatus, projectTasks.length, theme.palette.primary.main]
  );

  if (loading) {
    return (
      <Box sx={{ p: isMobile ? 2 : 3 }}>
        <Skeleton
          variant="text"
          width={isMobile ? "80%" : 300}
          height={50}
          sx={{ mb: 2 }}
        />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton
              variant="rectangular"
              height={400}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton
              variant="rectangular"
              height={300}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h5" color="text.secondary">
          Project not found
        </Typography>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/projects")}
          sx={{ mt: 2 }}
          aria-label="Back to projects list"
        >
          Back to Projects
        </Button>
      </Box>
    );
  }

  const progressValue = calculateProgress;
  const projectDueDate = project.dueDate
    ? project.dueDate.toDate
      ? project.dueDate.toDate()
      : new Date(project.dueDate)
    : null;
  const isOverdue =
    projectDueDate &&
    projectDueDate < new Date() &&
    project.status !== "completed";

  const projectStatusColor =
    statusOptions.find((s) => s.value === project.status)?.color ||
    theme.palette.text.secondary;

  const projectPriorityColor =
    priorityOptions.find((p) => p.value === project.priority)?.color ||
    theme.palette.text.secondary;

  return (
    <Fade in={true} timeout={600}>
      <Box
        sx={{
          pb: 4,
          p: isMobile ? 2 : 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            mb: 4,
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ArrowBack />}
              onClick={() => navigate("/projects")}
              aria-label="Go back to projects list"
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: "none",
                fontWeight: 600,
                borderWidth: 2,
                "&:hover": { borderWidth: 2 },
              }}
            >
              Back
            </Button>
            <Box>
              <Typography
                variant={isMobile ? "h5" : "h4"}
                component="h1"
                sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}
              >
                {project.name}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mt: 0.5,
                  flexWrap: "wrap",
                }}
              >
                <Chip
                  label={
                    statusOptions.find((s) => s.value === project.status)
                      ?.label || project.status
                  }
                  size="small"
                  sx={{
                    backgroundColor: `${projectStatusColor}20`,
                    color: projectStatusColor,
                    fontWeight: 600,
                    border: `1px solid ${projectStatusColor}40`,
                  }}
                />
                <Chip
                  label={
                    priorityOptions.find((p) => p.value === project.priority)
                      ?.label || project.priority
                  }
                  size="small"
                  sx={{
                    backgroundColor: `${projectPriorityColor}20`,
                    color: projectPriorityColor,
                    fontWeight: 600,
                    border: `1px solid ${projectPriorityColor}40`,
                  }}
                />
                {projectDueDate && (
                  <Chip
                    icon={<CalendarToday fontSize="small" />}
                    label={formatDate(projectDueDate)}
                    size="small"
                    sx={{
                      backgroundColor: isOverdue
                        ? theme.palette.error.light + "30"
                        : "rgba(139, 126, 200, 0.1)",
                      color: isOverdue
                        ? theme.palette.error.dark
                        : "text.secondary",
                      fontWeight: 500,
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => setTaskDialogOpen(true)}
              aria-label="Add new task to this project"
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": { boxShadow: "0 2px 8px rgba(139, 126, 200, 0.4)" },
              }}
            >
              Add Task
            </Button>
            <IconButton
              onClick={handleMenuClick}
              aria-label="Project options menu"
              aria-haspopup="true"
              aria-controls={menuAnchorEl ? "project-actions-menu" : undefined}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                p: 1.5,
              }}
            >
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={isMobile ? 2 : 3}>
          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  p: 3,
                  background:
                    "linear-gradient(135deg, rgba(139, 126, 200, 0.03), rgba(181, 169, 214, 0.05))",
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    Project Progress
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="primary">
                    {progressValue}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progressValue}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "rgba(139, 126, 200, 0.1)",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 5,
                      background:
                        progressValue === 100
                          ? "linear-gradient(90deg, #A8E6CF, #7FBF7F)"
                          : "linear-gradient(90deg, #8B7EC8, #B5A9D6)",
                    },
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 1.5,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    <Box
                      component="span"
                      sx={{ color: "text.primary", fontWeight: 600 }}
                    >
                      {
                        projectTasks.filter((t) => t.status === "completed")
                          .length
                      }
                    </Box>{" "}
                    of{" "}
                    <Box
                      component="span"
                      sx={{ color: "text.primary", fontWeight: 600 }}
                    >
                      {projectTasks.length}
                    </Box>{" "}
                    tasks completed
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                  value={tabValue}
                  onChange={(e, newValue) => setTabValue(newValue)}
                  variant={isMobile ? "scrollable" : "standard"}
                  scrollButtons={isMobile ? "auto" : false}
                  aria-label="Project details tabs"
                >
                  <Tab
                    label="Overview"
                    id="project-tab-0"
                    aria-controls="project-tabpanel-0"
                    sx={{
                      minWidth: isMobile ? "auto" : 120,
                      textTransform: "none",
                    }}
                  />
                  <Tab
                    label={
                      <Badge
                        badgeContent={projectTasks.length}
                        color="primary"
                        sx={{ "& .MuiBadge-badge": { right: -10, top: -2 } }}
                      >
                        Tasks
                      </Badge>
                    }
                    id="project-tab-1"
                    aria-controls="project-tabpanel-1"
                    sx={{
                      minWidth: isMobile ? "auto" : 120,
                      textTransform: "none",
                      pr: projectTasks.length > 0 ? 3 : "inherit",
                    }}
                  />
                  <Tab
                    label="Activity"
                    id="project-tab-2"
                    aria-controls="project-tabpanel-2"
                    sx={{
                      minWidth: isMobile ? "auto" : 120,
                      textTransform: "none",
                    }}
                  />
                </Tabs>
              </Box>
              <Box sx={{ p: isMobile ? 2 : 3 }}>
                {tabValue === 0 && (
                  <Box
                    role="tabpanel"
                    id="project-tabpanel-0"
                    aria-labelledby="project-tab-0"
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      gutterBottom
                    >
                      Description
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        mb: 4,
                        borderRadius: 2,
                        backgroundColor: "action.hover",
                      }}
                    >
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}
                      >
                        {project.description}
                      </Typography>
                    </Paper>

                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      gutterBottom
                    >
                      Task Categories
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        mb: 4,
                        borderRadius: 2,
                        backgroundColor: "action.hover",
                      }}
                    >
                      {Object.keys(groupedTasks).length > 0 ? (
                        <Grid container spacing={3}>
                          {Object.entries(groupedTasks).map(
                            ([category, subcategories]) => (
                              <Grid item xs={12} key={category}>
                                <Typography
                                  variant="h6"
                                  fontWeight={500}
                                  gutterBottom
                                  sx={{ textTransform: "capitalize" }}
                                >
                                  {category}
                                </Typography>
                                <Grid container spacing={2}>
                                  {Object.entries(subcategories).map(
                                    ([subcategory, tasks]) => (
                                      <Grid
                                        item
                                        xs={12}
                                        sm={6}
                                        md={4}
                                        key={subcategory}
                                      >
                                        <Card
                                          elevation={0}
                                          sx={{
                                            p: 2,
                                            height: "100%",
                                            border: `1px solid ${theme.palette.divider}`,
                                            borderRadius: 2,
                                            transition: "all 0.2s ease",
                                            "&:hover": {
                                              borderColor: "primary.main",
                                              boxShadow:
                                                "0 4px 12px rgba(139, 126, 200, 0.1)",
                                            },
                                          }}
                                        >
                                          <Typography
                                            variant="subtitle2"
                                            fontWeight={600}
                                            gutterBottom
                                            sx={{ textTransform: "capitalize" }}
                                          >
                                            {subcategory}
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            {tasks.length} task
                                            {tasks.length !== 1 ? "s" : ""}
                                          </Typography>
                                        </Card>
                                      </Grid>
                                    )
                                  )}
                                </Grid>
                              </Grid>
                            )
                          )}
                        </Grid>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No tasks categorized yet.
                        </Typography>
                      )}
                    </Paper>
                  </Box>
                )}
                {tabValue === 1 && (
                  <Box
                    role="tabpanel"
                    id="project-tabpanel-1"
                    aria-labelledby="project-tab-1"
                  >
                    {projectTasks.length === 0 ? (
                      <Box
                        sx={{
                          textAlign: "center",
                          py: 6,
                          border: "1px dashed",
                          borderColor: "divider",
                          borderRadius: 2,
                        }}
                      >
                        <Assignment
                          sx={{
                            fontSize: 48,
                            color: "text.secondary",
                            mb: 2,
                            opacity: 0.5,
                          }}
                        />
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          gutterBottom
                        >
                          No tasks yet
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 3 }}
                        >
                          Add your first task to get started
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => setTaskDialogOpen(true)}
                          sx={{ borderRadius: 2 }}
                        >
                          Create Task
                        </Button>
                      </Box>
                    ) : (
                      <List>
                        {projectTasks.map((task) => {
                          const currentTaskStatus = taskStatusOptions.find(
                            (opt) => opt.value === task.status
                          );
                          const currentTaskPriority = taskPriorityOptions.find(
                            (opt) => opt.value === task.priority
                          );
                          return (
                            <ListItem
                              key={task.id}
                              sx={{
                                borderRadius: 2,
                                mb: 1,
                                p: 0,
                                background:
                                  "linear-gradient(135deg, rgba(139, 126, 200, 0.03), rgba(181, 169, 214, 0.05))",
                                border: (theme) =>
                                  `1px solid ${theme.palette.divider}`,
                                "&:hover": { backgroundColor: "action.hover" },
                              }}
                              secondaryAction={
                                isSubmitting.taskUpdate === task.id ? (
                                  <CircularProgress size={24} />
                                ) : null
                              }
                            >
                              <ListItemButton
                                sx={{ borderRadius: 2, py: 1.5, px: 2 }}
                              >
                                <ListItemText
                                  primary={
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        textDecoration:
                                          task.status === "completed"
                                            ? "line-through"
                                            : "none",
                                        color:
                                          task.status === "completed"
                                            ? "text.secondary"
                                            : "text.primary",
                                        fontWeight:
                                          task.status === "completed"
                                            ? 400
                                            : 500,
                                      }}
                                    >
                                      {task.name}
                                    </Typography>
                                  }
                                  secondary={
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        mt: 0.5,
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      <Chip
                                        label={
                                          currentTaskStatus?.label ||
                                          task.status
                                        }
                                        size="small"
                                        sx={{
                                          height: 20,
                                          fontSize: "0.65rem",
                                          backgroundColor: `${
                                            currentTaskStatus?.color ||
                                            "#757575"
                                          }20`,
                                          color:
                                            currentTaskStatus?.color ||
                                            "#757575",
                                          fontWeight: 600,
                                        }}
                                      />
                                      <Chip
                                        label={
                                          currentTaskPriority?.label ||
                                          task.priority
                                        }
                                        size="small"
                                        sx={{
                                          height: 20,
                                          fontSize: "0.65rem",
                                          backgroundColor: `${
                                            currentTaskPriority?.color ||
                                            "#757575"
                                          }20`,
                                          color:
                                            currentTaskPriority?.color ||
                                            "#757575",
                                          fontWeight: 600,
                                        }}
                                      />
                                    </Box>
                                  }
                                />
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                      </List>
                    )}
                  </Box>
                )}
                {tabValue === 2 && (
                  <Box
                    role="tabpanel"
                    id="project-tabpanel-2"
                    aria-labelledby="project-tab-2"
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      gutterBottom
                    >
                      Recent Activity
                    </Typography>
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 6,
                        border: "1px dashed",
                        borderColor: "divider",
                        borderRadius: 2,
                      }}
                    >
                      <Timeline
                        sx={{
                          fontSize: 48,
                          color: "text.secondary",
                          mb: 2,
                          opacity: 0.5,
                        }}
                      />
                      <Typography variant="subtitle1" color="text.secondary">
                        Activity tracking coming soon
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        Track all project updates and team activity
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: isMobile ? 2 : 3,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background:
                    "linear-gradient(135deg, rgba(139, 126, 200, 0.03), rgba(181, 169, 214, 0.05))",
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={600}
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                >
                  <InfoOutlined color="primary" />
                  Project Information
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2.5,
                    mt: 2,
                  }}
                >
                  {projectDueDate && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <CalendarToday color="primary" fontSize="small" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Due Date
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight={500}
                          sx={{
                            color: isOverdue ? "error.main" : "text.primary",
                          }}
                        >
                          {formatDate(projectDueDate)}{" "}
                          {isOverdue && "(Overdue)"}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <AccountCircle color="primary" fontSize="small" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Created by
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {project.createdByName || "N/A"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background:
                    "linear-gradient(135deg, rgba(139, 126, 200, 0.03), rgba(181, 169, 214, 0.05))",
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={600}
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                >
                  <PeopleOutline color="primary" />
                  Team
                </Typography>
                {project.assignedTo && project.assignedTo.length > 0 ? (
                  <AvatarGroup
                    max={8}
                    sx={{
                      justifyContent: "flex-start",
                      mt: 2,
                      "& .MuiAvatar-root": {
                        width: 32,
                        height: 32,
                        fontSize: "0.875rem",
                      },
                    }}
                  >
                    {project.assignedTo.map((member) => (
                      <Tooltip
                        key={member.id || member.email}
                        title={member.name || member.email}
                        arrow
                      >
                        <Avatar
                          sx={{
                            bgcolor: stringToColor(member.name || member.email),
                            border: `2px solid ${theme.palette.background.paper}`,
                          }}
                          src={member.photoURL}
                        >
                          {(member.name || member.email)
                            .charAt(0)
                            .toUpperCase()}
                        </Avatar>
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 2 }}
                  >
                    No members assigned.
                  </Typography>
                )}
              </Paper>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background:
                    "linear-gradient(135deg, rgba(139, 126, 200, 0.03), rgba(181, 169, 214, 0.05))",
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={600}
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                >
                  <BarChart color="primary" />
                  Quick Stats
                </Typography>
                <Grid container spacing={isMobile ? 1 : 2} sx={{ mt: 0.5 }}>
                  {quickStats.map((stat) => (
                    <Grid item xs={6} key={stat.label}>
                      <Card
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          textAlign: "left",
                          backgroundColor: `${stat.color}20`,
                          border: `1px solid ${stat.color}60`,
                          height: "100%",
                        }}
                      >
                        <Box sx={{ color: stat.color, mb: 1 }}>
                          {React.cloneElement(stat.icon, {
                            fontSize: "medium",
                          })}
                        </Box>
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          sx={{ color: stat.color }}
                        >
                          {stat.value}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: stat.color,
                            fontWeight: 500,
                            display: "block",
                          }}
                        >
                          {stat.label}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Box>
          </Grid>
        </Grid>
        <Dialog
          open={editDialogOpen}
          onClose={() => {
            if (!isSubmitting.projectEdit) setEditDialogOpen(false);
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              overflow: "visible",
            },
          }}
        >
          {isSubmitting.projectEdit && (
            <LinearProgress
              sx={{ position: "absolute", top: 0, width: "100%" }}
            />
          )}
          <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
            Edit Project
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Project Name"
              value={editForm.name}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, name: e.target.value }))
              }
              sx={{ mb: 2, mt: 1 }}
              disabled={isSubmitting.projectEdit}
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
              disabled={isSubmitting.projectEdit}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={isSubmitting.projectEdit}>
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
                <FormControl fullWidth disabled={isSubmitting.projectEdit}>
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
          </DialogContent>
          <DialogActions sx={{ p: "16px 24px" }}>
            <Button
              onClick={() => setEditDialogOpen(false)}
              sx={{ borderRadius: 2, px: 2 }}
              disabled={isSubmitting.projectEdit}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleEditProject}
              sx={{ borderRadius: 2, px: 2, minWidth: 120 }}
              disabled={isSubmitting.projectEdit || !editForm.name.trim()}
            >
              {isSubmitting.projectEdit ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={taskDialogOpen}
          onClose={() => {
            if (!isSubmitting.taskCreate) setTaskDialogOpen(false);
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, overflow: "visible" } }}
        >
          {isSubmitting.taskCreate && (
            <LinearProgress
              sx={{ position: "absolute", top: 0, width: "100%" }}
            />
          )}
          <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
            Add New Task
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Task Name"
              value={taskForm.name}
              onChange={(e) =>
                setTaskForm((prev) => ({ ...prev, name: e.target.value }))
              }
              sx={{ mb: 2, mt: 1 }}
              disabled={isSubmitting.taskCreate}
            />
            <TextField
              fullWidth
              label="Description"
              value={taskForm.description}
              onChange={(e) =>
                setTaskForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              multiline
              rows={2}
              sx={{ mb: 2 }}
              disabled={isSubmitting.taskCreate}
            />
            <TextField
              fullWidth
              label="Category (Optional)"
              value={taskForm.category}
              onChange={(e) =>
                setTaskForm((prev) => ({ ...prev, category: e.target.value }))
              }
              sx={{ mb: 2 }}
              disabled={isSubmitting.taskCreate}
            />
            <TextField
              fullWidth
              label="Subcategory (Optional)"
              value={taskForm.subcategory}
              onChange={(e) =>
                setTaskForm((prev) => ({
                  ...prev,
                  subcategory: e.target.value,
                }))
              }
              sx={{ mb: 2 }}
              disabled={isSubmitting.taskCreate}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={isSubmitting.taskCreate}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={taskForm.status}
                    label="Status"
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                  >
                    {taskStatusOptions.map((option) => (
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
                <FormControl fullWidth disabled={isSubmitting.taskCreate}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={taskForm.priority}
                    label="Priority"
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                  >
                    {taskPriorityOptions.map((option) => (
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
          </DialogContent>
          <DialogActions sx={{ p: "16px 24px" }}>
            <Button
              onClick={() => setTaskDialogOpen(false)}
              sx={{ borderRadius: 2, px: 2 }}
              disabled={isSubmitting.taskCreate}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateTask}
              disabled={!taskForm.name.trim() || isSubmitting.taskCreate}
              sx={{ borderRadius: 2, px: 2, minWidth: 100 }}
            >
              {isSubmitting.taskCreate ? "Adding..." : "Add Task"}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={deleteDialogOpen}
          onClose={() => {
            if (!isSubmitting.projectDelete) setDeleteDialogOpen(false);
          }}
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          {isSubmitting.projectDelete && (
            <LinearProgress
              color="error"
              sx={{ position: "absolute", top: 0, width: "100%" }}
            />
          )}
          <DialogTitle sx={{ fontWeight: 600 }}>Delete Project</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the project "<b>{project.name}</b>
              "? This action is permanent and cannot be undone. All associated
              tasks will also be deleted.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isSubmitting.projectDelete}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              disabled={isSubmitting.projectDelete}
              sx={{ minWidth: 120, borderRadius: 2 }}
            >
              {isSubmitting.projectDelete ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogActions>
        </Dialog>
        <Menu
          id="project-actions-menu"
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: 180,
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            },
          }}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem
            onClick={() => {
              setEditDialogOpen(true);
              handleMenuClose();
            }}
            sx={{ py: 1.25, px: 2 }}
          >
            <Edit fontSize="small" sx={{ mr: 1.5, color: "text.secondary" }} />
            Edit Project
          </MenuItem>
          <MenuItem
            onClick={() => {
              setDeleteDialogOpen(true);
              handleMenuClose();
            }}
            sx={{ py: 1.25, px: 2, color: "error.main" }}
          >
            <Delete fontSize="small" sx={{ mr: 1.5 }} />
            Delete Project
          </MenuItem>
        </Menu>
      </Box>
    </Fade>
  );
};

export default ProjectDetails;
