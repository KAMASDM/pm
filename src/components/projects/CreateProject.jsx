import React, { useState, useEffect } from "react";
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
    description: "Select relevant categories and tasks",
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
  const [errors, setErrors] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createProject, categories, employees } = useProject();
  const [selectedTasksPreview, setSelectedTasksPreview] = useState([]);
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

  useEffect(() => {
    const tasks = [];
    Object.entries(formData.selectedTasks).forEach(
      ([categoryId, subcategories]) => {
        Object.entries(subcategories).forEach(([subcategoryName, taskList]) => {
          taskList.forEach((task) => {
            if (task.selected) {
              tasks.push({
                categoryName:
                  categories.find((c) => c.id === categoryId)?.name ||
                  "Unknown Category",
                subcategoryName,
                taskName: task.name,
              });
            }
          });
        });
      }
    );
    setSelectedTasksPreview(tasks);
  }, [formData.selectedTasks, categories]);

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

  const handleCategoryToggle = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    setFormData((prev) => {
      const isSelected = prev.selectedCategories.includes(categoryId);

      if (isSelected) {
        // Remove category and its tasks
        const newSelectedCategories = prev.selectedCategories.filter(
          (id) => id !== categoryId
        );
        const newSelectedTasks = { ...prev.selectedTasks };
        delete newSelectedTasks[categoryId];

        return {
          ...prev,
          selectedCategories: newSelectedCategories,
          selectedTasks: newSelectedTasks,
        };
      } else {
        // Add category with default tasks structure
        const newSelectedTasks = { ...prev.selectedTasks };
        newSelectedTasks[categoryId] = {};

        category.subcategories?.forEach((subcategory) => {
          newSelectedTasks[categoryId][subcategory.name] =
            subcategory.tasks.map((task) => ({
              name: task,
              selected: true, // Default to selected
            }));
        });

        return {
          ...prev,
          selectedCategories: [...prev.selectedCategories, categoryId],
          selectedTasks: newSelectedTasks,
        };
      }
    });
  };

  const handleTaskToggle = (categoryId, subcategoryName, taskIndex) => {
    setFormData((prev) => {
      const newSelectedTasks = { ...prev.selectedTasks };
      if (
        newSelectedTasks[categoryId] &&
        newSelectedTasks[categoryId][subcategoryName]
      ) {
        newSelectedTasks[categoryId][subcategoryName][taskIndex].selected =
          !newSelectedTasks[categoryId][subcategoryName][taskIndex].selected;
      }

      return {
        ...prev,
        selectedTasks: newSelectedTasks,
      };
    });
  };

  const validateStep = (step) => {
    const newErrors = {};
    switch (step) {
      case 0:
        if (!formData.name.trim()) newErrors.name = "Project name is required";
        if (!formData.description.trim())
          newErrors.description = "Project description is required";
        break;
      case 1:
        if (formData.selectedCategories.length === 0) {
          newErrors.categories = "Please select at least one category";
        }
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
      const projectData = {
        ...formData,
        tasks: selectedTasksPreview.map((task) => ({
          name: task.taskName,
          category: task.categoryName,
          subcategory: task.subcategoryName,
          status: "pending",
          priority: "medium",
        })),
      };

      await createProject(projectData);
      navigate("/projects");
    } catch (error) {
      console.error("Error creating project:", error);
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
                backgroundColor: theme.palette.background.paper,
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
                categories to proceed with project creation.
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
              Select the categories that apply to your project. Default tasks
              will be included for each category.
            </Typography>
            <Grid container spacing={2}>
              {categories.map((category) => {
                const isCategorySelected = formData.selectedCategories.includes(
                  category.id
                );

                return (
                  <Grid item xs={12} key={category.id}>
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
                          <Box sx={{ pl: isMobile ? 2 : 4, pt: 2 }}>
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
                                  {subcategory.tasks.map((task, taskIndex) => {
                                    const isTaskSelected =
                                      formData.selectedTasks[category.id]?.[
                                        subcategory.name
                                      ]?.[taskIndex]?.selected;
                                    return (
                                      <Chip
                                        key={taskIndex}
                                        label={task}
                                        size="small"
                                        variant={
                                          isTaskSelected ? "filled" : "outlined"
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
                                          // Styles for SELECTED chips
                                          ...(isTaskSelected && {
                                            backgroundColor: `${category.color}30`,
                                            color: category.color,
                                            borderColor: `${category.color}80`,
                                            border: "1px solid",
                                          }),
                                          // Styles for UNSELECTED chips
                                          ...(!isTaskSelected && {
                                            borderColor: `${category.color}80`,
                                            color: `${category.color}`,
                                          }),
                                          "&:hover": {
                                            backgroundColor: `${category.color}40`,
                                            color: category.color,
                                          },
                                        }}
                                      />
                                    );
                                  })}
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
        return (
          <Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Select team members to assign to this project (optional).
            </Typography>
            <Autocomplete
              multiple
              options={employees}
              getOptionLabel={(option) => option.name || option.email}
              value={formData.assignedTo}
              onChange={(event, newValue) =>
                handleInputChange("assignedTo", newValue)
              }
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
                  placeholder="Search and select team members"
                />
              )}
              sx={{ mb: 3 }}
            />
            {employees.length === 0 && (
              <Alert severity="info">
                No team members found. You can add them in the 'Employees'
                section and they will appear here.
              </Alert>
            )}
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
                    <strong>Name:</strong> {formData.name || "Not specified"}
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
                        color: `${selectedStatus?.color}`,
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
                        color: `${selectedPriority?.color}`,
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
                  {selectedTasksPreview.map((task, index) => {
                    // Find the category to get its color
                    const category = categories.find(
                      (c) => c.name === task.categoryName
                    );
                    const taskColor = category
                      ? category.color
                      : theme.palette.grey[500];

                    return (
                      <Chip
                        key={index}
                        label={`${task.categoryName}: ${task.taskName}`}
                        size="small"
                        sx={{
                          fontWeight: 500,
                          backgroundColor: `${taskColor}26`,
                          color: `${taskColor}`,
                          border: `1px solid ${taskColor}80`,
                        }}
                      />
                    );
                  })}
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
          <Stepper activeStep={activeStep} alternativeLabel>
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
                          : theme.palette.action.disabledBackground,
                        color: props.active
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
                  <Typography fontWeight={600}>{step.label}</Typography>
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
                  {isSubmitting ? "Creating..." : "Create Project"}
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
