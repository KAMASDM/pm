import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  TextField,
  InputAdornment,
  Divider,
  Badge,
  Alert,
} from "@mui/material";
import { Search, Assignment, Group, Person } from "@mui/icons-material";
import useProject from "../../hooks/useProject";

const AssignEmployee = ({
  open,
  onClose,
  projectId,
  currentAssignments = [],
  onAssignmentChange,
}) => {
  const { employees, projects, updateProject } = useProject();
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterSkill, setFilterSkill] = useState("all");

  const project = projects.find((p) => p.id === projectId);

  useEffect(() => {
    setSelectedEmployees(currentAssignments.map((emp) => emp.id) || []);
  }, [currentAssignments, open]);

  const roleOptions = [
    { value: "all", label: "All Roles" },
    { value: "developer", label: "Developer" },
    { value: "designer", label: "Designer" },
    { value: "manager", label: "Project Manager" },
    { value: "analyst", label: "Business Analyst" },
    { value: "tester", label: "QA Tester" },
    { value: "devops", label: "DevOps Engineer" },
  ];

  const allSkills = [...new Set(employees.flatMap((emp) => emp.skills || []))];

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || employee.role === filterRole;
    const matchesSkill =
      filterSkill === "all" || employee.skills?.includes(filterSkill);

    return matchesSearch && matchesRole && matchesSkill;
  });

  const handleEmployeeToggle = (employeeId) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleBulkSelect = (action) => {
    if (action === "all") {
      setSelectedEmployees(filteredEmployees.map((emp) => emp.id));
    } else if (action === "none") {
      setSelectedEmployees([]);
    } else if (action === "role") {
      const roleEmployees = filteredEmployees
        .filter((emp) => emp.role === filterRole)
        .map((emp) => emp.id);
      setSelectedEmployees((prev) => [...new Set([...prev, ...roleEmployees])]);
    }
  };

  const handleSaveAssignments = async () => {
    try {
      const assignedEmployees = employees.filter((emp) =>
        selectedEmployees.includes(emp.id)
      );

      await updateProject(projectId, {
        assignedTo: assignedEmployees.map((emp) => ({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          role: emp.role,
          photoURL: emp.photoURL,
        })),
      });

      if (onAssignmentChange) {
        onAssignmentChange(assignedEmployees);
      }

      onClose();
    } catch (error) {
      console.error("Error updating project assignments:", error);
    }
  };

  const getEmployeeWorkload = (employeeId) => {
    const assignedProjects = projects.filter((project) =>
      project.assignedTo?.some((member) => member.id === employeeId)
    );
    return assignedProjects.length;
  };

  const getWorkloadColor = (workload) => {
    if (workload === 0) return "#A8E6CF";
    if (workload <= 2) return "#FFD3A5";
    return "#FFAAA5";
  };

  const getRoleColor = (role) => {
    const roleColors = {
      developer: "#8B7EC8",
      designer: "#B5A9D6",
      manager: "#A8E6CF",
      analyst: "#FFD3A5",
      tester: "#FFAAA5",
      devops: "#A5C9FF",
    };
    return roleColors[role] || "#E6E6FA";
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, maxHeight: "90vh" },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Group sx={{ color: "primary.main" }} />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Assign Team Members
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {project?.name}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3, pb: 0 }}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={filterRole}
                  label="Role"
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  {roleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Skill</InputLabel>
                <Select
                  value={filterSkill}
                  label="Skill"
                  onChange={(e) => setFilterSkill(e.target.value)}
                >
                  <MenuItem value="all">All Skills</MenuItem>
                  {allSkills.map((skill) => (
                    <MenuItem key={skill} value={skill}>
                      {skill}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleBulkSelect("all")}
              sx={{ textTransform: "none" }}
            >
              Select All
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleBulkSelect("none")}
              sx={{ textTransform: "none" }}
            >
              Select None
            </Button>
            {filterRole !== "all" && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleBulkSelect("role")}
                sx={{ textTransform: "none" }}
              >
                Select All{" "}
                {roleOptions.find((r) => r.value === filterRole)?.label}
              </Button>
            )}
          </Box>

          {selectedEmployees.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }} icon={<Assignment />}>
              {selectedEmployees.length} team member
              {selectedEmployees.length !== 1 ? "s" : ""} selected for
              assignment
            </Alert>
          )}
        </Box>

        <Box sx={{ maxHeight: 400, overflow: "auto", px: 3 }}>
          {filteredEmployees.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Person sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No team members found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filter criteria
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredEmployees.map((employee, index) => {
                const isSelected = selectedEmployees.includes(employee.id);
                const workload = getEmployeeWorkload(employee.id);
                const isCurrentlyAssigned = currentAssignments.some(
                  (emp) => emp.id === employee.id
                );

                return (
                  <React.Fragment key={employee.id}>
                    <ListItem
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        border: isSelected
                          ? "2px solid #8B7EC8"
                          : "2px solid transparent",
                        backgroundColor: isSelected
                          ? "rgba(139, 126, 200, 0.05)"
                          : "transparent",
                        "&:hover": {
                          backgroundColor: "rgba(139, 126, 200, 0.1)",
                        },
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                      }}
                      onClick={() => handleEmployeeToggle(employee.id)}
                    >
                      <ListItemAvatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                          }}
                          badgeContent={
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                backgroundColor: getWorkloadColor(workload),
                                border: "2px solid white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ fontSize: "0.6rem", fontWeight: "bold" }}
                              >
                                {workload}
                              </Typography>
                            </Box>
                          }
                        >
                          <Avatar
                            sx={{
                              backgroundColor: getRoleColor(employee.role),
                              width: 48,
                              height: 48,
                            }}
                            src={employee.photoURL}
                          >
                            {employee.name?.charAt(0).toUpperCase()}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography variant="body1" fontWeight={600}>
                              {employee.name}
                            </Typography>
                            {isCurrentlyAssigned && (
                              <Chip
                                label="Currently Assigned"
                                size="small"
                                color="primary"
                                sx={{ height: 20, fontSize: "0.7rem" }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {employee.email}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mt: 0.5,
                              }}
                            >
                              <Chip
                                label={employee.role}
                                size="small"
                                sx={{
                                  backgroundColor: `${getRoleColor(
                                    employee.role
                                  )}20`,
                                  color: getRoleColor(employee.role),
                                  height: 20,
                                  fontSize: "0.7rem",
                                }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {workload} project{workload !== 1 ? "s" : ""}
                              </Typography>
                            </Box>
                            {employee.skills && employee.skills.length > 0 && (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                  mt: 1,
                                }}
                              >
                                {employee.skills
                                  .slice(0, 3)
                                  .map((skill, skillIndex) => (
                                    <Chip
                                      key={skillIndex}
                                      label={skill}
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        height: 18,
                                        fontSize: "0.65rem",
                                        borderColor: "rgba(139, 126, 200, 0.3)",
                                      }}
                                    />
                                  ))}
                                {employee.skills.length > 3 && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    +{employee.skills.length - 3} more
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        }
                      />

                      <ListItemSecondaryAction>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleEmployeeToggle(employee.id)}
                          sx={{
                            color: "#8B7EC8",
                            "&.Mui-checked": {
                              color: "#8B7EC8",
                            },
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredEmployees.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Box>

        {selectedEmployees.length > 0 && (
          <Box sx={{ p: 3, pt: 2, borderTop: "1px solid rgba(0,0,0,0.12)" }}>
            <Typography variant="subtitle2" gutterBottom>
              Assignment Summary
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {employees
                .filter((emp) => selectedEmployees.includes(emp.id))
                .map((employee) => (
                  <Chip
                    key={employee.id}
                    label={employee.name}
                    size="small"
                    avatar={
                      <Avatar sx={{ bgcolor: getRoleColor(employee.role) }}>
                        {employee.name?.charAt(0)}
                      </Avatar>
                    }
                    onDelete={() => handleEmployeeToggle(employee.id)}
                    sx={{ backgroundColor: "rgba(139, 126, 200, 0.1)" }}
                  />
                ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveAssignments}
          disabled={selectedEmployees.length === 0}
          sx={{
            textTransform: "none",
            px: 3,
          }}
        >
          Assign {selectedEmployees.length} Member
          {selectedEmployees.length !== 1 ? "s" : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignEmployee;