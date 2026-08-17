// src/components/client/ClientProjectDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Avatar,
  AvatarGroup,
  Divider,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
} from "@mui/material";
import {
  ArrowBack,
  Assignment,
  CheckCircle,
  Schedule,
  Block,
  CalendarToday,
  People,
  Comment,
  ViewKanban,
  ViewList,
  Person,
  Category as CategoryIcon,
  Flag,
} from "@mui/icons-material";
import useProject from "../../hooks/useProject";
import useAuth from "../../hooks/useAuth";
import { stringToColor } from "../../helpers/stringToColor";

const ClientProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { projects, getTasksByProject, milestones, addTaskComment, loading } = useProject();
  const [project, setProject] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'kanban'
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null); // For nested replies

  const tasks = getTasksByProject(id);
  const projectMilestones = milestones.filter((m) => m.projectId === id);
  const teamMembers =
    project?.teamMembers ||
    (project?.assignedTo || []).filter((member) => typeof member === "object");

  useEffect(() => {
    const foundProject = projects.find(
      (candidate) =>
        candidate.id === id && candidate.clientUserIds?.includes(currentUser.uid)
    );
    setProject(foundProject);
  }, [id, projects, currentUser.uid]);

  useEffect(() => {
    if (!selectedTask) return;
    const updatedTask = tasks.find((task) => task.id === selectedTask.id);
    if (updatedTask && updatedTask !== selectedTask) setSelectedTask(updatedTask);
  }, [tasks, selectedTask]);

  if (!project) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          {loading ? "Opening your project..." : "Project access unavailable"}
        </Typography>
        {!loading && (
          <>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              This project is not assigned to your client account.
            </Typography>
            <Button onClick={() => navigate("/client/dashboard")}>Back to dashboard</Button>
          </>
        )}
      </Box>
    );
  }

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const blockedTasks = tasks.filter((t) => t.status === "blocked").length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

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

  const getTaskStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#64B5F6";
      case "in-progress":
        return "#FFB74D";
      case "completed":
        return "#81C784";
      case "blocked":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "#6BBF6B";
      case "medium":
        return "#FFD700";
      case "high":
        return "#DC3545";
      default:
        return "#9E9E9E";
    }
  };

  const handleOpenComment = (task) => {
    setSelectedTask(task);
    setReplyTo(null);
    setCommentDialogOpen(true);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    
    try {
      if (!selectedTask.id) {
        alert("This task doesn't have a valid ID. It may not have been saved to the database yet.");
        return;
      }
      
      await addTaskComment(selectedTask.id, {
        text: newComment,
        parentId: replyTo?.id || null,
      });
      
      setNewComment("");
      setReplyTo(null);
    } catch (error) {
      console.error("Error adding comment:", error);
      alert(`Failed to add comment: ${error.message}`);
    }
  };

  const getAssigneeName = (assigneeId) => {
    const task = tasks.find((candidate) => candidate.assignedTo === assigneeId);
    return task?.assignedToName || "Project team";
  };

  const getMilestoneName = (milestoneId) => {
    const milestone = projectMilestones.find((m) => m.id === milestoneId);
    return milestone?.name || null;
  };

  const renderKanbanView = () => {
    const columns = [
      { status: "pending", label: "To Do", color: "#64B5F6" },
      { status: "in-progress", label: "In Progress", color: "#FFB74D" },
      { status: "completed", label: "Completed", color: "#81C784" },
      { status: "blocked", label: "Blocked", color: "#F44336" },
    ];

    return (
      <Grid container spacing={2}>
        {columns.map((column) => (
          <Grid item xs={12} md={3} key={column.status}>
            <Paper
              sx={{
                p: 2,
                minHeight: 500,
                backgroundColor: `${column.color}10`,
                border: `2px solid ${column.color}40`,
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight={600}
                sx={{ mb: 2, color: column.color }}
              >
                {column.label} ({tasks.filter((t) => t.status === column.status).length})
              </Typography>
              {tasks
                .filter((t) => t.status === column.status)
                .map((task) => (
                  <Card key={task.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="body1" fontWeight={600} gutterBottom>
                        {task.name}
                      </Typography>
                      {task.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {task.description}
                        </Typography>
                      )}
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                        {task.priority && (
                          <Chip
                            label={task.priority}
                            size="small"
                            sx={{
                              backgroundColor: getPriorityColor(task.priority),
                              color: "white",
                              textTransform: "capitalize",
                            }}
                            icon={<Flag sx={{ color: "white !important" }} />}
                          />
                        )}
                        {task.category && (
                          <Chip
                            label={task.category}
                            size="small"
                            variant="outlined"
                            icon={<CategoryIcon />}
                          />
                        )}
                      </Box>
                      {task.assignedTo && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <Person fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {getAssigneeName(task.assignedTo)}
                          </Typography>
                        </Box>
                      )}
                      {task.milestoneId && getMilestoneName(task.milestoneId) && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Milestone: {getMilestoneName(task.milestoneId)}
                        </Typography>
                      )}
                      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                        <Tooltip title="Add Comment">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenComment(task)}
                          >
                            <Comment fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderListView = () => (
    <List>
      {tasks.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
          No tasks in this project yet
        </Typography>
      ) : (
        tasks.map((task, index) => (
          <React.Fragment key={task.id}>
            {index > 0 && <Divider />}
            <ListItem
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                py: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  width: "100%",
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {task.name}
                  </Typography>
                  {task.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {task.description}
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                    <Chip
                      label={task.status}
                      size="small"
                      sx={{
                        backgroundColor: getTaskStatusColor(task.status),
                        color: "white",
                        textTransform: "capitalize",
                      }}
                    />
                    {task.priority && (
                      <Chip
                        label={task.priority}
                        size="small"
                        sx={{
                          backgroundColor: getPriorityColor(task.priority),
                          color: "white",
                          textTransform: "capitalize",
                        }}
                        icon={<Flag sx={{ color: "white !important" }} />}
                      />
                    )}
                    {task.category && (
                      <Chip
                        label={task.category}
                        size="small"
                        variant="outlined"
                        icon={<CategoryIcon />}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
                    {task.assignedTo && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Person fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {getAssigneeName(task.assignedTo)}
                        </Typography>
                      </Box>
                    )}
                    {task.milestoneId && getMilestoneName(task.milestoneId) && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Assignment fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {getMilestoneName(task.milestoneId)}
                        </Typography>
                      </Box>
                    )}
                    {task.dueDate && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(
                            task.dueDate.toDate ? task.dueDate.toDate() : task.dueDate
                          ).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
                <Tooltip title="Add Comment">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenComment(task)}
                    sx={{ ml: 2 }}
                  >
                    <Comment />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItem>
          </React.Fragment>
        ))
      )}
    </List>
  );

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate("/client/dashboard")}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              {project.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {project.description || "No description"}
            </Typography>
          </Box>
          <Chip
            label={project.status}
            sx={{
              backgroundColor: getStatusColor(project.status),
              color: "white",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Overall Progress
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: "rgba(139, 126, 200, 0.1)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 5,
                    background: "linear-gradient(90deg, #8B7EC8, #B5A9D6)",
                  },
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarToday fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Due Date:
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {project.dueDate
                  ? new Date(
                      project.dueDate.toDate ? project.dueDate.toDate() : project.dueDate
                    ).toLocaleDateString()
                  : "Not set"}
              </Typography>
            </Box>
            {teamMembers.length > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                <People fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Team:
                </Typography>
                <AvatarGroup max={5} sx={{ "& .MuiAvatar-root": { width: 28, height: 28 } }}>
                  {teamMembers.map((member, idx) => (
                    <Tooltip key={idx} title={member?.name || member?.email || "Team"}>
                      <Avatar
                        sx={{
                          bgcolor: stringToColor(member?.name || member?.email || "T"),
                          fontSize: "0.75rem",
                        }}
                        src={member?.photoURL}
                      >
                        {(member?.name || member?.email || "T").charAt(0).toUpperCase()}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar sx={{ bgcolor: "success.main", mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {completedTasks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar sx={{ bgcolor: "warning.main", mr: 2 }}>
                  <Schedule />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {inProgressTasks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar sx={{ bgcolor: "info.main", mr: 2 }}>
                  <Assignment />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {pendingTasks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar sx={{ bgcolor: "error.main", mr: 2 }}>
                  <Block />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {blockedTasks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Blocked
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
              <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                <Tab label="Tasks" />
                <Tab label="Milestones" />
              </Tabs>
            </Box>

            {tabValue === 0 && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Project Tasks</Typography>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, mode) => mode && setViewMode(mode)}
                    size="small"
                  >
                    <ToggleButton value="list">
                      <Tooltip title="List View">
                        <ViewList />
                      </Tooltip>
                    </ToggleButton>
                    <ToggleButton value="kanban">
                      <Tooltip title="Kanban View">
                        <ViewKanban />
                      </Tooltip>
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                {viewMode === "kanban" ? renderKanbanView() : renderListView()}
              </>
            )}

            {tabValue === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Project Milestones
                </Typography>
                {projectMilestones.length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                    No milestones defined yet
                  </Typography>
                ) : (
                  <List>
                    {projectMilestones.map((milestone, index) => (
                      <React.Fragment key={milestone.id}>
                        {index > 0 && <Divider />}
                        <ListItem>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" fontWeight={600}>
                                {milestone.name}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                {milestone.description && (
                                  <Typography variant="body2" color="text.secondary">
                                    {milestone.description}
                                  </Typography>
                                )}
                                {milestone.dueDate && (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      mt: 0.5,
                                    }}
                                  >
                                    <CalendarToday fontSize="small" />
                                    <Typography variant="caption">
                                      Due:{" "}
                                      {new Date(
                                        milestone.dueDate.toDate
                                          ? milestone.dueDate.toDate()
                                          : milestone.dueDate
                                      ).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                          <Chip
                            label={milestone.status || "pending"}
                            size="small"
                            sx={{
                              textTransform: "capitalize",
                              backgroundColor: getTaskStatusColor(
                                milestone.status || "pending"
                              ),
                              color: "white",
                            }}
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Comment Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={() => {
          setCommentDialogOpen(false);
          setNewComment("");
          setSelectedTask(null);
          setReplyTo(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTask && (
            <Box>
              <Typography variant="h6">Comments</Typography>
              <Typography variant="body2" color="text.secondary">
                Task: {selectedTask.name}
              </Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {/* Existing Comments */}
          {selectedTask && selectedTask.comments && selectedTask.comments.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                All Comments ({selectedTask.comments.length})
              </Typography>
              <List sx={{ maxHeight: 400, overflowY: "auto" }}>
                {selectedTask.comments
                  .filter((comment) => !comment.parentId) // Top-level comments only
                  .map((comment) => (
                    <Box key={comment.id}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          flexDirection: "column",
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          mb: 1,
                          backgroundColor: "background.paper",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, width: "100%" }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: stringToColor(comment.userName || comment.userEmail),
                            }}
                          >
                            {(comment.userName || comment.userEmail).charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {comment.userName || comment.userEmail}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(comment.createdAt || comment.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            onClick={() => {
                              setReplyTo(comment);
                              setNewComment("");
                            }}
                            sx={{ textTransform: "none" }}
                          >
                            Reply
                          </Button>
                        </Box>
                        <Typography variant="body2" sx={{ pl: 5 }}>
                          {comment.text}
                        </Typography>
                        
                        {/* Nested Replies */}
                        {selectedTask.comments
                          .filter((reply) => reply.parentId === comment.id)
                          .map((reply) => (
                            <Box
                              key={reply.id}
                              sx={{
                                pl: 5,
                                pt: 2,
                                mt: 2,
                                borderLeft: "2px solid",
                                borderColor: "primary.main",
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                <Avatar
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    bgcolor: stringToColor(reply.userName || reply.userEmail),
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {(reply.userName || reply.userEmail).charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="caption" fontWeight={600}>
                                    {reply.userName || reply.userEmail}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                    {new Date(reply.createdAt || reply.timestamp).toLocaleString()}
                                  </Typography>
                                </Box>
                              </Box>
                              <Typography variant="body2" sx={{ pl: 4 }}>
                                {reply.text}
                              </Typography>
                            </Box>
                          ))}
                      </ListItem>
                    </Box>
                  ))}
              </List>
            </Box>
          )}

          {selectedTask && selectedTask.comments && selectedTask.comments.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: "center", py: 2 }}>
              No comments yet. Be the first to comment!
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Add New Comment */}
          <Box>
            {replyTo && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1,
                  p: 1,
                  backgroundColor: "action.hover",
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption" sx={{ flex: 1 }}>
                  Replying to {replyTo.userName || replyTo.userEmail}
                </Typography>
                <IconButton size="small" onClick={() => setReplyTo(null)}>
                  <Typography variant="caption">✕</Typography>
                </IconButton>
              </Box>
            )}
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder={replyTo ? "Write your reply..." : "Write your comment..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              autoFocus={!replyTo}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCommentDialogOpen(false);
              setNewComment("");
              setSelectedTask(null);
              setReplyTo(null);
            }}
          >
            Close
          </Button>
          <Button
            onClick={handleAddComment}
            variant="contained"
            disabled={!newComment.trim()}
          >
            {replyTo ? "Reply" : "Add Comment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientProjectDetails;
