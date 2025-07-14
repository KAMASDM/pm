import React, { useState, useEffect } from "react";
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
  List,
  ListItem,
  ListItemText,
  IconButton,
  Checkbox,
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
  Delete,
  Add,
  PlaylistAddCheck,
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
    label: "Checklist",
    description: "Add sub-tasks or test cases",
    icon: <PlaylistAddCheck />,
  },
  {
    label: "Assignment",
    description: "Assign to team member and set timeline",
    icon: <Person />,
  },
  {
    label: "Review & Save",
    description: "Final review of your task",
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

const CreateTask = ({
  projectId = null,
  milestoneId = null,
  initialData = null,
  onClose,
}) => {
  const { projects, categories, employees, createTask, milestones, updateTask } =
    useProject();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    projectId: projectId || initialData?.projectId || "",
    milestoneId: milestoneId || initialData?.milestoneId || "",
    category: initialData?.category || "",
    subcategory: initialData?.subcategory || "",
    status: initialData?.status || "pending",
    priority: initialData?.priority || "medium",
    assignedTo: initialData?.assignedTo || null,
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate) : null,
    estimatedHours: initialData?.estimatedHours || "",
    checklist: initialData?.checklist || [],
  });
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        checklist: initialData.checklist || [],
      });
    }
  }, [initialData]);

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim() !== "") {
      setFormData((prev) => ({
        ...prev,
        checklist: [
          ...prev.checklist,
          { text: newChecklistItem, completed: false },
        ],
      }));
      setNewChecklistItem("");
    }
  };

  const handleToggleChecklistItem = (index) => {
    const newChecklist = [...formData.checklist];
    newChecklist[index].completed = !newChecklist[index].completed;
    setFormData((prev) => ({ ...prev, checklist: newChecklist }));
  };

  const handleDeleteChecklistItem = (index) => {
    const newChecklist = formData.checklist.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, checklist: newChecklist }));
  };

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
      if (initialData) {
        await updateTask(initialData.id, formData);
      } else {
        await createTask(formData);
      }
      if (onClose) {
        onClose();
      } else {
        navigate("/tasks");
      }
    } catch (error) {
      console.error("Error saving task:", error);
      setErrors((prev) => ({
        ...prev,
        submission: error.message || "Failed to save task.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Basic Information
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
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              multiline
              rows={4}
              sx={{ mb: 3 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  error={!!errors.projectId}
                  sx={{ mb: 3 }}
                >
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={formData.projectId}
                    label="Project"
                    onChange={(e) =>
                      handleInputChange("projectId", e.target.value)
                    }
                  >
                    {(projects || []).map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Milestone</InputLabel>
                  <Select
                    value={formData.milestoneId}
                    label="Milestone"
                    onChange={(e) =>
                      handleInputChange("milestoneId", e.target.value)
                    }
                  >
                    {(milestones || [])
                      .filter((m) => m.projectId === formData.projectId)
                      .map((milestone) => (
                        <MenuItem key={milestone.id} value={milestone.id}>
                          {milestone.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 1: // Categorization
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
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
                        {option.label}
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
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 2: // Checklist
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", mb: 2 }}>
              <TextField
                fullWidth
                label="New Checklist Item"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
              />
              <Button
                onClick={handleAddChecklistItem}
                sx={{ ml: 1 }}
                variant="contained"
              >
                <Add />
              </Button>
            </Box>
            <List>
              {formData.checklist.map((item, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteChecklistItem(index)}
                    >
                      <Delete />
                    </IconButton>
                  }
                >
                  <Checkbox
                    checked={item.completed}
                    onChange={() => handleToggleChecklistItem(index)}
                  />
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </List>
          </Box>
        );

      case 3: // Assignment
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
                    sx={{ mr: 2, width: 32, height: 32 }}
                    src={option.photoURL}
                  >
                    {option.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.role || "N/A"}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField {...params} label="Assign To (Optional)" />
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
          </Box>
        );

      case 4: // Review
        return <Box sx={{ mt: 2 }}>{/* Review content here */}</Box>;
      default:
        return null;
    }
  };

  return (
    <Fade in={true} timeout={600}>
      <Box>
        <Paper
          elevation={0}
          sx={{
            p: isMobile ? 2 : 4,
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
                >
                  {isSubmitting ? "Saving..." : "Save Task"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  endIcon={<NavigateNext />}
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