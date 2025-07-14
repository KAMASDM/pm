import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Collapse,
  Button,
  Chip,
  Menu,
  MenuItem,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import {
  ExpandMore,
  Add,
  MoreVert,
  Edit,
  Delete,
  Flag,
} from "@mui/icons-material";
import useProject from "../../hooks/useProject";
import TaskCard from "../tasks/TaskCard";
import CreateTask from "../tasks/CreateTask";

const Milestone = ({ milestone, onMilestoneDelete, onMilestoneEdit }) => {
  const { getTasksByMilestone } = useProject();
  const [expanded, setExpanded] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openCreateTask, setOpenCreateTask] = useState(false);

  const milestoneTasks = getTasksByMilestone(milestone.id);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const progress =
    milestoneTasks.length > 0
      ? (milestoneTasks.filter((t) => t.status === "completed").length /
          milestoneTasks.length) *
        100
      : 0;

  return (
    <>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Flag sx={{ mr: 1, color: "primary.main" }} />
            <Typography variant="h6">{milestone.name}</Typography>
            <Chip label={`${milestoneTasks.length} tasks`} sx={{ ml: 2 }} />
          </Box>
          <Box>
            <IconButton onClick={handleMenuOpen} aria-label="Milestone options">
              <MoreVert />
            </IconButton>
            <IconButton
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              <ExpandMore
                sx={{
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </IconButton>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ mt: 1, height: 8, borderRadius: 4 }}
        />
        <Collapse in={expanded}>
          <Box sx={{ p: 2 }}>
            {milestoneTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            <Button
              startIcon={<Add />}
              onClick={() => setOpenCreateTask(true)}
              sx={{ mt: 2 }}
            >
              Add Task
            </Button>
          </Box>
        </Collapse>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem
            onClick={() => {
              onMilestoneEdit(milestone);
              handleMenuClose();
            }}
          >
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit Milestone
          </MenuItem>
          <MenuItem
            onClick={() => {
              onMilestoneDelete(milestone.id);
              handleMenuClose();
            }}
            sx={{ color: "error.main" }}
          >
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete Milestone
          </MenuItem>
        </Menu>
      </Paper>
      <Dialog
        open={openCreateTask}
        onClose={() => setOpenCreateTask(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <CreateTask
            projectId={milestone.projectId}
            milestoneId={milestone.id}
            onClose={() => setOpenCreateTask(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Milestone;