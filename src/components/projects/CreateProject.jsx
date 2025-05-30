import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  Divider,
  Alert,
  Fade,
  Collapse,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  ArrowBack,
  Save,
  CheckCircle,
  FolderOpen,
  Assignment,
  Group,
  AccessTime,
  NavigateNext,
  Add,
} from "@mui/icons-material";
import useProject from "../../hooks/useProject";

const steps = [
  {
    label: "Project Details",
    description: "Basic information about your project",
    icon: <FolderOpen />,
  },
  {
    label: "Task Categories",
    description: "Select relevant categories and tasks for the project",
    icon: <Assignment />,
  },
  {
    label: "Team Assignment",
    description: "Assign team members to the project",
    icon: <Group />,
  },
  {
    label: "Timeline & Review",
    description: "Set deadlines and review your project",
    icon: <AccessTime />,
  },
];

const statusOptions = [
  { value: "planning", label: "Planning", color: "#64B5F6" },
  { value: "in-progress", label: "In Progress", color: "#FFB74D" },
  { value: "completed", label: "Completed", color: "#81C784" },
  { value: "on-hold", label: "On Hold", color: "#F44336" },
];

const priorityOptions = [
  { value: "low", label: "Low", color: "#6BBF6B" },
  { value: "medium", label: "Medium", color: "#FFD700" },
  { value: "high", label: "High", color: "#DC3545" },
];

const CreateProject = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createProject, categories = [], employees = [] } = useProject(); // Default to empty arrays
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "planning",
    priority: "medium",
    dueDate: null,
    assignedTo: [],
    selectedCategories: [],
    selectedTasks: {},
  });

  const selectedTasksPreview = useMemo(() => {
    const tasks = [];
    if (!categories || categories.length === 0) return tasks;

    Object.entries(formData.selectedTasks).forEach(
      ([categoryId, subcategoriesData]) => {
        const category = categories.find((c) => c.id === categoryId);
        const categoryName = category?.name;
        const categoryColor = category?.color || theme.palette.grey[500];

        Object.entries(subcategoriesData).forEach(
          ([subcategoryName, taskList]) => {
            taskList.forEach((task) => {
              if (task.selected) {
                tasks.push({
                  categoryName,
                  subcategoryName,
                  taskName: task.name,
                  categoryColor,
                });
              }
            });
          }
        );
      }
    );
    return tasks;
  }, [formData.selectedTasks, categories, theme.palette.grey]);

  useEffect(() => {
    if (formData.selectedCategories.length > 0 && errors.categories) {
      setErrors((prev) => ({ ...prev, categories: null }));
    }
  }, [formData.selectedCategories, errors.categories]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleCategoryToggle = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    setFormData((prev) => {
      const isSelected = prev.selectedCategories.includes(categoryId);
      const newSelectedCategories = isSelected
        ? prev.selectedCategories.filter((id) => id !== categoryId)
        : [...prev.selectedCategories, categoryId];

      const newSelectedTasks = { ...prev.selectedTasks };

      if (isSelected) {
        delete newSelectedTasks[categoryId];
      } else {
        newSelectedTasks[categoryId] = {};

        category.subcategories?.forEach((subcategory) => {
          newSelectedTasks[categoryId][subcategory.name] =
            subcategory.tasks.map((taskName) => ({
              name: taskName,
              selected: true, // Default to selected
            }));
        });
      }
      return {
        ...prev,
        selectedCategories: newSelectedCategories,
        selectedTasks: newSelectedTasks,
      };
    });
  };

  const handleTaskToggle = (categoryId, subcategoryName, taskIndex) => {
    setFormData((prev) => {
      const newSelectedTasks = JSON.parse(JSON.stringify(prev.selectedTasks)); // Deep copy for safety
      if (
        newSelectedTasks[categoryId] &&
        newSelectedTasks[categoryId][subcategoryName] &&
        newSelectedTasks[categoryId][subcategoryName][taskIndex]
      ) {
        newSelectedTasks[categoryId][subcategoryName][taskIndex].selected =
          !newSelectedTasks[categoryId][subcategoryName][taskIndex].selected;
      }
      return { ...prev, selectedTasks: newSelectedTasks };
    });
  };

  const validateStep = (step) => {
    const newErrors = {};
    switch (step) {
      case 0:
        if (!formData.name.trim()) newErrors.name = "Project name is required.";
        if (!formData.description.trim())
          newErrors.description = "Project description is required.";
        break;
      case 1:
        if (categories.length > 0 && formData.selectedCategories.length === 0) {
          newErrors.categories = "Please select at least one category.";
        }
        break;
      case 2:
        if (
          employees &&
          employees.length > 0 &&
          formData.assignedTo.length === 0
        ) {
          newErrors.assignedTo = "Please assign at least one team member.";
        }
        break;
      case 3:
        if (errors.submission) newErrors.submission = errors.submission;
        break;
      default:
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
    if (
      !validateStep(0) ||
      !validateStep(1) ||
      !validateStep(2) ||
      !validateStep(3)
    ) {
      for (let i = 0; i <= activeStep; i++) {
        if (!validateStep(i)) {
          setActiveStep(i);
          return;
        }
      }
      if (!validateStep(activeStep)) return;
    }

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, submission: null }));

    const projectPayload = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      dueDate: formData.dueDate ? formData.dueDate.toISOString() : null,

      assignedTo: formData.assignedTo,

      selectedCategories: formData.selectedCategories,
      selectedTasks: formData.selectedTasks,

      tasks: selectedTasksPreview.map((taskPreview) => ({
        name: taskPreview.taskName,
        category: taskPreview.categoryName,
        subcategory: taskPreview.subcategoryName,
        status: "pending",
        priority: "medium",
      })),
    };

    try {
      await createProject(projectPayload);
      navigate("/projects");
    } catch (error) {
      console.error("Error creating project:", error);
      setErrors((prev) => ({
        ...prev,
        submission:
          error.message ||
          "Failed to create project. Please check the details and try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              fullWidth
              label="Project Name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              autoFocus
            />
            <TextField
              fullWidth
              label="Project Description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              multiline
              rows={4}
              error={!!errors.description}
              helperText={errors.description}
            />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.status}>
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.priority}>
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
          </Box>
        );
      case 1:
        if (categories.length === 0) {
          return (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                py: 8,
                px: 3,
                border: `2px dashed ${theme.palette.divider}`,
                borderRadius: 2,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <Add
                sx={{
                  fontSize: 60,
                  color: theme.palette.text.secondary,
                  mb: 2,
                }}
              />
              <Typography
                variant="h5"
                color="text.primary"
                fontWeight={600}
                gutterBottom
              >
                No Categories Found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                It looks like there are no categories set up yet. Please add
                categories to proceed.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate("/categories")}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Add Category
              </Button>
            </Box>
          );
        }

        return (
          <Box>
            <Collapse in={!!errors.categories}>
              <Alert severity="error" sx={{ mb: 3 }}>
                {errors.categories}
              </Alert>
            </Collapse>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Select categories for your project. Default tasks will be
              included.
            </Typography>
            <Grid container spacing={2}>
              {categories.map((category) => {
                const isCategorySelected = formData.selectedCategories.includes(
                  category.id
                );

                return (
                  <Grid item xs={12} md={6} key={category.id}>
                    <Card
                      elevation={0}
                      sx={{
                        border: `2px solid`,
                        borderColor: isCategorySelected
                          ? category.color
                          : `${category.color}40`,
                        backgroundColor: isCategorySelected
                          ? `${category.color}1A`
                          : "transparent",
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          borderColor: category.color,
                          boxShadow: `0 4px 20px ${category.color}40`,
                          transform: "translateY(-2px)",
                        },
                        borderRadius: 2,
                        height: "100%",
                      }}
                      onClick={() => handleCategoryToggle(category.id)}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: isCategorySelected ? 2 : 0,
                          }}
                        >
                          <Checkbox
                            checked={isCategorySelected}
                            sx={{
                              color: category.color,
                              "&.Mui-checked": { color: category.color },
                            }}
                          />
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              backgroundColor: category.color,
                            }}
                          />
                          <Typography variant="h6" fontWeight={600}>
                            {category.name}
                          </Typography>
                        </Box>
                        <Collapse in={isCategorySelected}>
                          <Box
                            sx={{
                              pl: isMobile ? 2 : 4,
                              pt: 2,
                              maxHeight: 200,
                              overflowY: "auto",
                            }}
                          >
                            {category.subcategories?.map((subcategory) => (
                              <Box key={subcategory.name} sx={{ mb: 2 }}>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={600}
                                  color="text.primary"
                                  gutterBottom
                                >
                                  {subcategory.name}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 1,
                                  }}
                                >
                                  {subcategory.tasks.map(
                                    (taskName, taskIndex) => {
                                      const isTaskSelected =
                                        formData.selectedTasks[category.id]?.[
                                          subcategory.name
                                        ]?.[taskIndex]?.selected;
                                      return (
                                        <Chip
                                          key={taskIndex}
                                          label={taskName}
                                          size="small"
                                          variant={
                                            isTaskSelected
                                              ? "filled"
                                              : "outlined"
                                          }
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleTaskToggle(
                                              category.id,
                                              subcategory.name,
                                              taskIndex
                                            );
                                          }}
                                          sx={{
                                            fontWeight: 500,
                                            ...(isTaskSelected && {
                                              backgroundColor: `${category.color}30`,
                                              color: category.color,
                                              borderColor: `${category.color}80`,
                                              border: "1px solid",
                                            }),
                                            ...(!isTaskSelected && {
                                              borderColor: `${category.color}80`,
                                              color: `${category.color}`,
                                            }),
                                            "&:hover": {
                                              backgroundColor: `${category.color}40` /* color: category.color (already set or inherits) */,
                                            },
                                          }}
                                        />
                                      );
                                    }
                                  )}
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </Collapse>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        );

      case 2:
        if (employees.length === 0) {
          return (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                py: 8,
                px: 3,
                border: `2px dashed ${theme.palette.divider}`,
                borderRadius: 2,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <Add
                sx={{
                  fontSize: 60,
                  color: theme.palette.text.secondary,
                  mb: 2,
                }}
              />
              <Typography
                variant="h5"
                color="text.primary"
                fontWeight={600}
                gutterBottom
              >
                {" "}
                No Team Members Found{" "}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                No team members are available to assign. Please add employees
                first.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate("/employees")}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Add Team Member
              </Button>
            </Box>
          );
        }
        return (
          <Box>
            <Collapse in={!!errors.assignedTo}>
              <Alert severity="error" sx={{ mb: 3 }}>
                {errors.assignedTo}
              </Alert>
            </Collapse>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Assign team members to this project.
            </Typography>
            <Autocomplete
              multiple
              options={employees}
              getOptionLabel={(option) => option.name || option.email}
              value={formData.assignedTo}
              onChange={(event, newValue) =>
                handleInputChange("assignedTo", newValue)
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option.name || option.email}
                    {...getTagProps({ index })}
                    key={option.id}
                    sx={{
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assign Team Members"
                  placeholder="Search and select members"
                  error={!!errors.assignedTo}
                />
              )}
              sx={{ mb: 3 }}
            />
          </Box>
        );

      case 3: {
        const selectedStatus = statusOptions.find(
          (s) => s.value === formData.status
        );
        const selectedPriority = priorityOptions.find(
          (p) => p.value === formData.priority
        );

        return (
          <Box>
            <Collapse in={!!errors.submission}>
              <Alert severity="error" sx={{ mb: 3 }}>
                {errors.submission}
              </Alert>
            </Collapse>
            <DatePicker
              label="Due Date (Optional)"
              value={formData.dueDate}
              onChange={(newValue) => handleInputChange("dueDate", newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: {
                    mb: 3,
                    "& .MuiOutlinedInput-root": {
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.light,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main,
                        borderWidth: "2px",
                      },
                    },
                  },
                },
              }}
            />
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Project Summary
            </Typography>
            <Grid container spacing={3}>
              {/* Project Details Summary Card */}
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    backgroundColor: `${theme.palette.primary.main}0D`,
                    border: `1px solid ${theme.palette.primary.main}40`,
                    height: "100%",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    color="primary.main"
                    gutterBottom
                  >
                    Project Details
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Name:</strong> {formData.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <strong>Status:</strong>
                    <Chip
                      label={selectedStatus?.label}
                      size="small"
                      sx={{
                        backgroundColor: `${selectedStatus?.color}40`,
                        color: selectedStatus?.color,
                        fontWeight: 600,
                      }}
                    />
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <strong>Priority:</strong>
                    <Chip
                      label={selectedPriority?.label}
                      size="small"
                      sx={{
                        backgroundColor: `${selectedPriority?.color}40`,
                        color: selectedPriority?.color,
                        fontWeight: 600,
                      }}
                    />
                  </Typography>
                  {formData.dueDate && (
                    <Typography variant="body2">
                      <strong>Due Date:</strong>{" "}
                      {new Date(formData.dueDate).toLocaleDateString()}
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Team & Tasks Summary Card */}
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    backgroundColor: `${theme.palette.secondary.main}0D`,
                    border: `1px solid ${theme.palette.secondary.main}40`,
                    height: "100%",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    color="secondary.main"
                    gutterBottom
                  >
                    Team & Tasks
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Team Members:</strong> {formData.assignedTo.length}{" "}
                    assigned
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Categories:</strong>{" "}
                    {formData.selectedCategories.length} selected
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total Tasks:</strong> {selectedTasksPreview.length}{" "}
                    tasks
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Selected Tasks Preview */}
            {selectedTasksPreview.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  fontWeight={600}
                  gutterBottom
                >
                  Selected Tasks ({selectedTasksPreview.length})
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    maxHeight: 200,
                    overflow: "auto",
                    backgroundColor: "transparent",
                    borderColor: theme.palette.divider,
                    borderRadius: 2,
                  }}
                >
                  {selectedTasksPreview.map((task, index) => (
                    <Chip
                      key={index}
                      label={`${task.categoryName}: ${task.taskName}`}
                      size="small"
                      sx={{
                        fontWeight: 500,
                        backgroundColor: `${task.categoryColor}26`,
                        color: task.categoryColor,
                        border: `1px solid ${task.categoryColor}80`,
                      }}
                    />
                  ))}
                </Paper>
              </Box>
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
              Create New Project
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Follow the steps to setup and launch your new project.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/projects")}
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
            Back to Projects
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
            alternativeLabel={isMobile ? false : true}
            orientation={isMobile ? "vertical" : "horizontal"}
          >
            {steps.map((step) => (
              <Step key={step.label}>
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
              sx={{ visibility: activeStep === 0 ? "hidden" : "visible" }}
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
                  {isSubmitting ? "Creating Project..." : "Create Project"}
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

export default CreateProject;
