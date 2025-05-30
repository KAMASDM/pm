import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  IconButton,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Badge,
  Fade,
  Skeleton,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from "@mui/material";
import { Add, Search, Delete, Email, Phone, Group } from "@mui/icons-material";
import useProject from "../../hooks/useProject";
import ConfirmationDialog from "../common/ConfirmationDialog";

const roleOptions = [
  { value: "all", label: "All Roles", color: "#607D8B" },
  { value: "developer", label: "Developer", color: "#4CAF50" },
  { value: "designer", label: "Designer", color: "#FF9800" },
  { value: "manager", label: "Project Manager", color: "#2196F3" },
  { value: "analyst", label: "Business Analyst", color: "#E91E63" },
  { value: "tester", label: "QA Tester", color: "#00BCD4" },
  { value: "devops", label: "DevOps Engineer", color: "#9C27B0" },
  { value: "data_scientist", label: "Data Scientist", color: "#795548" },
];

const departmentOptions = [
  "Engineering",
  "Design",
  "Product",
  "Marketing",
  "Sales",
  "Operations",
  "Human Resources",
  "Finance",
];

const skillOptions = [
  "React",
  "Node.js",
  "Python",
  "Java",
  "JavaScript",
  "TypeScript",
  "UI/UX Design",
  "Figma",
  "Adobe Creative Suite",
  "Project Management",
  "Agile",
  "Scrum",
  "Testing",
  "Automation",
  "Quality Assurance",
  "AWS",
  "Docker",
  "Kubernetes",
  "CI/CD",
  "SQL",
  "Machine Learning",
  "Data Analysis",
];

const EmployeeList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    employees = [],
    projects = [],
    tasks = [],
    createEmployee,
    updateEmployee,
    deleteEmployee,
    loading,
  } = useProject();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [dialogType, setDialogType] = useState("create");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    skills: [],
  });

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogTitle, setConfirmDialogTitle] = useState("");
  const [confirmDialogMessage, setConfirmDialogMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredEmployees = employees.filter((employee) => {
    const employeeName = employee.name?.toLowerCase();
    const employeeEmail = employee.email?.toLowerCase();
    const employeeRole = employee.role?.toLowerCase();

    const matchesSearch =
      employeeName.includes(searchTerm.toLowerCase()) ||
      employeeEmail.includes(searchTerm.toLowerCase()) ||
      employeeRole.includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === "all" || employee.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleMenuOpen = (event, employee) => {
    event.stopPropagation();
    setSelectedEmployee(employee);
  };

  const handleMenuClose = () => {
    setSelectedEmployee(null);
  };

  const handleOpenDialog = (type, employee = null) => {
    setDialogType(type);
    if (employee) {
      setFormData({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        department: employee.department,
        skills: employee.skills,
      });
      setSelectedEmployee(employee);
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "",
        department: "",
        skills: [],
      });
      setSelectedEmployee(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEmployee(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      skills: [],
    });
  };

  const handleSaveEmployee = async () => {
    try {
      if (dialogType === "create") {
        await createEmployee(formData);
      } else {
        if (!selectedEmployee || !selectedEmployee.id) {
          console.log("No employee selected or missing ID");
          return;
        }
        setIsUpdating(true);
        try {
          await updateEmployee(selectedEmployee.id, formData);
        } catch (error) {
          console.log("Error updating employee:", error);
        } finally {
          setIsUpdating(false);
        }
      }
      handleCloseDialog();
    } catch (error) {
      console.log("Error saving employee:", error);
    }
  };

  const handleDeleteClick = () => {
    setConfirmDialogTitle("Confirm Deletion");
    setConfirmDialogMessage(
      `Are you sure you want to delete ${selectedEmployee.name}? This action cannot be undone.`
    );
    setConfirmAction(() => async () => {
      setIsDeleting(true);
      try {
        await deleteEmployee(selectedEmployee.id);
        handleMenuClose();
      } catch (error) {
        console.log("Error deleting employee:", error);
      } finally {
        setIsDeleting(false);
        setConfirmDialogOpen(false);
      }
    });
    setConfirmDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseConfirmationDialog = () => {
    setConfirmDialogOpen(false);
    setConfirmAction(null);
  };

  const getEmployeeProjects = (employeeId) => {
    return projects.filter((project) =>
      project.assignedTo?.some((member) => member.id === employeeId)
    );
  };

  const getEmployeeTasks = (employeeId) => {
    return tasks.filter((task) => task.assignedTo === employeeId);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "developer":
        return theme.palette.primary.main;
      case "designer":
        return theme.palette.secondary.main;
      case "manager":
        return theme.palette.success.main;
      case "analyst":
        return theme.palette.warning.main;
      case "tester":
        return theme.palette.error.main;
      case "devops":
        return theme.palette.info.main;
      case "data_scientist":
        return "#00BCD4";
      default:
        return theme.palette.text.secondary;
    }
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase() || "??"
    );
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Skeleton
                variant="rectangular"
                height={250}
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
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            mb: 4,
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Team Members
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your team and track their project assignments
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog("create")}
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
            Add Team Member
          </Button>
        </Box>
        <Paper
          elevation={0}
          sx={{
            p: isMobile ? 1 : 2,
            background:
              "linear-gradient(135deg, rgba(139, 126, 200, 0.03), rgba(181, 169, 214, 0.05))",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            mb: 4,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius:
                      theme.components?.MuiTextField?.styleOverrides?.root?.[
                        "& .MuiOutlinedInput-root"
                      ]?.borderRadius || theme.shape.borderRadius,
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: theme.palette.background.paper,
                    borderRadius:
                      theme.components?.MuiTextField?.styleOverrides?.root?.[
                        "& .MuiOutlinedInput-root"
                      ]?.borderRadius || theme.shape.borderRadius,
                    "&:hover fieldset": {
                      borderColor: theme.palette.primary.light, // Highlight on hover
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.primary.main, // Highlight on focus
                      borderWidth: "2px",
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Role</InputLabel>
                <Select
                  value={filterRole}
                  label="Filter by Role"
                  onChange={(e) => setFilterRole(e.target.value)}
                  sx={{
                    backgroundColor: theme.palette.background.paper,
                    borderRadius:
                      theme.components?.MuiTextField?.styleOverrides?.root?.[
                        "& .MuiOutlinedInput-root"
                      ]?.borderRadius || theme.shape.borderRadius,
                    "&:hover fieldset": {
                      borderColor: theme.palette.primary.light,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.primary.main,
                      borderWidth: "2px",
                    },
                  }}
                >
                  {roleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
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
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "white",
                  border: `1px solid ${theme.palette.divider}`,
                  height: "100%",
                }}
              >
                <Typography variant="h3" fontWeight={700} color="primary">
                  {employees.length}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Total Members
                </Typography>
              </Box>
            </Grid>
            {roleOptions
              .filter((role) => role.value !== "all")
              .map((role) => (
                <Grid item xs={12} sm={6} md={3} key={role.value}>
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: "white",
                      border: `1px solid ${theme.palette.divider}`,
                      height: "100%",
                    }}
                  >
                    <Typography
                      variant="h3"
                      fontWeight={700}
                      sx={{
                        color: role.color || theme.palette.text.primary, // Changed to use role.color directly
                      }}
                    >
                      {
                        employees.filter((emp) => emp.role === role.value)
                          .length
                      }
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {role.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
          </Grid>
        </Paper>
        {filteredEmployees.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 8 },
              textAlign: "center",
              borderRadius: 3,
              background:
                "linear-gradient(135deg, rgba(139, 126, 200, 0.03), rgba(181, 169, 214, 0.05))",
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Group
              sx={{
                fontSize: { xs: 50, sm: 60 },
                color: theme.palette.text.secondary,
                mb: 2,
                opacity: 0.7,
              }}
            />
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: theme.typography.fontWeightMedium }}
            >
              {searchTerm || filterRole !== "all"
                ? "No team members found"
                : "No team members yet"}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
            >
              {searchTerm || filterRole !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Add your first team member to start building your project team."}
            </Typography>
            {!searchTerm && filterRole === "all" && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog("create")}
                sx={{
                  borderRadius:
                    theme.components?.MuiButton?.styleOverrides?.root
                      ?.borderRadius || theme.shape.borderRadius,
                  px: 4,
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: theme.typography.fontWeightMedium,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                  boxShadow:
                    theme.components?.MuiButton?.styleOverrides?.contained
                      ?.boxShadow || "none",
                  "&:hover": {
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                    boxShadow:
                      theme.components?.MuiButton?.styleOverrides?.contained
                        ?.boxShadow || "none",
                  },
                }}
              >
                Add Your First Team Member
              </Button>
            )}
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredEmployees.map((employee, index) => (
              <Grid item xs={12} sm={6} md={4} key={employee.id || index}>
                <Fade in={true} timeout={600 + index * 100}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: 3,
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-5px)",
                      },
                    }}
                    onClick={(e) => {
                      if (!e.target.closest(".menu-button")) {
                        handleOpenDialog("edit", employee);
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Badge
                          overlap="circular"
                          anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                          }}
                          badgeContent={
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                background:
                                  "linear-gradient(135deg, rgba(139, 126, 200, 0.03), rgba(181, 169, 214, 0.05))",
                                border: `1px solid ${theme.palette.divider}`,
                              }}
                            />
                          }
                        >
                          <Avatar
                            sx={{
                              width: 60,
                              height: 60,
                              backgroundColor: getRoleColor(employee.role),
                              fontSize: "1.5rem",
                              fontWeight: 600,
                            }}
                            src={employee.avatar}
                          >
                            {getInitials(employee.name)}
                          </Avatar>
                        </Badge>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, employee)}
                          sx={{
                            opacity: 0.8,
                            color: theme.palette.text.secondary,
                            "&:hover": {
                              opacity: 1,
                              color: getRoleColor(employee.role),
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          <Delete
                            fontSize="small"
                            onClick={() => {
                              handleDeleteClick();
                              handleMenuClose();
                            }}
                            sx={{ mr: 1, color: "error.main" }}
                          />
                        </IconButton>
                      </Box>
                      <Typography
                        variant="h6"
                        fontWeight={theme.typography.fontWeightMedium}
                        gutterBottom
                      >
                        {employee.name}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                          mb: 2,
                        }}
                      >
                        {employee.email && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Email
                              sx={{
                                fontSize: 18,
                                color: theme.palette.text.secondary,
                              }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {employee.email}
                            </Typography>
                          </Box>
                        )}
                        {employee.phone && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Phone
                              sx={{
                                fontSize: 18,
                                color: theme.palette.text.secondary,
                              }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {employee.phone}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box
                            sx={{
                              textAlign: "center",
                              p: 1.5,
                              borderRadius: 1,
                              background:
                                "linear-gradient(135deg, rgba(139, 126, 200, 0.03), rgba(181, 169, 214, 0.05))",
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            <Typography
                              variant="h6"
                              fontWeight={theme.typography.fontWeightBold}
                              color="primary"
                            >
                              {getEmployeeProjects(employee.id).length}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block" }}
                            >
                              Projects
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box
                            sx={{
                              textAlign: "center",
                              p: 1.5,
                              borderRadius: 1,
                              background:
                                "linear-gradient(135deg, rgba(139, 126, 200, 0.03), rgba(181, 169, 214, 0.05))",
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            <Typography
                              variant="h6"
                              fontWeight={theme.typography.fontWeightBold}
                              sx={{ color: theme.palette.success.main }}
                            >
                              {getEmployeeTasks(employee.id).length}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block" }}
                            >
                              Tasks
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="medium"
                        onClick={() => handleOpenDialog("edit", employee)}
                        sx={{
                          borderRadius:
                            theme.components?.MuiButton?.styleOverrides?.root
                              ?.borderRadius || theme.shape.borderRadius,
                          textTransform: "none",
                          borderColor: theme.palette.primary.main,
                          color: theme.palette.primary.main,
                          fontWeight: theme.typography.fontWeightMedium,
                          "&:hover": {
                            borderColor: theme.palette.primary.light,
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        Edit Details
                      </Button>
                    </CardActions>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        )}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {dialogType === "create"
              ? "Add New Team Member"
              : "Edit Team Member"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone (Optional)"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, role: e.target.value }))
                    }
                  >
                    {roleOptions.slice(1).map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
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
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department}
                    label="Department"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                  >
                    {departmentOptions.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Skills</InputLabel>
                  <Select
                    multiple
                    value={formData.skills}
                    label="Skills"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        skills: e.target.value,
                      }))
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {skillOptions.map((skill) => (
                      <MenuItem key={skill} value={skill}>
                        {skill}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSaveEmployee}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <CircularProgress size={24} />
              ) : dialogType === "create" ? (
                "Add Member"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogActions>
        </Dialog>
        <ConfirmationDialog
          open={confirmDialogOpen}
          onClose={handleCloseConfirmationDialog}
          onConfirm={confirmAction}
          title={confirmDialogTitle}
          message={confirmDialogMessage}
          loading={isDeleting || isUpdating}
        />
      </Box>
    </Fade>
  );
};

export default EmployeeList;
