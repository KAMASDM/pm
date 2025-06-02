import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  AvatarGroup,
  Tooltip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fade,
} from "@mui/material";
import {
  MoreVert,
  Edit,
  Delete,
  Visibility,
  AccessTime,
  Assignment,
  Group,
} from "@mui/icons-material";
import useProject from "../../hooks/useProject";
import { stringToColor } from "../../helpers/stringToColor";

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();
  const { deleteProject, getTasksByProject } = useProject();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const tasks = getTasksByProject(project.id);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setIsDeleting(false);
      setOpenConfirmDialog(false);
    }
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
    navigate(`/projects/${project.id}/edit`);
  };

  const handleView = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
    navigate(`/projects/${project.id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "planning":
        return "#64B5F6";
      case "in-progress":
        return "#FFB74D";
      case "completed":
        return "#81C784";
      case "on-hold":
        return "#F44336";
      default:
        return "#E6E6FA";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "planning":
        return "Planning";
      case "in-progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "on-hold":
        return "On Hold";
      default:
        return "Unknown";
    }
  };

  const calculateProgress = () => {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(
      (task) => task.status === "completed"
    ).length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const formatDate = (date) => {
    if (!date) return "Not set";
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const progress = calculateProgress();
  const isOverdue =
    project.dueDate &&
    new Date(
      project.dueDate.toDate ? project.dueDate.toDate() : project.dueDate
    ) < new Date();

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        position: "relative",
        overflow: "visible",
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 32px rgba(139, 126, 200, 0.2)",
        },
      }}
      onClick={handleView}
    >
      <Box
        sx={{
          position: "absolute",
          top: -8,
          right: 16,
          zIndex: 1,
        }}
      >
        <Chip
          label={getStatusLabel(project.status)}
          size="small"
          sx={{
            backgroundColor: getStatusColor(project.status),
            color: "white",
            fontWeight: 600,
            fontSize: "0.75rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box sx={{ flex: 1, mr: 2 }}>
            <Typography
              variant="h6"
              component="h3"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: "text.primary",
                lineHeight: 1.2,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {project.name}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{
              opacity: 0.7,
              "&:hover": { opacity: 1 },
            }}
          >
            <MoreVert />
          </IconButton>
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 3,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.5,
          }}
        >
          {project.description || "No description provided"}
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <Assignment fontSize="small" />
              Progress
            </Typography>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: "rgba(139, 126, 200, 0.1)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                background:
                  progress === 100
                    ? "linear-gradient(90deg, #A8E6CF, #7FBF7F)"
                    : "linear-gradient(90deg, #8B7EC8, #B5A9D6)",
              },
            }}
          />
        </Box>
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Assignment fontSize="small" sx={{ color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {tasks?.length || 0} tasks
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Group fontSize="small" sx={{ color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {project.assignedTo?.length || 0} members
            </Typography>
          </Box>
        </Box>
        {project.dueDate && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 1.5,
              borderRadius: 2,
              backgroundColor: isOverdue
                ? "rgba(255, 170, 165, 0.1)"
                : "rgba(139, 126, 200, 0.1)",
              border: `1px solid ${
                isOverdue
                  ? "rgba(255, 170, 165, 0.3)"
                  : "rgba(139, 126, 200, 0.2)"
              }`,
              mb: 2,
            }}
          >
            <AccessTime
              fontSize="small"
              sx={{ color: isOverdue ? "#FFAAA5" : "#8B7EC8" }}
            />
            <Typography
              variant="body2"
              sx={{
                color: isOverdue ? "#FFAAA5" : "#8B7EC8",
                fontWeight: 500,
              }}
            >
              Due {formatDate(project.dueDate)}
              {isOverdue && " (Overdue)"}
            </Typography>
          </Box>
        )}
        {project.assignedTo && project.assignedTo.length > 0 && (
          <Box>
            <Typography
              variant="body2"
              fontWeight={500}
              color="text.secondary"
              sx={{ mb: 1.5 }}
            >
              Team
            </Typography>

            {project.assignedTo.length === 1 ? (
              <Tooltip
                title={
                  project.assignedTo[0].name || project.assignedTo[0].email
                }
                placement="top"
                arrow
                TransitionComponent={Fade}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: stringToColor(
                      project.assignedTo[0].name || project.assignedTo[0].email
                    ),
                    fontSize: "1rem",
                    border: (theme) =>
                      `2px solid ${theme.palette.background.paper}`,
                  }}
                  src={project.assignedTo[0].photoURL}
                >
                  {(project.assignedTo[0].name || project.assignedTo[0].email)
                    ?.charAt(0)
                    ?.toUpperCase()}
                </Avatar>
              </Tooltip>
            ) : (
              <AvatarGroup
                max={4}
                sx={{
                  justifyContent: "flex-start",
                  "& .MuiAvatar-root": {
                    width: 36,
                    height: 36,
                    fontSize: "1rem",
                    border: (theme) =>
                      `2px solid ${theme.palette.background.paper}`,
                  },
                }}
              >
                {project.assignedTo.map((member) => (
                  <Tooltip
                    key={member.id || member.email}
                    title={member.name || member.email}
                    placement="top"
                    arrow
                    TransitionComponent={Fade}
                  >
                    <Avatar
                      sx={{
                        bgcolor: stringToColor(member.name || member.email),
                      }}
                      src={member.photoURL}
                    >
                      {(member.name || member.email).charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            )}
          </Box>
        )}
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Visibility />}
          onClick={handleView}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 500,
            borderColor: "rgba(139, 126, 200, 0.3)",
            color: "#8B7EC8",
            "&:hover": {
              borderColor: "#8B7EC8",
              backgroundColor: "rgba(139, 126, 200, 0.1)",
            },
          }}
        >
          View Details
        </Button>
      </CardActions>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 150 },
        }}
      >
        <MenuItem onClick={handleView} sx={{ color: "#1976d2" }}>
          <Visibility fontSize="small" sx={{ mr: 1, color: "#1976d2" }} />
          View
        </MenuItem>
        <MenuItem onClick={handleEdit} sx={{ color: "#f57c00" }}>
          <Edit fontSize="small" sx={{ mr: 1, color: "#f57c00" }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={(event) => {
            event.stopPropagation();
            setOpenConfirmDialog(true);
            handleMenuClose(event);
          }}
          sx={{ color: "#d32f2f" }}
        >
          <Delete fontSize="small" sx={{ mr: 1, color: "#d32f2f" }} />
          Delete
        </MenuItem>
      </Menu>
      <Dialog
        open={openConfirmDialog}
        onClose={(event) => {
          if (event) {
            event.stopPropagation();
          }
          setOpenConfirmDialog(false);
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        sx={{ "& .MuiPaper-root": { borderRadius: 3, overflow: "hidden" } }}
        onBackdropClick={(event) => {
          event.stopPropagation();
        }}
      >
        {isDeleting && <LinearProgress color="error" />}
        <DialogTitle id="alert-dialog-title" sx={{ fontWeight: 600 }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete the project "
            <Typography component="span" fontWeight={600}>
              {project.name}
            </Typography>
            "?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              setOpenConfirmDialog(false);
            }}
            disabled={isDeleting}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
              color: "text.secondary",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              handleDelete();
            }}
            autoFocus
            variant="contained"
            color="error"
            disabled={isDeleting}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
              minWidth: 90,
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ProjectCard;
