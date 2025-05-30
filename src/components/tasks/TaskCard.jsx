import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  LinearProgress,
  Tooltip,
  Collapse,
  Divider,
  Badge,
} from "@mui/material";
import {
  MoreVert,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  CheckCircle,
  Schedule,
  Assignment,
  Person,
  Comment,
  AttachFile,
  ExpandMore,
  ExpandLess,
  AccessTime,
  CalendarToday,
} from "@mui/icons-material";
import useProject from "../../hooks/useProject";

const statusOptions = [
  {
    value: "pending",
    label: "Pending",
    color: "#64B5F6",
    icon: <Schedule />,
  },
  {
    value: "in-progress",
    label: "In Progress",
    color: "#FFB74D",
    icon: <PlayArrow />,
  },
  {
    value: "completed",
    label: "Completed",
    color: "#81C784",
    icon: <CheckCircle />,
  },
  {
    value: "blocked",
    label: "Blocked",
    color: "#E57373",
    icon: <Pause />,
  },
];

const priorityOptions = [
  { value: "low", label: "Low", color: "#81C784" },
  { value: "medium", label: "Medium", color: "#FFD54F" },
  { value: "high", label: "High", color: "#FFB74D" },
  { value: "urgent", label: "Urgent", color: "#E57373" },
];

const TaskCard = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  showProject = true,
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const { projects, employees, updateTask } = useProject();

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateTask(task.id, { status: newStatus });
      if (onStatusChange) {
        onStatusChange(task.id, newStatus);
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(task);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(task);
    }
    handleMenuClose();
  };

  const getProject = () => {
    return projects.find((p) => p.id === task.projectId);
  };

  const getAssignedEmployee = () => {
    return employees.find((emp) => emp.id === task.assignedTo);
  };

  const getStatusInfo = (status) => {
    return statusOptions.find((s) => s.value === status) || statusOptions[0];
  };

  const getPriorityInfo = (priority) => {
    return (
      priorityOptions.find((p) => p.value === priority) || priorityOptions[1]
    );
  };

  const formatDate = (date) => {
    if (!date) return null;
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = () => {
    if (!task.dueDate) return false;
    const dueDate = task.dueDate.toDate
      ? task.dueDate.toDate()
      : new Date(task.dueDate);
    return dueDate < new Date() && task.status !== "completed";
  };

  const getDaysUntilDue = () => {
    if (!task.dueDate) return null;
    const dueDate = task.dueDate.toDate
      ? task.dueDate.toDate()
      : new Date(task.dueDate);
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const statusInfo = getStatusInfo(task.status);
  const priorityInfo = getPriorityInfo(task.priority);
  const project = getProject();
  const assignedEmployee = getAssignedEmployee();
  const daysUntilDue = getDaysUntilDue();

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        borderRadius: 3,
        transition: "all 0.3s ease-in-out",
        border:
          task.status === "completed"
            ? "1px solid #A8E6CF"
            : "1px solid rgba(139, 126, 200, 0.1)",
        opacity: task.status === "completed" ? 0.8 : 1,
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 25px rgba(139, 126, 200, 0.15)",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${priorityInfo.color}, ${priorityInfo.color}80)`,
          borderRadius: "12px 12px 0 0",
        }}
      />
      <CardContent sx={{ flexGrow: 1, p: 3, pb: 1 }}>
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
              sx={{
                fontWeight: 600,
                mb: 1,
                textDecoration:
                  task.status === "completed" ? "line-through" : "none",
                color:
                  task.status === "completed"
                    ? "text.secondary"
                    : "text.primary",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {task.name}
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
                label={statusInfo.label}
                size="small"
                icon={statusInfo.icon}
                sx={{
                  backgroundColor: statusInfo.color,
                  color: "white",
                  fontWeight: 500,
                  "& .MuiChip-icon": { color: "white" },
                }}
              />
              <Chip
                label={priorityInfo.label}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: priorityInfo.color,
                  color: priorityInfo.color,
                  fontWeight: 500,
                }}
              />
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}
          >
            <MoreVert />
          </IconButton>
        </Box>
        {showProject && project && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Assignment sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {project.name}
            </Typography>
          </Box>
        )}
        {task.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: "-webkit-box",
              WebkitLineClamp: compact ? 2 : 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.4,
            }}
          >
            {task.description}
          </Typography>
        )}
        <Box sx={{ mb: 2 }}>
          {task.category && (
            <Chip
              label={task.category}
              size="small"
              variant="outlined"
              sx={{
                mr: 1,
                mb: 1,
                borderColor: "rgba(139, 126, 200, 0.3)",
                color: "#8B7EC8",
              }}
            />
          )}
          {task.tags &&
            task.tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{
                  mr: 0.5,
                  mb: 1,
                  fontSize: "0.7rem",
                  height: 20,
                  borderColor: "rgba(139, 126, 200, 0.2)",
                  color: "text.secondary",
                }}
              />
            ))}
        </Box>
        {assignedEmployee && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Person sx={{ fontSize: 16, color: "text.secondary" }} />
            <Avatar
              src={assignedEmployee.photoURL}
              sx={{ width: 24, height: 24, bgcolor: "primary.main" }}
            >
              {assignedEmployee.name?.charAt(0)}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {assignedEmployee.name}
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          {task.dueDate && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <CalendarToday
                sx={{
                  fontSize: 14,
                  color: isOverdue() ? "#FFAAA5" : "text.secondary",
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: isOverdue() ? "#FFAAA5" : "text.secondary",
                  fontWeight: isOverdue() ? 600 : 400,
                }}
              >
                Due {formatDate(task.dueDate)}
                {daysUntilDue !== null &&
                  daysUntilDue <= 7 &&
                  daysUntilDue > 0 &&
                  ` (${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""})`}
                {isOverdue() && " (Overdue)"}
              </Typography>
            </Box>
          )}
          {task.estimatedHours && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <AccessTime sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {task.estimatedHours}h
              </Typography>
            </Box>
          )}
        </Box>
        {task.status === "in-progress" && task.subtasks && (
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(
                  ((task.completedSubtasks || 0) / task.subtasks.length) * 100
                )}
                %
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={
                ((task.completedSubtasks || 0) / task.subtasks.length) * 100
              }
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: "rgba(139, 126, 200, 0.1)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 3,
                  backgroundColor: "#FFD3A5",
                },
              }}
            />
          </Box>
        )}
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0, justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          {task.status !== "completed" && (
            <Tooltip title="Mark as Complete">
              <IconButton
                size="small"
                onClick={() => handleStatusChange("completed")}
                sx={{ color: "#A8E6CF" }}
              >
                <CheckCircle />
              </IconButton>
            </Tooltip>
          )}
          {task.status === "pending" && (
            <Tooltip title="Start Task">
              <IconButton
                size="small"
                onClick={() => handleStatusChange("in-progress")}
                sx={{ color: "#FFD3A5" }}
              >
                <PlayArrow />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {task.comments && task.comments.length > 0 && (
            <Badge badgeContent={task.comments.length} color="primary">
              <Comment sx={{ fontSize: 16, color: "text.secondary" }} />
            </Badge>
          )}
          {task.attachments && task.attachments.length > 0 && (
            <Badge badgeContent={task.attachments.length} color="primary">
              <AttachFile sx={{ fontSize: 16, color: "text.secondary" }} />
            </Badge>
          )}
          {!compact && task.description && (
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ color: "text.secondary" }}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </Box>
      </CardActions>
      {!compact && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider />
          <CardContent sx={{ pt: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.6 }}
            >
              {task.description}
            </Typography>
            {task.subtasks && task.subtasks.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Subtasks ({task.completedSubtasks || 0}/{task.subtasks.length}
                  )
                </Typography>
                {task.subtasks.slice(0, 3).map((subtask, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    <CheckCircle
                      sx={{
                        fontSize: 16,
                        color: subtask.completed ? "#A8E6CF" : "text.secondary",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        textDecoration: subtask.completed
                          ? "line-through"
                          : "none",
                        color: subtask.completed
                          ? "text.secondary"
                          : "text.primary",
                      }}
                    >
                      {subtask.name}
                    </Typography>
                  </Box>
                ))}
                {task.subtasks.length > 3 && (
                  <Typography variant="caption" color="text.secondary">
                    +{task.subtasks.length - 3} more subtasks
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Collapse>
      )}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 150 },
        }}
      >
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit Task
        </MenuItem>
        {task.status !== "completed" && (
          <MenuItem onClick={() => handleStatusChange("completed")}>
            <CheckCircle fontSize="small" sx={{ mr: 1, color: "#A8E6CF" }} />
            Mark Complete
          </MenuItem>
        )}
        {task.status === "pending" && (
          <MenuItem onClick={() => handleStatusChange("in-progress")}>
            <PlayArrow fontSize="small" sx={{ mr: 1, color: "#FFD3A5" }} />
            Start Task
          </MenuItem>
        )}
        {task.status === "in-progress" && (
          <MenuItem onClick={() => handleStatusChange("pending")}>
            <Pause fontSize="small" sx={{ mr: 1, color: "#A5C9FF" }} />
            Pause Task
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete Task
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default TaskCard;
