import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Menu,
  MenuItem,
  Fade,
  useTheme,
  CircularProgress,
  Input,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  ExpandMore,
  Category,
  MoreVert,
} from "@mui/icons-material";
import useProject from "../../hooks/useProject";
import ConfirmationDialog from "../common/ConfirmationDialog";
import defaultCategories from "../../utils/defaultCategory";

const colorOptions = [
  "#2196F3",
  "#4CAF50",
  "#FFC107",
  "#F44336",
  "#9C27B0",
  "#00BCD4",
  "#FFEB3B",
  "#795548",
  "#9E9E9E",
  "#E0E0E0",
];

const taskStatusOptions = [
  { value: "pending", label: "Pending", color: "#64B5F6" },
  { value: "in-progress", label: "In Progress", color: "#FFB74D" },
  { value: "completed", label: "Completed", color: "#81C784" },
  { value: "blocked", label: "Blocked", color: "#F44336" },
];

const taskPriorityOptions = [
  { value: "low", label: "Low", color: "#6BBF6B" },
  { value: "medium", label: "Medium", color: "#FFD700" },
  { value: "high", label: "High", color: "#DC3545" },
];

const CategoryManager = () => {
  const theme = useTheme();
  const {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
    loading: projectLoading,
  } = useProject();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const [newTaskValues, setNewTaskValues] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    color: "#8B7EC8",
    description: "",
    subcategories: [],
  });

  const ensureTaskObject = (task, index) => {
    if (typeof task === "string") {
      return {
        id: `task_${Date.now()}_${index}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        name: task,
        status: taskStatusOptions[0].value,
        priority: taskPriorityOptions[0].value,
      };
    }
    return {
      id:
        task.id ||
        `task_${Date.now()}_${index}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      name: task.name,
      status: task.status || taskStatusOptions[0].value,
      priority: task.priority || taskPriorityOptions[0].value,
      ...task,
    };
  };

  useEffect(() => {
    const initialValues = {};
    formData.subcategories?.forEach((_, index) => {
      initialValues[index] = {
        name: "",
        status: taskStatusOptions[0].value,
        priority: taskPriorityOptions[0].value,
      };
    });
    setNewTaskValues(initialValues);
  }, [formData.subcategories]);

  const handleNewTaskValueChange = (subIndex, field, value) => {
    setNewTaskValues((prev) => ({
      ...prev,
      [subIndex]: {
        ...(prev[subIndex] || {
          name: "",
          status: taskStatusOptions[0].value,
          priority: taskPriorityOptions[0].value,
        }),
        [field]: value,
      },
    }));
  };

  const handleAddTask = (subIndex) => {
    const taskDetails = newTaskValues[subIndex];
    if (!taskDetails || !taskDetails.name?.trim()) return;

    const newTaskObject = {
      id: String(Date.now() + Math.random()), // Simple unique ID
      name: taskDetails.name.trim(),
      status: taskDetails.status,
      priority: taskDetails.priority,
    };

    setFormData((prev) => {
      const updatedSubcategories = [...prev.subcategories];
      const currentTasks = updatedSubcategories[subIndex].tasks || [];
      updatedSubcategories[subIndex] = {
        ...updatedSubcategories[subIndex],
        tasks: [...currentTasks, newTaskObject],
      };
      return { ...prev, subcategories: updatedSubcategories };
    });

    setNewTaskValues((prev) => ({
      ...prev,
      [subIndex]: {
        ...prev[subIndex],
        name: "", // Reset name, keep status/priority for next task
      },
    }));
  };

  const handleRemoveTask = (subIndex, taskIndex) => {
    setFormData((prev) => {
      const updatedSubcategories = [...prev.subcategories];
      const currentTasks = updatedSubcategories[subIndex].tasks || [];
      updatedSubcategories[subIndex] = {
        ...updatedSubcategories[subIndex],
        tasks: currentTasks.filter((_, idx) => idx !== taskIndex),
      };
      return { ...prev, subcategories: updatedSubcategories };
    });
  };

  const handleOpenDialog = (category = null) => {
    setSelectedCategory(category);
    const initialSubcategories =
      category?.subcategories?.map((sub) => ({
        name: sub.name,
        tasks:
          sub.tasks?.map((task, taskIdx) => ensureTaskObject(task, taskIdx)) ||
          [],
      })) || [];

    setFormData({
      name: category?.name || "",
      color: category?.color || "#8B7EC8",
      description: category?.description || "",
      subcategories: initialSubcategories,
    });
    // setNewTaskValues will be set by useEffect based on formData.subcategories
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCategory(null);
    setFormData({
      name: "",
      color: "#8B7EC8",
      description: "",
      subcategories: [],
    });
    setNewTaskValues({});
  };

  const handleSaveCategory = async () => {
    try {
      setActionLoading(true);
      // Ensure all tasks in formData are proper objects before saving
      const categoryDataToSave = {
        ...formData,
        subcategories: formData.subcategories.map((sub) => ({
          ...sub,
          tasks: sub.tasks.map((task, taskIdx) =>
            ensureTaskObject(task, taskIdx)
          ),
        })),
      };

      if (selectedCategory) {
        await updateCategory(selectedCategory.id, categoryDataToSave);
      } else {
        await createCategory(categoryDataToSave);
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    try {
      setActionLoading(true);
      await deleteCategory(selectedCategory.id);
      handleMenuClose();
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setActionLoading(false);
      setConfirmOpen(false);
    }
  };

  const handleMenuOpen = (event, category) => {
    event.stopPropagation();
    setSelectedCategory(category);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const showConfirmation = (action) => {
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  const executeConfirmedAction = () => {
    if (confirmAction) {
      confirmAction.action();
    }
  };

  const getTotalTasks = (category) => {
    if (!category.subcategories) return 0;
    return category.subcategories.reduce(
      (total, sub) => total + (sub.tasks?.length || 0),
      0
    );
  };

  return (
    <Fade in={true} timeout={600}>
      <Box>
        <ConfirmationDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={executeConfirmedAction}
          title={confirmAction?.title || "Confirm Action"}
          message={
            confirmAction?.message ||
            "Are you sure you want to perform this action?"
          }
          loading={actionLoading}
        />
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
              Task Categories
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Organize your project tasks with custom categories
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontWeight: 600,
            }}
            disabled={projectLoading}
          >
            New Category
          </Button>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            background:
              "linear-gradient(135deg, rgba(139, 126, 200, 0.03), rgba(181, 169, 214, 0.05))",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Categories Overview
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "white",
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography variant="h3" fontWeight={700} color="primary">
                  {categories.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Categories
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "white",
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="h3"
                  fontWeight={700}
                  sx={{ color: "#4CAF50" }}
                >
                  {categories.reduce(
                    (total, cat) => total + (cat.subcategories?.length || 0),
                    0
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Subcategories
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "white",
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="h3"
                  fontWeight={700}
                  sx={{ color: "#FF9800" }}
                >
                  {categories.reduce(
                    (total, cat) => total + getTotalTasks(cat),
                    0
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Task Templates
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "white",
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="h3"
                  fontWeight={700}
                  sx={{ color: "#2196F3" }}
                >
                  {Math.round(
                    categories.length > 0
                      ? categories.reduce(
                          (total, cat) => total + getTotalTasks(cat),
                          0
                        ) / categories.length
                      : 0
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Tasks/Category
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {projectLoading && categories.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : categories.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: "center",
              borderRadius: 3,
              background:
                "linear-gradient(135deg, rgba(139, 126, 200, 0.03), rgba(181, 169, 214, 0.05))",
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Category
              sx={{
                fontSize: 60,
                color: "text.secondary",
                mb: 2,
                opacity: 0.7,
              }}
            />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              No categories yet
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
            >
              Create your first category to start organizing tasks.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Create Your First Category
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {categories.map((category) => (
              <Grid item xs={12} key={category.id || category.name}>
                <Accordion
                  expanded={expandedCategory === category.id}
                  onChange={() =>
                    setExpandedCategory(
                      expandedCategory === category.id ? null : category.id
                    )
                  }
                  elevation={0}
                  sx={{
                    "&:before": { display: "none" },
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                      p: 3,
                      "& .MuiAccordionSummary-content": {
                        alignItems: "center",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        flex: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          color: category.color,
                          backgroundColor: category.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Category sx={{ color: "white", fontSize: 20 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {category.name}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
                          <Chip
                            label={`${
                              category.subcategories?.length || 0
                            } subcategories`}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: category.color,
                              color: category.color,
                            }}
                          />
                          <Chip
                            label={`${getTotalTasks(category)} tasks`}
                            size="small"
                            sx={{
                              backgroundColor: `${category.color}20`, // Opacity for background
                              color: category.color,
                            }}
                          />
                        </Box>
                      </Box>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, category)}
                        disabled={projectLoading || actionLoading}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0, pt: 0 }}>
                    <Divider />
                    <Box sx={{ p: 3 }}>
                      {category.subcategories?.map((subcategory) => (
                        <Card
                          key={subcategory.name}
                          elevation={0}
                          sx={{
                            mb: 2,
                            border: `1px solid ${category.color}`,
                            borderRadius: 2,
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 2,
                              }}
                            >
                              <Typography variant="subtitle1" fontWeight={600}>
                                {subcategory.name}
                              </Typography>
                            </Box>
                            {subcategory.tasks &&
                              subcategory.tasks.length > 0 && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 1,
                                  }}
                                >
                                  {subcategory.tasks.map((task, taskIndex) => {
                                    const statusColor =
                                      taskStatusOptions.find(
                                        (s) => s.value === task.status
                                      )?.color || category.color;
                                    return (
                                      <Chip
                                        key={task.id || taskIndex} // task.id is preferred
                                        label={task.name}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                          borderColor: statusColor,
                                          color: statusColor,
                                          backgroundColor: `${statusColor}1A`, // Lighter background with opacity
                                        }}
                                      />
                                    );
                                  })}
                                </Box>
                              )}
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            ))}
          </Grid>
        )}

        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 150 } }}
        >
          <MenuItem
            onClick={() => {
              handleOpenDialog(selectedCategory);
              handleMenuClose();
            }}
            disabled={actionLoading}
          >
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => {
              showConfirmation({
                action: handleDeleteCategory,
                title: "Delete Category",
                message: `Are you sure you want to delete "${selectedCategory?.name}"? This action cannot be undone.`,
              });
              handleMenuClose();
            }}
            sx={{ color: "error.main" }}
            disabled={actionLoading}
          >
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>

        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedCategory ? "Edit Category" : "New Category"}
          </DialogTitle>
          <DialogContent>
            <FormControl
              fullWidth
              sx={{ mb: 3, mt: 1 }}
              disabled={actionLoading}
            >
              <InputLabel id="category-select-label">Category Name</InputLabel>
              <Select
                labelId="category-select-label"
                value={formData.name}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  const selectedCatDef = defaultCategories.find(
                    (cat) => cat.name === selectedName
                  );
                  setFormData((prev) => ({
                    ...prev,
                    name: selectedName,
                    color: selectedCatDef?.color || prev.color || "#8B7EC8",
                    description: selectedCatDef?.description || "",
                    subcategories:
                      prev.name === selectedName
                        ? prev.subcategories
                        : selectedCatDef?.subcategories?.map((sub) => ({
                            name: sub.name,
                            tasks:
                              sub.tasks?.map((t, idx) =>
                                ensureTaskObject(t, idx)
                              ) || [],
                          })) || [],
                  }));
                }}
                label="Category Name"
              >
                {defaultCategories.map((cat) => (
                  <MenuItem key={cat.id || cat.name} value={cat.name}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.name && (
              <FormControl fullWidth sx={{ mb: 3 }} disabled={actionLoading}>
                <InputLabel id="subcategory-multi-label">
                  Subcategories
                </InputLabel>
                <Select
                  labelId="subcategory-multi-label"
                  multiple
                  value={formData.subcategories?.map((s) => s.name) || []}
                  onChange={(e) => {
                    const selectedCategoryDefinition = defaultCategories.find(
                      (cat) => cat.name === formData.name
                    );
                    const selectedSubNames = e.target.value;

                    const newSubcategories =
                      selectedCategoryDefinition?.subcategories
                        ?.filter((subDef) =>
                          selectedSubNames.includes(subDef.name)
                        )
                        .map((subDef) => {
                          const existingSub = formData.subcategories.find(
                            (fs) => fs.name === subDef.name
                          );
                          if (existingSub) {
                            // Preserve existing tasks if subcategory was already selected
                            return {
                              ...existingSub,
                              tasks:
                                existingSub.tasks?.map((t, taskIdx) =>
                                  ensureTaskObject(t, taskIdx)
                                ) || [],
                            };
                          }
                          return {
                            name: subDef.name,
                            tasks:
                              subDef.tasks?.map((task, taskIdx) =>
                                ensureTaskObject(task, taskIdx)
                              ) || [],
                          };
                        }) || [];

                    // Handle subcategories not in default list (custom ones added previously)
                    const customExistingSubcategories =
                      formData.subcategories.filter(
                        (fs) =>
                          selectedSubNames.includes(fs.name) &&
                          !selectedCategoryDefinition?.subcategories.some(
                            (sds) => sds.name === fs.name
                          )
                      );

                    setFormData((prev) => ({
                      ...prev,
                      subcategories: [
                        ...newSubcategories,
                        ...customExistingSubcategories,
                      ],
                    }));
                  }}
                  renderValue={(selected) => selected.join(", ")}
                >
                  {defaultCategories
                    .find((cat) => cat.name === formData.name)
                    ?.subcategories?.map((sub) => (
                      <MenuItem key={sub.name} value={sub.name}>
                        <Checkbox
                          checked={formData.subcategories?.some(
                            (s) => s.name === sub.name
                          )}
                        />
                        <ListItemText primary={sub.name} />
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}
            {formData.subcategories?.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  maxHeight: "40vh",
                  overflowY: "auto",
                  pr: 1,
                  mb: 3,
                }}
              >
                {formData.subcategories.map((sub, subIndex) => (
                  <Paper
                    key={sub.name || subIndex}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2 }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={500}
                      sx={{ mb: 2 }}
                    >
                      Tasks for: {sub.name}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        mb: sub.tasks?.length > 0 ? 2 : 0,
                      }}
                    >
                      {sub.tasks?.map((task, taskIndex) => {
                        const statusColor =
                          taskStatusOptions.find((s) => s.value === task.status)
                            ?.color || theme.palette.grey[700];
                        return (
                          <Chip
                            key={task.id || taskIndex}
                            label={task.name}
                            onDelete={() =>
                              handleRemoveTask(subIndex, taskIndex)
                            }
                            disabled={actionLoading}
                            sx={{
                              borderColor: statusColor,
                              color: statusColor,
                              backgroundColor: `${statusColor}1A`,
                              fontWeight: 500,
                            }}
                          />
                        );
                      })}
                    </Box>

                    <Grid container spacing={2} alignItems="flex-end">
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="New Task Name"
                          fullWidth
                          variant="standard"
                          value={newTaskValues[subIndex]?.name || ""}
                          onChange={(e) =>
                            handleNewTaskValueChange(
                              subIndex,
                              "name",
                              e.target.value
                            )
                          }
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleAddTask(subIndex)
                          }
                          disabled={actionLoading}
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <FormControl fullWidth variant="standard">
                          <InputLabel id={`task-status-label-${subIndex}`}>
                            Status
                          </InputLabel>
                          <Select
                            labelId={`task-status-label-${subIndex}`}
                            value={
                              newTaskValues[subIndex]?.status ||
                              taskStatusOptions[0].value
                            }
                            onChange={(e) =>
                              handleNewTaskValueChange(
                                subIndex,
                                "status",
                                e.target.value
                              )
                            }
                            disabled={actionLoading}
                          >
                            {taskStatusOptions.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                <Box
                                  component="span"
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    backgroundColor: opt.color,
                                    mr: 1,
                                    display: "inline-block",
                                  }}
                                />
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <FormControl fullWidth variant="standard">
                          <InputLabel id={`task-priority-label-${subIndex}`}>
                            Priority
                          </InputLabel>
                          <Select
                            labelId={`task-priority-label-${subIndex}`}
                            value={
                              newTaskValues[subIndex]?.priority ||
                              taskPriorityOptions[0].value
                            }
                            onChange={(e) =>
                              handleNewTaskValueChange(
                                subIndex,
                                "priority",
                                e.target.value
                              )
                            }
                            disabled={actionLoading}
                          >
                            {taskPriorityOptions.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                <Box
                                  component="span"
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    backgroundColor: opt.color,
                                    mr: 1,
                                    display: "inline-block",
                                  }}
                                />
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleAddTask(subIndex)}
                      disabled={
                        actionLoading || !newTaskValues[subIndex]?.name?.trim()
                      }
                      sx={{ mt: 2 }}
                      startIcon={<Add />}
                    >
                      Add Task
                    </Button>
                  </Paper>
                ))}
              </Box>
            )}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
              Category Color
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
              {colorOptions.map((color) => (
                <Box
                  key={color}
                  onClick={() =>
                    !actionLoading &&
                    setFormData((prev) => ({ ...prev, color }))
                  }
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: color,
                    cursor: actionLoading ? "not-allowed" : "pointer",
                    border:
                      formData.color === color
                        ? `3px solid ${theme.palette.primary.main}`
                        : "3px solid transparent",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: actionLoading ? "none" : "scale(1.1)",
                    },
                  }}
                />
              ))}
            </Box>
            <TextField
              fullWidth
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              multiline
              rows={3}
              disabled={actionLoading}
              variant="outlined"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={handleCloseDialog}
              disabled={actionLoading}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveCategory}
              disabled={actionLoading || !formData.name.trim()}
              startIcon={
                actionLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {actionLoading
                ? "Saving..."
                : selectedCategory
                ? "Update Category"
                : "Create Category"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default CategoryManager;
