import React, { useState } from "react";
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

  const [newTasks, setNewTasks] = useState({});

  const handleNewTaskInputChange = (index, value) => {
    setNewTasks((prev) => ({ ...prev, [index]: value }));
  };

  const handleAddTask = (subIndex) => {
    const newTask = newTasks[subIndex]?.trim();
    if (!newTask) return;

    setFormData((prev) => {
      const updatedSubcategories = [...prev.subcategories];
      const currentTasks = updatedSubcategories[subIndex].tasks || [];
      updatedSubcategories[subIndex] = {
        ...updatedSubcategories[subIndex],
        tasks: [...currentTasks, newTask],
      };
      return { ...prev, subcategories: updatedSubcategories };
    });

    setNewTasks((prev) => ({ ...prev, [subIndex]: "" }));
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

  const [formData, setFormData] = useState({
    name: "",
    color: "#8B7EC8",
    description: "",
  });

  const handleOpenDialog = (category = null) => {
    setSelectedCategory(category);
    setFormData({
      name: category?.name || "",
      color: category?.color || "#8B7EC8",
      description: category?.description || "",
      subcategories:
        category?.subcategories?.map((sub) => ({
          name: sub.name,
          tasks: sub.tasks || [],
        })) || [],
    });

    // Initialize new tasks state for each subcategory
    const initialNewTasks = {};
    if (category?.subcategories) {
      category.subcategories.forEach((_, idx) => {
        initialNewTasks[idx] = "";
      });
    }
    setNewTasks(initialNewTasks);

    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCategory(null);
    setFormData({
      name: "",
      color: "#8B7EC8",
      description: "",
    });
  };

  const handleSaveCategory = async () => {
    try {
      setActionLoading(true);
      if (selectedCategory) {
        await updateCategory(selectedCategory.id, formData);
      } else {
        await createCategory(formData);
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
                    categories.reduce(
                      (total, cat) => total + getTotalTasks(cat),
                      0
                    ) / Math.max(categories.length, 1)
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
                              backgroundColor: `${category.color}20`,
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
                                  {subcategory.tasks.map((task, taskIndex) => (
                                    <Chip
                                      key={taskIndex}
                                      label={task}
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        borderColor: `${category.color}`,
                                        color: category.color,
                                        backgroundColor: `${category.color}10`,
                                      }}
                                    />
                                  ))}
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
          maxWidth="sm"
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
                  const selectedCat = defaultCategories.find(
                    (cat) => cat.name === selectedName
                  );
                  setFormData((prev) => ({
                    ...prev,
                    name: selectedName,
                    color: selectedCat?.color || "",
                    description: selectedCat?.description || "",
                    subcategories: [],
                  }));
                  setNewTasks({});
                }}
                label="Category Name"
              >
                {defaultCategories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.name}>
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
                    const selectedCategory = defaultCategories.find(
                      (cat) => cat.name === formData.name
                    );
                    const selectedNames = e.target.value;
                    const selectedSubs =
                      selectedCategory?.subcategories?.filter((sub) =>
                        selectedNames.includes(sub.name)
                      ) || [];

                    // Preserve existing tasks when selecting/deselecting subcategories
                    setFormData((prev) => ({
                      ...prev,
                      subcategories: selectedSubs.map((s) => ({
                        ...s,
                        tasks:
                          // Keep existing tasks if the subcategory was already selected
                          prev.subcategories?.find((p) => p.name === s.name)
                            ?.tasks ||
                          // Or initialize with empty array if it's a new selection
                          [],
                      })),
                    }));

                    // Initialize new tasks state for each subcategory
                    const initialNewTasks = {};
                    selectedSubs.forEach((_, idx) => {
                      initialNewTasks[idx] = "";
                    });
                    setNewTasks(initialNewTasks);
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
                  gap: 2,
                  maxHeight: "30vh",
                  overflowY: "auto",
                  pr: 1,
                  mb: 3,
                }}
              >
                {formData.subcategories.map((sub, subIndex) => (
                  <Paper
                    key={subIndex}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2 }}
                  >
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      {sub.name}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        mb: sub.tasks?.length > 0 ? 2 : 0,
                      }}
                    >
                      {sub.tasks?.map((task, taskIndex) => (
                        <Chip
                          key={taskIndex}
                          label={task}
                          onDelete={() => handleRemoveTask(subIndex, taskIndex)}
                          disabled={actionLoading}
                        />
                      ))}
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Input
                        placeholder="Add a new task..."
                        fullWidth
                        value={newTasks[subIndex] || ""}
                        onChange={(e) =>
                          handleNewTaskInputChange(subIndex, e.target.value)
                        }
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleAddTask(subIndex)
                        }
                        disabled={actionLoading}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleAddTask(subIndex)}
                        disabled={actionLoading || !newTasks[subIndex]}
                      >
                        Add
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
            <Typography variant="subtitle2" gutterBottom>
              Color
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
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveCategory}
              disabled={actionLoading || !formData.name.trim()}
              startIcon={actionLoading ? <CircularProgress size={20} /> : null}
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
