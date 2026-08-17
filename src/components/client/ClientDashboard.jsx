// src/components/client/ClientDashboard.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  IconButton,
  Tooltip,
  AvatarGroup,
} from "@mui/material";
import {
  Folder,
  Assignment,
  Schedule,
  CheckCircle,
  TrendingUp,
  Message,
  Refresh,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useProject from "../../hooks/useProject";
import useAuth from "../../hooks/useAuth";
import { stringToColor } from "../../helpers/stringToColor";

const ClientDashboard = () => {
  const { currentUser } = useAuth();
  const { projects, tasks, loadProjects, loadTasks } = useProject();
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const getTeamMembers = (project) =>
    project.teamMembers ||
    (project.assignedTo || []).filter((member) => typeof member === "object");

  // Filter projects where current user is a client
  const clientProjects = projects.filter((project) =>
    project.clientUserIds?.includes(currentUser.uid)
  );

  // Get tasks from client projects
  const clientTasks = tasks.filter((task) =>
    clientProjects.some((project) => project.id === task.projectId)
  );

  const getProjectProgress = (projectId) => {
    const projectTasks = tasks.filter((task) => task.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter(
      (task) => task.status === "completed"
    ).length;
    return Math.round((completedTasks / projectTasks.length) * 100);
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

  const handleRefresh = async () => {
    await loadProjects();
    await loadTasks();
    setLastUpdated(new Date());
  };

  const completedTasks = clientTasks.filter((task) => task.status === "completed").length;
  const inProgressTasks = clientTasks.filter((task) => task.status === "in-progress").length;
  const overallProgress = clientProjects.length > 0
    ? Math.round(
        clientProjects.reduce((sum, project) => sum + getProjectProgress(project.id), 0) /
          clientProjects.length
      )
    : 0;

  return (
    <Box>
      <Paper
        sx={{
          mb: 4,
          p: { xs: 3, md: 4 },
          position: "relative",
          overflow: "hidden",
          color: "white",
          background: "linear-gradient(125deg, #241b3d 0%, #6B5B95 62%, #9282bd 100%)",
          "&::after": {
            content: '""',
            position: "absolute",
            width: 260,
            height: 260,
            borderRadius: "50%",
            right: -70,
            top: -120,
            border: "42px solid rgba(255,255,255,.07)",
          },
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1, display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", gap: 3 }}>
          <Box>
            <Chip label="Private client workspace" size="small" sx={{ color: "white", bgcolor: "rgba(255,255,255,.14)", mb: 2 }} />
            <Typography variant="h3" color="inherit" gutterBottom sx={{ fontWeight: 700 }}>
              Welcome back, {currentUser.displayName?.split(" ")[0] || "Client"}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,.72)", maxWidth: 560 }}>
              A live view of delivery, decisions, and what your team is moving forward today.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, alignSelf: { sm: "flex-start" } }}>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,.58)" }}>Workspace health</Typography>
              <Typography variant="h5" color="inherit">{overallProgress}%</Typography>
            </Box>
            <Tooltip title={`Refresh · last updated ${lastUpdated.toLocaleTimeString()}`}>
              <IconButton onClick={handleRefresh} sx={{ color: "white", bgcolor: "rgba(255,255,255,.1)" }}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Overview Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                  <Folder />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {clientProjects.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Projects
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar sx={{ bgcolor: "success.main", mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {completedTasks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tasks Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
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
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar sx={{ bgcolor: "info.main", mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {overallProgress}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall Progress
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Your Projects */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Your Projects
            </Typography>
            {clientProjects.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                No projects assigned yet. Your projects will appear here once assigned.
              </Typography>
            ) : (
              <Grid container spacing={3}>
                {clientProjects.map((project) => {
                  const progress = getProjectProgress(project.id);
                  const projectTasks = clientTasks.filter((t) => t.projectId === project.id);

                  return (
                    <Grid item xs={12} md={6} key={project.id}>
                      <Card
                        sx={{
                          cursor: "pointer",
                          transition: "all 0.3s",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: 4,
                          },
                        }}
                        onClick={() => navigate(`/client/projects/${project.id}`)}
                      >
                        <CardContent>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {project.name}
                            </Typography>
                            <Chip
                              label={getStatusLabel(project.status)}
                              size="small"
                              sx={{
                                backgroundColor: getStatusColor(project.status),
                                color: "white",
                                fontWeight: 600,
                              }}
                            />
                          </Box>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mb: 2,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {project.description || "No description"}
                          </Typography>

                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Progress
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
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
                                  background: "linear-gradient(90deg, #8B7EC8, #B5A9D6)",
                                },
                              }}
                            />
                          </Box>

                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box sx={{ display: "flex", gap: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                <Assignment fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />
                                {projectTasks.length} tasks
                              </Typography>
                            </Box>
                            {getTeamMembers(project).length > 0 && (
                              <AvatarGroup max={3} sx={{ "& .MuiAvatar-root": { width: 28, height: 28 } }}>
                                {getTeamMembers(project).map((member, idx) => (
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
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Recent Updates */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Recent Updates
            </Typography>
            <List>
              {clientTasks
                .slice()
                .sort((a, b) => {
                  const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt || 0);
                  const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt || 0);
                  return dateB - dateA;
                })
                .slice(0, 5)
                .map((task, index) => (
                  <React.Fragment key={task.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={task.name}
                        secondary={`Status: ${task.status} • ${
                          task.updatedAt
                            ? new Date(
                                task.updatedAt.toDate ? task.updatedAt.toDate() : task.updatedAt
                              ).toLocaleDateString()
                            : "Recently"
                        }`}
                      />
                      <Chip
                        label={task.status}
                        size="small"
                        color={task.status === "completed" ? "success" : "default"}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              {clientTasks.length === 0 && (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                  No updates yet
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Project Status Overview
            </Typography>
            <Box>
              {["planning", "in-progress", "completed", "on-hold"].map((status) => {
                const count = clientProjects.filter((p) => p.status === status).length;
                return (
                  <Box key={status} sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                        {getStatusLabel(status)}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {count}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={clientProjects.length > 0 ? (count / clientProjects.length) * 100 : 0}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "rgba(0, 0, 0, 0.1)",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: getStatusColor(status),
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClientDashboard;
