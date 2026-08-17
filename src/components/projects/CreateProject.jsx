import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
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
  PersonAdd,
  Delete,
  ContentCopy,
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
    label: "Clients",
    description: "Add clients who can view project progress",
    icon: <PersonAdd />,
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
  const { id } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openClientDialog, setOpenClientDialog] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    company: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [onboardingCredentials, setOnboardingCredentials] = useState([]);

  const {
    createProject,
    updateProject,
    createTask,
    provisionClient,
    removeClientAccess,
    categories = [],
    employees = [],
    projects = [],
  } = useProject();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "planning",
    priority: "medium",
    dueDate: null,
    assignedTo: [],
    clients: [],
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

        if (category && subcategoriesData) {
          Object.entries(subcategoriesData).forEach(
            ([subcategoryName, taskList]) => {
              if (Array.isArray(taskList)) {
                taskList.forEach((task) => {
                  if (task && task.selected) {
                    tasks.push({
                      categoryName,
                      subcategoryName,
                      taskName: task.name,
                      taskOriginalId: task.id,
                      taskOriginalStatus: task.status,
                      taskOriginalPriority: task.priority,
                      categoryColor,
                    });
                  }
                });
              }
            }
          );
        }
      }
    );
    return tasks;
  }, [formData.selectedTasks, categories, theme.palette.grey]);

  // Load existing project data in edit mode
  useEffect(() => {
    if (id && projects.length > 0) {
      setLoadingProject(true);
      const existingProject = projects.find((p) => p.id === id);

      if (existingProject) {
        setIsEditMode(true);
        setFormData({
          name: existingProject.name || "",
          description: existingProject.description || "",
          status: existingProject.status || "planning",
          priority: existingProject.priority || "medium",
          dueDate: existingProject.dueDate?.toDate
            ? existingProject.dueDate.toDate()
            : existingProject.dueDate
            ? new Date(existingProject.dueDate)
            : null,
          assignedTo: (existingProject.assignedTo || [])
            .map((member) =>
              typeof member === "string"
                ? employees.find((employee) => employee.id === member)
                : member
            )
            .filter(Boolean),
          clients: existingProject.clients || [],
          selectedCategories: existingProject.selectedCategories || [],
          selectedTasks: existingProject.selectedTasks || {},
        });
      }
      setLoadingProject(false);
    }
  }, [id, projects, employees]);

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
            subcategory.tasks.map((taskObject) => ({
              ...taskObject,
              selected: true,
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
      const newSelectedTasks = JSON.parse(JSON.stringify(prev.selectedTasks));

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
        if (
          categories &&
          categories.length > 0 &&
          formData.selectedCategories.length === 0
        ) {
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
        // Clients are optional - no validation needed
        break;
      case 4:
        // Final review step - check submission errors if any
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
    for (let i = 0; i <= activeStep; i++) {
      if (!validateStep(i)) {
        setActiveStep(i);
        return;
      }
    }
    if (!validateStep(activeStep)) return;

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, submission: null }));

    const tasksToCreatePayload = selectedTasksPreview.map((taskPreview) => ({
      name: taskPreview.taskName,
      category: taskPreview.categoryName,
      subcategory: taskPreview.subcategoryName,
      status: taskPreview.taskOriginalStatus,
      priority: taskPreview.taskOriginalPriority,
      id: taskPreview.taskOriginalId,
    }));

    const projectPayload = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      dueDate: formData.dueDate || null,
      assignedTo: formData.assignedTo?.map((emp) => emp.id) || [],
      teamMembers: formData.assignedTo?.map((employee) => ({
        id: employee.id,
        name: employee.name || "",
        email: employee.email || "",
        role: employee.role || "",
        photoURL: employee.photoURL || "",
      })) || [],
      clients: (formData.clients || [])
        .filter((client) => client.uid)
        .map(({ uid, clientId, id: clientRecordId, name, company, role }) => ({
          uid,
          clientId,
          id: clientRecordId || clientId,
          name,
          company: company || "",
          role: role || "client",
        })),
      clientUserIds: (formData.clients || []).map((client) => client.uid).filter(Boolean),
      selectedCategories: formData.selectedCategories || [],
      selectedTasks: formData.selectedTasks || {},
    };

    // Deep clean to remove undefined values (Firestore doesn't allow undefined)
    const cleanPayload = JSON.parse(
      JSON.stringify(projectPayload, (key, value) =>
        value === undefined ? null : value
      )
    );

    try {
      const provisionClients = async (projectId) => {
        const results = [];
        for (const client of formData.clients.filter((item) => !item.uid)) {
          const access = await provisionClient({
            projectId,
            name: client.name,
            email: client.email,
            company: client.company || "",
          });
          results.push({ ...client, ...access });
        }
        return results;
      };

      if (isEditMode && id) {
        // Update existing project
        await updateProject(id, cleanPayload);
        const previousClients = projects.find((project) => project.id === id)?.clients || [];
        const retainedUids = new Set(
          formData.clients.map((client) => client.uid).filter(Boolean)
        );
        for (const removedClient of previousClients.filter(
          (client) => client.uid && !retainedUids.has(client.uid)
        )) {
          await removeClientAccess({ projectId: id, clientUid: removedClient.uid });
        }
        const credentials = await provisionClients(id);
        if (credentials.length > 0) setOnboardingCredentials(credentials);
        else navigate(`/projects/${id}`);
      } else {
        // Create new project
        const newProjectId = await createProject(cleanPayload);

        if (newProjectId) {
          for (const taskData of tasksToCreatePayload) {
            const taskPayload = {
              ...taskData,
              projectId: newProjectId,
            };
            await createTask(taskPayload);
          }
          const credentials = await provisionClients(newProjectId);
          if (credentials.length > 0) setOnboardingCredentials(credentials);
          else navigate("/projects");
        } else {
          console.error(
            "Project creation succeeded but no ID was returned by createProject."
          );
          throw new Error(
            "Project ID was not available after creation. Associated tasks could not be created."
          );
        }
      }
    } catch (error) {
      console.error("Error during project or task creation:", error);
      setErrors((prev) => ({
        ...prev,
        submission:
          error.message || "An unexpected error occurred. Please try again.",
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
              required
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
              required
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
        if (!categories || categories.length === 0) {
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
                No Categories Found{" "}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {" "}
                It looks like there are no categories set up yet. Please add
                categories to proceed.{" "}
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
                {" "}
                Add Category{" "}
              </Button>
            </Box>
          );
        }
        return (
          <Box>
            <Collapse in={!!errors.categories}>
              <Alert severity="error" sx={{ mb: 3 }}>
                {" "}
                {errors.categories}{" "}
              </Alert>
            </Collapse>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {" "}
              Select categories for your project. Default tasks will be
              included. You can then deselect specific tasks.{" "}
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
                            onChange={(e) => {
                              e.stopPropagation();
                              handleCategoryToggle(category.id);
                            }}
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
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="h6" fontWeight={600} noWrap>
                            {" "}
                            {category.name}{" "}
                          </Typography>
                        </Box>
                        <Collapse
                          in={isCategorySelected}
                          timeout="auto"
                          unmountOnExit
                        >
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
                                  {" "}
                                  {subcategory.name}{" "}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 1,
                                  }}
                                >
                                  {formData.selectedTasks[category.id]?.[
                                    subcategory.name
                                  ]?.map((task, taskIndex) => (
                                    <Chip
                                      key={task.id || taskIndex}
                                      label={task.name}
                                      size="small"
                                      variant={
                                        task.selected ? "filled" : "outlined"
                                      }
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTaskToggle(
                                          category.id,
                                          subcategory.name,
                                          taskIndex
                                        );
                                      }}
                                      onDelete={
                                        task.selected
                                          ? (e) => {
                                              e.stopPropagation();
                                              handleTaskToggle(
                                                category.id,
                                                subcategory.name,
                                                taskIndex
                                              );
                                            }
                                          : undefined
                                      }
                                      deleteIcon={
                                        task.selected ? (
                                          <CheckCircle
                                            sx={{
                                              color: `${category.color} !important`,
                                            }}
                                          />
                                        ) : undefined
                                      }
                                      sx={{
                                        fontWeight: 500,
                                        ...(task.selected && {
                                          backgroundColor: `${category.color}30`,
                                          color: category.color,
                                          borderColor: `${category.color}80`,
                                          border: "1px solid",
                                        }),
                                        ...(!task.selected && {
                                          borderColor: `${category.color}80`,
                                          color: `${category.color}`,
                                        }),
                                        "&:hover": {
                                          backgroundColor: `${category.color}40`,
                                        },
                                      }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            ))}
                            {(!category.subcategories ||
                              category.subcategories.length === 0) && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No subcategories or tasks defined for this
                                category.
                              </Typography>
                            )}
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
        if (!employees || employees.length === 0) {
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
                {" "}
                No team members are available to assign. Please add employees
                first.{" "}
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
                {" "}
                Add Team Member{" "}
              </Button>
            </Box>
          );
        }
        return (
          <Box>
            <Collapse in={!!errors.assignedTo}>
              <Alert severity="error" sx={{ mb: 3 }}>
                {" "}
                {errors.assignedTo}{" "}
              </Alert>
            </Collapse>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {" "}
              Assign team members to this project.{" "}
            </Typography>
            <Autocomplete
              multiple
              options={employees}
              getOptionLabel={(option) => option.name || option.email || ""}
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
                      fontWeight: 500,
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

      case 3:
        return (
          <Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Add clients who will have read-only access to view project progress. They will receive email notifications and can track project status.
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                backgroundColor: "rgba(139, 126, 200, 0.05)",
                border: "1px solid rgba(139, 126, 200, 0.2)",
                borderRadius: 2,
                mb: 3,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Manage Clients
              </Typography>

              {formData.clients && formData.clients.length > 0 ? (
                <Box>
                  <List>
                    {formData.clients.map((client, index) => (
                      <ListItem
                        key={client.id || index}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                          mb: 1,
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="body1" fontWeight={500}>
                                {client.name}
                              </Typography>
                              <Chip label="Client" size="small" color="primary" />
                            </Box>
                          }
                          secondary={client.email}
                        />
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => {
                            const updatedClients = formData.clients.filter((_, i) => i !== index);
                            handleInputChange("clients", updatedClients);
                          }}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No clients added yet. Clients can view project progress in their own dashboard.
                </Alert>
              )}

              <Button
                startIcon={<Add />}
                variant="outlined"
                onClick={() => setOpenClientDialog(true)}
                sx={{ mt: 2 }}
              >
                Add Client
              </Button>
            </Paper>
          </Box>
        );

      case 4: {
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
                {" "}
                {errors.submission}{" "}
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
            <Typography variant="h6" gutterBottom fontWeight={600}>
              {" "}
              Project Summary{" "}
            </Typography>
            <Grid container spacing={3}>
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
                    {" "}
                    Project Details{" "}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {" "}
                    <strong>Name:</strong> {formData.name || "Not specified"}{" "}
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
                    {" "}
                    <strong>Status:</strong>{" "}
                    {selectedStatus ? (
                      <Chip
                        label={selectedStatus.label}
                        size="small"
                        sx={{
                          backgroundColor: `${selectedStatus.color}40`,
                          color: selectedStatus.color,
                          fontWeight: 600,
                        }}
                      />
                    ) : (
                      "N/A"
                    )}{" "}
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
                    {" "}
                    <strong>Priority:</strong>{" "}
                    {selectedPriority ? (
                      <Chip
                        label={selectedPriority.label}
                        size="small"
                        sx={{
                          backgroundColor: `${selectedPriority.color}40`,
                          color: selectedPriority.color,
                          fontWeight: 600,
                        }}
                      />
                    ) : (
                      "N/A"
                    )}{" "}
                  </Typography>
                  {formData.dueDate && (
                    <Typography variant="body2">
                      {" "}
                      <strong>Due Date:</strong>{" "}
                      {new Date(formData.dueDate).toLocaleDateString()}{" "}
                    </Typography>
                  )}
                </Paper>
              </Grid>
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
                    {" "}
                    Team & Tasks{" "}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {" "}
                    <strong>Team Members:</strong> {formData.assignedTo.length}{" "}
                    assigned{" "}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {" "}
                    <strong>Categories:</strong>{" "}
                    {formData.selectedCategories.length} selected{" "}
                  </Typography>
                  <Typography variant="body2">
                    {" "}
                    <strong>Total Tasks:</strong> {selectedTasksPreview.length}{" "}
                    tasks selected{" "}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            {selectedTasksPreview.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  fontWeight={600}
                  gutterBottom
                >
                  {" "}
                  Selected Tasks ({selectedTasksPreview.length}){" "}
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
                      key={task.taskOriginalId || index}
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
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <>
      {loadingProject ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Fade in={true} timeout={600}>
            <Box sx={{ p: isMobile ? 1 : 2 }}>
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
              variant={isMobile ? "h5" : "h4"}
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
              {" "}
              Create New Project{" "}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {" "}
              Follow the steps to setup and launch your new project.{" "}
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
            {" "}
            Back to Projects{" "}
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
                      {" "}
                      {step.description}{" "}
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
              {" "}
              {steps[activeStep].label}{" "}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {" "}
              {steps[activeStep].description}{" "}
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
              {" "}
              Back{" "}
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting || loadingProject}
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
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                    ? "Update Project"
                    : "Create Project"}
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
                  {" "}
                  Continue{" "}
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
      </Fade>

      {/* Add Client Dialog */}
      <Dialog
        open={openClientDialog}
        onClose={() => {
          setOpenClientDialog(false);
          setNewClient({ name: "", email: "", company: "" });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Client to Project</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Client Name"
              value={newClient.name}
              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              margin="normal"
              required
              helperText="Client will receive a portal ID and temporary password at this email"
            />
            <TextField
              fullWidth
              label="Company (Optional)"
              value={newClient.company}
              onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenClientDialog(false);
              setNewClient({ name: "", email: "", company: "" });
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!newClient.name || !newClient.email || !newClient.email.includes("@")) {
                alert("Please fill in all required fields with valid data");
                return;
              }

              const clientToAdd = {
                id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: newClient.name,
                email: newClient.email.toLowerCase(),
                company: newClient.company || "",
                role: "client",
                addedAt: new Date().toISOString(),
              };

              handleInputChange("clients", [...(formData.clients || []), clientToAdd]);
              setOpenClientDialog(false);
              setNewClient({ name: "", email: "", company: "" });
            }}
            variant="contained"
          >
            Add Client
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={onboardingCredentials.length > 0}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CheckCircle color="success" /> Client access is ready
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Temporary passwords are shown only once. Copy them now and share them
            through a secure channel.
          </Alert>
          {onboardingCredentials.map((credential) => (
            <Paper key={credential.uid} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography fontWeight={700}>{credential.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {credential.email}
              </Typography>
              <TextField
                fullWidth
                label="Client ID"
                value={credential.clientId}
                InputProps={{ readOnly: true }}
                sx={{ mb: 1.5 }}
              />
              <TextField
                fullWidth
                label={credential.temporaryPassword ? "Temporary password" : "Password"}
                value={credential.temporaryPassword || "Existing client password unchanged"}
                InputProps={{
                  readOnly: true,
                  endAdornment: credential.temporaryPassword ? (
                    <IconButton
                      aria-label="Copy client credentials"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `Client ID: ${credential.clientId}\nTemporary password: ${credential.temporaryPassword}`
                        )
                      }
                    >
                      <ContentCopy />
                    </IconButton>
                  ) : null,
                }}
              />
            </Paper>
          ))}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => navigate(isEditMode && id ? `/projects/${id}` : "/projects")}
          >
            Continue to workspace
          </Button>
        </DialogActions>
      </Dialog>
        </>
      )}
    </>
  );
};

export default CreateProject;
