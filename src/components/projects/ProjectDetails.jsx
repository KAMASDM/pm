import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Tooltip,
  Fade,
  Skeleton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  Delete,
  Add,
  MoreVert,
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
import Milestone from "./Milestone";

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

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    projects,
    updateProject,
    deleteProject,
    getTasksByProject,
    milestones,
    loadMilestones,
    createMilestone,
    deleteMilestone,
    updateMilestone,
  } = useProject();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState({
    projectEdit: false,
    projectDelete: false,
  });
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    status: "",
    priority: "",
    dueDate: null,
  });
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [editingMilestone, setEditingMilestone] = useState(null);

  const tasks = getTasksByProject(id);

  useEffect(() => {
    if (id) {
      loadMilestones(id);
    }
  }, [id, loadMilestones]);

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
    } else {
      setProject(null);
    }
    setLoading(false);
  }, [id, projects]);

  const handleAddMilestone = async () => {
    if (newMilestoneName.trim() === "") return;
    const milestoneData = {
      name: newMilestoneName,
      projectId: id,
      status: "upcoming",
    };
    await createMilestone(milestoneData);
    setNewMilestoneName("");
    setShowAddMilestone(false);
  };

  const handleEditMilestone = (milestone) => {
    setEditingMilestone(milestone);
  };

  const handleUpdateMilestone = async () => {
    if (!editingMilestone) return;
    await updateMilestone(editingMilestone.id, editingMilestone, id);
    setEditingMilestone(null);
  };

  const handleDeleteMilestone = async (milestoneId) => {
    await deleteMilestone(milestoneId, id);
  };

  const progressValue = useMemo(() => {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(
      (task) => task.status === "completed"
    ).length;
    return Math.round((completedTasks / tasks.length) * 100);
  }, [tasks]);

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
      return tasks.filter((task) => task.status === status);
    },
    [tasks]
  );

  const quickStats = useMemo(
    () => [
      {
        label: "Total Tasks",
        value: tasks.length,
        icon: <DonutLarge />,
        color: theme.palette.primary.main,
      },
      {
        label: "Completed",
        value: getTasksByStatus("completed").length,
        icon: <CheckCircleOutline />,
        color:
          statusOptions.find((opt) => opt.value === "completed")?.color ||
          "#81C784",
      },
      {
        label: "In Progress",
        value: getTasksByStatus("in-progress").length,
        icon: <Cached />,
        color:
          statusOptions.find((opt) => opt.value === "in-progress")?.color ||
          "#FFB74D",
      },
      {
        label: "Pending",
        value: getTasksByStatus("pending").length,
        icon: <HourglassEmpty />,
        color:
          statusOptions.find((opt) => opt.value === "pending")?.color ||
          "#64B5F6",
      },
      {
        label: "Blocked",
        value: getTasksByStatus("blocked").length,
        icon: <Block />,
        color:
          statusOptions.find((opt) => opt.value === "blocked")?.color ||
          "#F44336",
      },
    ],
    [getTasksByStatus, tasks.length, theme.palette.primary.main]
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

  // progressValue is now a value, not a function
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
          <Grid item xs={12}>
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
                      {tasks.filter((t) => t.status === "completed").length}
                    </Box>{" "}
                    of{" "}
                    <Box
                      component="span"
                      sx={{ color: "text.primary", fontWeight: 600 }}
                    >
                      {tasks.length}
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
                    label="Milestones"
                    id="project-tab-0"
                    aria-controls="project-tabpanel-0"
                    sx={{
                      minWidth: isMobile ? "auto" : 120,
                      textTransform: "none",
                    }}
                  />
                  <Tab
                    label="Activity"
                    id="project-tab-1"
                    aria-controls="project-tabpanel-1"
                    sx={{
                      minWidth: isMobile ? "auto" : 120,
                      textTransform: "none",
                    }}
                  />
                </Tabs>
              </Box>
              <Box sx={{ p: isMobile ? 2 : 3 }}>
                {tabValue === 0 && (
                  <Grid container spacing={2}>
                    {milestones.map((milestone) => (
                      <Grid item xs={12} md={4} key={milestone.id}>
                        <Milestone
                          milestone={milestone}
                          onMilestoneDelete={handleDeleteMilestone}
                          onMilestoneEdit={handleEditMilestone}
                        />
                      </Grid>
                    ))}
                    <Grid item xs={12} md={4}>
                      {showAddMilestone ? (
                        <Paper sx={{ p: 2 }}>
                          <TextField
                            fullWidth
                            label="New Milestone Name"
                            value={newMilestoneName}
                            onChange={(e) =>
                              setNewMilestoneName(e.target.value)
                            }
                            autoFocus
                          />
                          <Box sx={{ mt: 1 }}>
                            <Button onClick={handleAddMilestone}>Add</Button>
                            <Button
                              onClick={() => setShowAddMilestone(false)}
                              color="error"
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Paper>
                      ) : (
                        <Button
                          startIcon={<Add />}
                          onClick={() => setShowAddMilestone(true)}
                          fullWidth
                          sx={{ height: "100%", border: "1px dashed grey" }}
                        >
                          Add Milestone
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                )}
                {tabValue === 1 && (
                  <Box
                    role="tabpanel"
                    id="project-tabpanel-1"
                    aria-labelledby="project-tab-1"
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
              Are you sure you want to delete the project "
              <b>{project?.name}</b>
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
        <Dialog
          open={!!editingMilestone}
          onClose={() => setEditingMilestone(null)}
        >
          <DialogTitle>Edit Milestone</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Milestone Name"
              type="text"
              fullWidth
              value={editingMilestone?.name || ""}
              onChange={(e) =>
                setEditingMilestone({
                  ...editingMilestone,
                  name: e.target.value,
                })
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingMilestone(null)}>Cancel</Button>
            <Button onClick={handleUpdateMilestone}>Save</Button>
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