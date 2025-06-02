import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  useTheme,
  useMediaQuery,
  Fade,
  Paper,
  Divider,
  Alert,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Assignment,
  Person,
  Category,
  CheckCircle,
  ArrowBack,
  NavigateNext,
  Save,
} from "@mui/icons-material";
import useProject from "../../hooks/useProject";
import { useNavigate } from "react-router-dom";

const steps = [
  {
    label: "Basic Information",
    description: "Task name, description, and project",
    icon: <Assignment />,
  },
  {
    label: "Categorization",
    description: "Category, priority, and status",
    icon: <Category />,
  },
  {
    label: "Assignment",
    description: "Assign to team member and set timeline",
    icon: <Person />,
  },
  {
    label: "Details & Review",
    description: "Additional details and final review",
    icon: <CheckCircle />,
  },
];

const statusOptions = [
  { value: "pending", label: "Pending", color: "#64B5F6" },
  { value: "in-progress", label: "In Progress", color: "#FFB74D" },
  { value: "completed", label: "Completed", color: "#81C784" },
  { value: "blocked", label: "Blocked", color: "#F44336" },
];

const priorityOptions = [
  { value: "low", label: "Low", color: "#6BBF6B" },
  { value: "medium", label: "Medium", color: "#FFD700" },
  { value: "high", label: "High", color: "#DC3545" },
];

const CreateTask = ({ projectId = null, initialData = null }) => {
  const { projects, categories, employees, createTask } = useProject();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    projectId: projectId || initialData?.projectId || "",
    category: initialData?.category || "",
    subcategory: initialData?.subcategory || "",
    status: initialData?.status || "pending",
    priority: initialData?.priority || "medium",
    assignedTo: initialData?.assignedTo || null,
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate) : null,
    estimatedHours: initialData?.estimatedHours || "",
  });
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    switch (step) {
      case 0:
        if (!formData.name.trim()) newErrors.name = "Task name is required";
        if (!formData.projectId)
          newErrors.projectId = "Please select a project";
        break;
      case 1:
        if (!formData.category.trim())
          newErrors.category = "Category is required";
        break;
      case 2:
        break;
      case 3:
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    for (let i = 0; i <= activeStep; i++) {
      if (!validateStep(i)) {
        setActiveStep(i);
        return;
      }
    }
    if (!validateStep(activeStep)) return;

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, submission: null }));
    try {
      await createTask(formData);
      handleClose();
      navigate("/tasks");
    } catch (error) {
      console.error("Error creating task:", error);
      setErrors((prev) => ({
        ...prev,
        submission: error.message || "Failed to create task.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      projectId: projectId || "",
      category: "",
      subcategory: "",
      status: "pending",
      priority: "medium",
      assignedTo: null,
      dueDate: null,
      estimatedHours: "",
    });
    setActiveStep(0);
    setErrors({});
  };

  const getSelectedProject = () => {
    if (!formData.projectId || !projects) return null;
    return projects.find((p) => p.id === formData.projectId);
  };

  const getSelectedCategory = () => {
    if (!formData.category || !categories) return null;
    return categories.find((c) => c.name === formData.category);
  };

  const getAvailableSubcategories = () => {
    const category = getSelectedCategory();
    return category?.subcategories || [];
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Task Name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              sx={{ mb: 3 }}
              placeholder="Enter a clear, descriptive task name"
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              multiline
              rows={4}
              sx={{ mb: 3 }}
              placeholder="Describe what needs to be done, acceptance criteria, etc."
            />
            <FormControl fullWidth error={!!errors.projectId} sx={{ mb: 3 }}>
              <InputLabel>Project</InputLabel>
              <Select
                value={formData.projectId}
                label="Project"
                onChange={(e) => handleInputChange("projectId", e.target.value)}
              >
                {(projects || []).map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: project.color || "#8B7EC8",
                        }}
                      />
                      {project.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.projectId && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, ml: 2 }}
                >
                  {errors.projectId}
                </Typography>
              )}
            </FormControl>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth error={!!errors.category} sx={{ mb: 3 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(e) => handleInputChange("category", e.target.value)}
              >
                {(categories || []).map((category) => (
                  <MenuItem key={category.id} value={category.name}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: category.color,
                        }}
                      />
                      {category.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.category && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, ml: 2 }}
                >
                  {errors.category}
                </Typography>
              )}
            </FormControl>
            {formData.category && getAvailableSubcategories().length > 0 && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Subcategory (Optional)</InputLabel>
                <Select
                  value={formData.subcategory}
                  label="Subcategory (Optional)"
                  onChange={(e) =>
                    handleInputChange("subcategory", e.target.value)
                  }
                >
                  {getAvailableSubcategories().map((subcategory) => (
                    <MenuItem key={subcategory.name} value={subcategory.name}>
                      {subcategory.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    label="Priority"
                    onChange={(e) =>
                      handleInputChange("priority", e.target.value)
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
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
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              options={employees || []}
              getOptionLabel={(option) => option?.name || option?.email || ""}
              value={formData.assignedTo}
              onChange={(event, newValue) =>
                handleInputChange("assignedTo", newValue)
              }
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Avatar
                    sx={{
                      mr: 2,
                      width: 32,
                      height: 32,
                      bgcolor: "primary.main",
                    }}
                    src={option.photoURL}
                  >
                    {option.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.role || "N/A"} • {option.email}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assign To (Optional)"
                  placeholder="Search team members"
                />
              )}
              sx={{ mb: 3 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Due Date (Optional)"
                  value={formData.dueDate}
                  onChange={(newValue) =>
                    handleInputChange("dueDate", newValue)
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estimated Hours (Optional)"
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) =>
                    handleInputChange("estimatedHours", e.target.value)
                  }
                  inputProps={{ min: 0, step: 0.5 }}
                />
              </Grid>
            </Grid>
            {formData.assignedTo && (
              <Card
                sx={{ mt: 2, backgroundColor: "rgba(139, 126, 200, 0.05)" }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Assigned To
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      sx={{ bgcolor: "primary.main" }}
                      src={formData.assignedTo.photoURL}
                    >
                      {formData.assignedTo.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {formData.assignedTo.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formData.assignedTo.role || "N/A"} •{" "}
                        {formData.assignedTo.email}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 3: {
        const project = getSelectedProject();
        const priority = priorityOptions.find(
          (p) => p.value === formData.priority
        );
        const status = statusOptions.find((s) => s.value === formData.status);

        return (
          <Box sx={{ mt: 2 }}>
            {errors.submission && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.submission}
              </Alert>
            )}
            <Typography variant="h6" gutterBottom>
              Task Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card
                  elevation={0}
                  sx={{
                    backgroundColor: "rgba(139, 126, 200, 0.05)",
                    height: "100%",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Basic Information
                    </Typography>
                    <Typography variant="body2">
                      <strong>Name:</strong> {formData.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Project:</strong> {project?.name || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Category:</strong> {formData.category || "N/A"}
                    </Typography>
                    {formData.subcategory && (
                      <Typography variant="body2">
                        <strong>Subcategory:</strong> {formData.subcategory}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card
                  elevation={0}
                  sx={{
                    backgroundColor: "rgba(139, 126, 200, 0.05)",
                    height: "100%",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Details
                    </Typography>
                    <Typography variant="body2">
                      <strong>Priority:</strong> {priority?.label || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {status?.label || "N/A"}
                    </Typography>
                    {formData.assignedTo && (
                      <Typography variant="body2">
                        <strong>Assigned to:</strong> {formData.assignedTo.name}
                      </Typography>
                    )}
                    {formData.dueDate && (
                      <Typography variant="body2">
                        <strong>Due:</strong>{" "}
                        {new Date(formData.dueDate).toLocaleDateString()}
                      </Typography>
                    )}
                    {formData.estimatedHours && (
                      <Typography variant="body2">
                        <strong>Est. Hours:</strong> {formData.estimatedHours}h
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            {formData.description && (
              <Card
                elevation={0}
                sx={{ mt: 2, backgroundColor: "rgba(139, 126, 200, 0.05)" }}
              >
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {formData.description}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        );
      }
      default:
        return null;
    }
  };

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
              {initialData ? "Edit Task" : "Create New Task"}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Follow the steps to setup your task.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ArrowBack />}
            onClick={() =>
              navigate(
                projectId && !initialData ? `/projects/${projectId}` : "/tasks"
              )
            }
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
            Back to Tasks
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
          <Stepper
            activeStep={activeStep}
            alternativeLabel={!isMobile}
            orientation={isMobile ? "vertical" : "horizontal"}
          >
            {steps.map((step, index) => (
              <Step key={step.label} completed={activeStep > index}>
                <StepLabel
                  StepIconComponent={(props) => (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: props.active
                          ? theme.palette.primary.main
                          : props.completed
                          ? theme.palette.success.main
                          : theme.palette.action.disabledBackground,
                        color:
                          props.active || props.completed
                            ? theme.palette.primary.contrastText
                            : theme.palette.text.secondary,
                        transition: "all 0.3s ease-in-out",
                        boxShadow: props.active
                          ? "0 3px 10px 0 rgba(0,0,0,.15)"
                          : "none",
                      }}
                    >
                      {props.completed ? <CheckCircle /> : step.icon}
                    </Box>
                  )}
                >
                  <Typography>{step.label}</Typography>
                  {!isMobile && (
                    <Typography variant="caption" color="textSecondary">
                      {step.description}
                    </Typography>
                  )}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            p: isMobile ? 2 : 4,
            background:
              "linear-gradient(135deg, rgba(139, 126, 200, 0.03), rgba(181, 169, 214, 0.05))",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom fontWeight={600}>
              {steps[activeStep].label}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {steps[activeStep].description}
            </Typography>
          </Box>
          <Divider sx={{ mb: 4 }} />

          {renderStepContent(activeStep)}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 4,
              pt: 3,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              sx={{
                visibility: activeStep === 0 ? "hidden" : "visible",
                px: 3,
                py: 1.2,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Back
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  startIcon={<Save />}
                  sx={{
                    px: 3,
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  {isSubmitting
                    ? initialData
                      ? "Saving Task..."
                      : "Creating Task..."
                    : initialData
                    ? "Save Changes"
                    : "Create Task"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  endIcon={<NavigateNext />}
                  sx={{
                    px: 3,
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  Continue
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
};

export default CreateTask;
