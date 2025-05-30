import React, { createContext, useState, useEffect } from "react";
import { firebaseService } from "../services/firebase";
import useAuth from "../hooks/useAuth";

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadProjects();
      loadTasks();
      loadEmployees();
      loadCategories();
    }
  }, [currentUser]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await firebaseService.getProjects();
      setProjects(projectsData);
    } catch (error) {
      setError("Failed to load projects");
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const tasksData = await firebaseService.getTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  };

  const loadEmployees = async () => {
    try {
      const employeesData = await firebaseService.getEmployees();
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await firebaseService.getCategories();
      if (categoriesData.length > 0) {
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const createProject = async (projectData) => {
    try {
      setLoading(true);
      const projectId = await firebaseService.createProject({
        ...projectData,
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName,
        createdByEmail: currentUser.email,
        status: projectData.status || "planning",
        priority: projectData.priority || "medium",
      });
      await loadProjects();
      return projectId;
    } catch (error) {
      setError("Failed to create project");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (projectId, updateData) => {
    try {
      await firebaseService.updateProject(projectId, updateData);
      await loadProjects();
    } catch (error) {
      setError("Failed to update project");
      throw error;
    }
  };

  const deleteProject = async (projectId) => {
    try {
      await firebaseService.deleteProject(projectId);
      await loadProjects();
    } catch (error) {
      setError("Failed to delete project");
      throw error;
    }
  };

  const createTask = async (taskData) => {
    try {
      const taskId = await firebaseService.createTask({
        ...taskData,
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName,
        status: taskData.status || "pending",
        priority: taskData.priority || "medium",
      });
      await loadTasks();
      return taskId;
    } catch (error) {
      setError("Failed to create task");
      throw error;
    }
  };

  const updateTask = async (taskId, updateData) => {
    try {
      await firebaseService.updateTask(taskId, updateData);
      await loadTasks();
    } catch (error) {
      setError("Failed to update task");
      throw error;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await firebaseService.deleteTask(taskId);
      await loadTasks();
    } catch (error) {
      setError("Failed to delete task");
      throw error;
    }
  };

  const createEmployee = async (employeeData) => {
    try {
      const employeeId = await firebaseService.createEmployee({
        ...employeeData,
        createdBy: currentUser.uid,
        createdAt: new Date(),
      });
      await loadEmployees();
      return employeeId;
    } catch (error) {
      setError("Failed to create employee");
      throw error;
    }
  };

  const updateEmployee = async (employeeId, updateData) => {
    try {
      await firebaseService.updateEmployee(employeeId, updateData);
      await loadEmployees();
    } catch (error) {
      setError("Failed to update employee");
      throw error;
    }
  };

  const deleteEmployee = async (employeeId) => {
    try {
      await firebaseService.deleteEmployee(employeeId);
      await loadEmployees();
    } catch (error) {
      setError("Failed to delete employee");
      throw error;
    }
  };

  const createCategory = async (categoryData) => {
    try {
      const categoryId = await firebaseService.createCategory({
        ...categoryData,
        createdBy: currentUser.uid,
      });
      await loadCategories();
      return categoryId;
    } catch (error) {
      setError("Failed to create category");
      throw error;
    }
  };

  const updateCategory = async (categoryId, updateData) => {
    try {
      await firebaseService.updateCategory(categoryId, updateData);
      await loadCategories();
    } catch (error) {
      setError("Failed to update category");
      throw error;
    }
  };

  const deleteCategory = async (categoryId) => {
    try {
      await firebaseService.deleteCategory(categoryId);
      await loadCategories();
    } catch (error) {
      setError("Failed to delete category");
      throw error;
    }
  };

  const getProjectById = (projectId) => {
    return projects.find((project) => project.id === projectId);
  };

  const getTasksByProject = (projectId) => {
    return tasks.filter((task) => task.projectId === projectId);
  };

  const getTasksByEmployee = (employeeId) => {
    return tasks.filter((task) => task.assignedTo === employeeId);
  };

  const getProjectsByEmployee = (employeeId) => {
    return projects.filter((project) =>
      project.assignedTo?.some((member) => member.id === employeeId)
    );
  };

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  const getProjectProgress = (projectId) => {
    const projectTasks = getTasksByProject(projectId);
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter(
      (task) => task.status === "completed"
    );
    return Math.round((completedTasks.length / projectTasks.length) * 100);
  };

  const value = {
    projects,
    tasks,
    categories,
    employees,
    loading,
    error,

    createProject,
    updateProject,
    deleteProject,

    getProjectById,
    getProjectProgress,
    getProjectsByEmployee,

    createTask,
    updateTask,
    deleteTask,

    getTasksByProject,
    getTasksByEmployee,
    getTasksByStatus,

    createEmployee,
    updateEmployee,
    deleteEmployee,

    createCategory,
    updateCategory,
    deleteCategory,

    loadProjects,

    loadTasks,

    loadEmployees,

    loadCategories,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};

export default ProjectContext;