import React from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  Button,
  Divider,
  LinearProgress,
} from "@mui/material";
import {
  Folder,
  Assignment,
  BugReport,
  Person,
  Add,
  ArrowForward,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useProject from "../../hooks/useProject";
import useAuth from "../../hooks/useAuth";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { projects, tasks, employees } = useProject();
  const navigate = useNavigate();

  const myTasks = tasks.filter(
    (task) =>
      task.assignedTo === currentUser.uid && task.status !== "completed"
  );

  const overdueTasks = tasks.filter(
    (task) =>
      task.dueDate &&
      new Date(task.dueDate) < new Date() &&
      task.status !== "completed"
  );

  const getProjectName = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : "N/A";
  };

  const getProjectProgress = (projectId) => {
    const projectTasks = tasks.filter((task) => task.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter(
      (task) => task.status === "completed"
    ).length;
    return (completedTasks / projectTasks.length) * 100;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {currentUser.displayName}!
      </Typography>
      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: "flex", alignItems: "center" }}>
            <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
              <Folder />
            </Avatar>
            <Box>
              <Typography variant="h6">{projects.length}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Total Projects
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: "flex", alignItems: "center" }}>
            <Avatar sx={{ bgcolor: "secondary.main", mr: 2 }}>
              <Assignment />
            </Avatar>
            <Box>
              <Typography variant="h6">{tasks.length}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Total Tasks
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: "flex", alignItems: "center" }}>
            <Avatar sx={{ bgcolor: "error.main", mr: 2 }}>
              <BugReport />
            </Avatar>
            <Box>
              <Typography variant="h6" color="error">
                {overdueTasks.length}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Overdue Tasks
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: "flex", alignItems: "center" }}>
            <Avatar sx={{ bgcolor: "success.main", mr: 2 }}>
              <Person />
            </Avatar>
            <Box>
              <Typography variant="h6">{employees.length}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Team Members
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* My Tasks */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">My Tasks</Typography>
              <Button
                size="small"
                endIcon={<Add />}
                onClick={() => navigate("/tasks/create")}
              >
                New Task
              </Button>
            </Box>
            <List>
              {myTasks.slice(0, 5).map((task) => (
                <ListItem
                  key={task.id}
                  secondaryAction={
                    <Chip
                      label={getProjectName(task.projectId)}
                      size="small"
                    />
                  }
                >
                  <ListItemText
                    primary={task.name}
                    secondary={`Due: ${
                      task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "N/A"
                    }`}
                  />
                </ListItem>
              ))}
              {myTasks.length === 0 && (
                <Typography sx={{ p: 2 }} color="text.secondary">
                  You have no pending tasks. Great job!
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Recent Activity</Typography>
            <List>
              {tasks
                .slice()
                .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
                .slice(0, 5)
                .map((task) => (
                  <ListItem key={task.id}>
                    <ListItemText
                      primary={`${task.createdByName} created a new task`}
                      secondary={task.name}
                    />
                  </ListItem>
                ))}
            </List>
          </Paper>
        </Grid>

        {/* Projects Overview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">Projects Overview</Typography>
              <Button
                size="small"
                endIcon={<ArrowForward />}
                onClick={() => navigate("/projects")}
              >
                View All
              </Button>
            </Box>
            <List>
              {projects.slice(0, 5).map((project) => (
                <ListItem key={project.id}>
                  <ListItemText
                    primary={project.name}
                    secondary={
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <LinearProgress
                          variant="determinate"
                          value={getProjectProgress(project.id)}
                          sx={{ width: "100px", mr: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(getProjectProgress(project.id))}%
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;