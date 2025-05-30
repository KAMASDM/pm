import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Paper,
  Tab,
  Tabs,
  IconButton,
  Menu,
  MenuItem,
  Fade,
  Skeleton,
} from "@mui/material";
import {
  Add,
  Search,
  FilterList,
  ViewModule,
  ViewList,
} from "@mui/icons-material";
import ProjectCard from "./ProjectCard";
import useProject from "../../hooks/useProject";

const statusOptions = [
  { value: "all", label: "All Projects", color: "#607D8B" },
  { value: "planning", label: "Planning", color: "#2196F3" },
  { value: "in-progress", label: "In Progress", color: "#FFC107" },
  { value: "completed", label: "Completed", color: "#4CAF50" },
  { value: "on-hold", label: "On Hold", color: "#F44336" },
];

const ProjectList = () => {
  const navigate = useNavigate();
  const { projects, loading } = useProject();
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusCount = (status) => {
    if (status === "all") return projects.length;
    return projects.filter((project) => project.status === status).length;
  };

  if (loading) {
    return (
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton
            variant="rectangular"
            width={140}
            height={40}
            sx={{ borderRadius: 2 }}
          />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} lg={4} key={item}>
              <Skeleton
                variant="rectangular"
                height={280}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}
        </Grid>
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
              Projects
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and track your project portfolio
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
              boxShadow: "0 4px 12px rgba(139, 126, 200, 0.3)",
              "&:hover": {
                boxShadow: "0 6px 20px rgba(139, 126, 200, 0.4)",
                transform: "translateY(-2px)",
              },
            }}
          >
            New Project
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
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              alignItems: { md: "center" },
            }}
          >
            <TextField
              placeholder="Search Projects..."
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
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                  borderRadius: 2,
                },
              }}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                sx={{
                  backgroundColor: "white",
                  border: "1px solid rgba(139, 126, 200, 0.2)",
                  "&:hover": {
                    backgroundColor: "rgba(139, 126, 200, 0.1)",
                  },
                }}
              >
                {viewMode === "grid" ? <ViewList /> : <ViewModule />}
              </IconButton>
              <IconButton
                onClick={handleMenuOpen}
                sx={{
                  backgroundColor: "white",
                  border: "1px solid rgba(139, 126, 200, 0.2)",
                  "&:hover": {
                    backgroundColor: "rgba(139, 126, 200, 0.1)",
                  },
                }}
              >
                <FilterList />
              </IconButton>
            </Box>
          </Box>
          <Box
            sx={{ mt: 2, borderBottom: "1px solid rgba(139, 126, 200, 0.1)" }}
          >
            <Tabs
              value={filterStatus}
              onChange={(e, newValue) => setFilterStatus(newValue)}
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 500,
                  borderRadius: "8px 8px 0 0",
                  mr: 1,
                },
              }}
            >
              {statusOptions.map((option) => (
                <Tab
                  key={option.value}
                  value={option.value}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {option.label}
                      <Chip
                        size="small"
                        label={getStatusCount(option.value)}
                        sx={{
                          height: 20,
                          fontSize: "0.75rem",
                          backgroundColor: "rgba(139, 126, 200, 0.1)",
                          color: option.color,
                        }}
                      />
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Box>
        </Paper>
        {filteredProjects.length === 0 ? (
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
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #8B7EC8, #B5A9D6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                opacity: 0.7,
              }}
            >
              <Add sx={{ fontSize: 40, color: "white" }} />
            </Box>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: 600, color: "text.primary" }}
            >
              {searchTerm || filterStatus !== "all"
                ? "No projects found"
                : "No projects yet"}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
            >
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Create your first project to start organizing your work and tracking progress."}
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
          <Grid container spacing={3}>
            {filteredProjects.map((project, index) => (
              <Grid item xs={12} sm={6} lg={4} key={project.id}>
                <Fade in={true} timeout={600 + index * 100}>
                  <div>
                    <ProjectCard project={project} />
                  </div>
                </Fade>
              </Grid>
            ))}
          </Grid>
        )}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { borderRadius: 2, minWidth: 200 },
          }}
        >
          <MenuItem onClick={handleMenuClose}>Sort by Name</MenuItem>
          <MenuItem onClick={handleMenuClose}>Sort by Date</MenuItem>
          <MenuItem onClick={handleMenuClose}>Sort by Progress</MenuItem>
        </Menu>
      </Box>
    </Fade>
  );
};

export default ProjectList;
