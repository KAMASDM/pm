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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Autocomplete,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Avatar,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Assignment,
  Flag,
  Person,
  Category,
  CheckCircle,
} from "@mui/icons-material";
import useProject from "../../hooks/useProject";

const steps = [
  {
    label: "Basic Information",
    description: "Task name, description, and project",
    icon: <Assignment />,
  },
  {
    label: "Categorization",
    description: "Category, priority, and tags",
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
  { value: "blocked", label: "Blocked", color: "#E57373" },
];

const priorityOptions = [
  { value: "low", label: "Low", color: "#81C784" },
  { value: "medium", label: "Medium", color: "#FFD54F" },
  { value: "high", label: "High", color: "#FFB74D" },
  { value: "urgent", label: "Urgent", color: "#E57373" },
];

const tagSuggestions = [
  "Frontend",
  "Backend",
  "Database",
  "API",
  "UI/UX",
  "Testing",
  "Bug Fix",
  "Feature",
  "Enhancement",
  "Research",
  "Documentation",
];

const CreateTask = ({
  open,
  onClose,
  projectId = null,
  initialData = null,
}) => {
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
    dueDate: initialData?.dueDate || null,
    estimatedHours: initialData?.estimatedHours || "",
    tags: initialData?.tags || [],
    attachments: [],
    dependencies: [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is updated
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
        // Assignment is optional
        break;
      case 3:
        // Final validation
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
    if (!validateStep(activeStep)) return;

    setIsSubmitting(true);
    try {
      await createTask(formData);
      handleClose();
    } catch (error) {
      console.error("Error creating task:", error);
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
      tags: [],
      attachments: [],
      dependencies: [],
    });
    setActiveStep(0);
    setErrors({});
    onClose();
  };

  const getSelectedProject = () => {
    return projects.find((p) => p.id === formData.projectId);
  };

  const getSelectedCategory = () => {
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
            <FormControl fullWidth error={!!errors.projectId}>
              <InputLabel>Project</InputLabel>
              <Select
                value={formData.projectId}
                label="Project"
                onChange={(e) => handleInputChange("projectId", e.target.value)}
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: "#8B7EC8",
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
            {formData.projectId && (
              <Card
                sx={{ mt: 2, backgroundColor: "rgba(139, 126, 200, 0.05)" }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Project
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getSelectedProject()?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getSelectedProject()?.description}
                  </Typography>
                </CardContent>
              </Card>
            )}
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
                {categories.map((category) => (
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
              <Grid item xs={6}>
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
                          <Flag sx={{ color: option.color, fontSize: 16 }} />
                          {option.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
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
            <Autocomplete
              multiple
              options={tagSuggestions}
              freeSolo
              value={formData.tags}
              onChange={(event, newValue) =>
                handleInputChange("tags", newValue)
              }
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                    sx={{ borderColor: "#8B7EC8", color: "#8B7EC8" }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags (Optional)"
                  placeholder="Add tags to categorize this task"
                />
              )}
            />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              options={employees}
              getOptionLabel={(option) => option.name || option.email}
              value={formData.assignedTo}
              onChange={(event, newValue) =>
                handleInputChange("assignedTo", newValue)
              }
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Avatar
                    sx={{
                      mr: 2,
                      width: 32,
                      height: 32,
                      bgcolor: "primary.main",
                    }}
                    src={option.photoURL}
                  >
                    {option.name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.role} • {option.email}
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
              <Grid item xs={6}>
                <DatePicker
                  label="Due Date (Optional)"
                  value={formData.dueDate}
                  onChange={(newValue) =>
                    handleInputChange("dueDate", newValue)
                  }
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={6}>
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
                      {formData.assignedTo.name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {formData.assignedTo.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formData.assignedTo.role} • {formData.assignedTo.email}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Task Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card
                  elevation={0}
                  sx={{ backgroundColor: "rgba(139, 126, 200, 0.05)" }}
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
                      <strong>Project:</strong> {getSelectedProject()?.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Category:</strong> {formData.category}
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
                  sx={{ backgroundColor: "rgba(139, 126, 200, 0.05)" }}
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
                      <strong>Priority:</strong>{" "}
                      {
                        priorityOptions.find(
                          (p) => p.value === formData.priority
                        )?.label
                      }
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong>{" "}
                      {
                        statusOptions.find((s) => s.value === formData.status)
                          ?.label
                      }
                    </Typography>
                    {formData.assignedTo && (
                      <Typography variant="body2">
                        <strong>Assigned to:</strong> {formData.assignedTo.name}
                      </Typography>
                    )}
                    {formData.dueDate && (
                      <Typography variant="body2">
                        <strong>Due:</strong>{" "}
                        {formData.dueDate.toLocaleDateString()}
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
                  <Typography variant="body2">
                    {formData.description}
                  </Typography>
                </CardContent>
              </Card>
            )}
            {formData.tags.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Tags
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: "#8B7EC8", color: "#8B7EC8" }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, maxHeight: "90vh" },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Assignment sx={{ color: "primary.main" }} />
          <Typography variant="h6" fontWeight={600}>
            Create New Task
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Grid container>
          <Grid
            item
            xs={12}
            md={4}
            sx={{ borderRight: { md: "1px solid rgba(0,0,0,0.12)" } }}
          >
            <Box sx={{ p: 3 }}>
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      StepIconComponent={() => (
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor:
                              index <= activeStep
                                ? "#8B7EC8"
                                : "rgba(139, 126, 200, 0.2)",
                            color:
                              index <= activeStep ? "white" : "text.secondary",
                            fontSize: 14,
                          }}
                        >
                          {index < activeStep ? (
                            <CheckCircle sx={{ fontSize: 18 }} />
                          ) : (
                            step.icon
                          )}
                        </Box>
                      )}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        {step.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {step.description}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {steps[activeStep].label}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {steps[activeStep].description}
              </Typography>

              {renderStepContent(activeStep)}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3, borderTop: "1px solid rgba(0,0,0,0.12)" }}>
        <Button onClick={handleClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          sx={{
            mr: 1,
            textTransform: "none",
            visibility: activeStep === 0 ? "hidden" : "visible",
          }}
        >
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            sx={{ textTransform: "none", px: 3 }}
          >
            {isSubmitting ? "Creating Task..." : "Create Task"}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            sx={{ textTransform: "none", px: 3 }}
          >
            Continue
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateTask;
