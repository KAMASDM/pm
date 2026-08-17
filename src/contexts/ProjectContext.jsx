// src/contexts/ProjectContext.jsx

import React, { createContext, useState, useEffect, useCallback } from "react";
import {
  firebaseService,
  provisionClientAccount,
  resetClientAccess,
  removeClientProjectAccess,
} from "../services/firebase";
import useAuth from "../hooks/useAuth";
import { defaultCategories } from "../utils/projectTemplates";

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const { currentUser, isClient, isTeamMember } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setProjects([]);
      setTasks([]);
      setMilestones([]);
      setEmployees([]);
      setCategories([]);
      return;
    }

    const loadWorkspace = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isClient) {
          const clientProjects = await firebaseService.getClientProjects(
            currentUser.uid
          );
          const projectIds = clientProjects.map((project) => project.id);
          const [clientTasks, clientMilestones] = await Promise.all([
            firebaseService.getTasksForProjects(projectIds),
            firebaseService.getMilestonesForProjects(projectIds),
          ]);
          setProjects(clientProjects);
          setTasks(clientTasks);
          setMilestones(clientMilestones);
          setEmployees([]);
          setCategories([]);
        } else if (isTeamMember) {
          await firebaseService.ensureDefaultCategories(defaultCategories);
          const [projectsData, tasksData, employeesData, categoriesData] =
            await Promise.all([
              firebaseService.getProjects(),
              firebaseService.getTasks(),
              firebaseService.getEmployees(),
              firebaseService.getCategories(),
            ]);
          setProjects(projectsData);
          setTasks(tasksData);
          setEmployees(employeesData);
          setCategories(categoriesData);
        }
      } catch (workspaceError) {
        console.error("Unable to load workspace:", workspaceError);
        setError("We could not load your workspace. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  }, [currentUser, isClient, isTeamMember]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = isClient
        ? await firebaseService.getClientProjects(currentUser.uid)
        : await firebaseService.getProjects();
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
      const tasksData = isClient
        ? await firebaseService.getTasksForProjects(
            projects.map((project) => project.id)
          )
        : await firebaseService.getTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  };

  const loadMilestones = useCallback(async (projectId) => {
    try {
      setLoading(true);
      const milestonesData = await firebaseService.getMilestonesByProject(
        projectId
      );
      setMilestones(milestonesData);
    } catch (error) {
      console.error("Error loading milestones:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmployees = async () => {
    if (!isTeamMember) return;
    try {
      const employeesData = await firebaseService.getEmployees();
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  const loadCategories = async () => {
    if (!isTeamMember) return;
    try {
      await firebaseService.ensureDefaultCategories(defaultCategories);
      const categoriesData = await firebaseService.getCategories();
      setCategories(categoriesData);
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

  const createMilestone = async (milestoneData) => {
    try {
      const milestoneId = await firebaseService.createMilestone({
        ...milestoneData,
        createdBy: currentUser.uid,
      });
      await loadMilestones(milestoneData.projectId);
      return milestoneId;
    } catch (error) {
      setError("Failed to create milestone");
      throw error;
    }
  };

  const updateMilestone = async (milestoneId, updateData, projectId) => {
    try {
      await firebaseService.updateMilestone(milestoneId, updateData);
      await loadMilestones(projectId);
    } catch (error) {
      setError("Failed to update milestone");
      throw error;
    }
  };

  const deleteMilestone = async (milestoneId, projectId) => {
    try {
      await firebaseService.deleteMilestone(milestoneId);
      await loadMilestones(projectId);
    } catch (error) {
      setError("Failed to delete milestone");
      throw error;
    }
  };

  const createTask = async (taskData) => {
    try {
      const taskId = await firebaseService.createTask({
        ...taskData,
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName,
        createdByEmail: currentUser.email,
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

  const addTaskComment = async (taskId, commentData) => {
    try {
      await firebaseService.addTaskComment(taskId, commentData);
      await loadTasks();
    } catch (error) {
      setError("Failed to add comment");
      throw error;
    }
  };

  const provisionClient = async (clientData) => {
    const result = await provisionClientAccount(clientData);
    await loadProjects();
    return result;
  };

  const resetClientCredentials = async (clientData) => {
    return resetClientAccess(clientData);
  };

  const removeClientAccess = async (clientData) => {
    const result = await removeClientProjectAccess(clientData);
    await loadProjects();
    return result;
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
      project.assignedTo?.some((member) =>
        typeof member === "string" ? member === employeeId : member.id === employeeId
      )
    );
  };

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  const getTasksByMilestone = useCallback(
    (milestoneId) => {
      return tasks.filter((task) => task.milestoneId === milestoneId);
    },
    [tasks]
  );

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
    milestones,
    loadMilestones,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    getTasksByMilestone,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    getProjectProgress,
    getProjectsByEmployee,
    createTask,
    updateTask,
    deleteTask,
    addTaskComment,
    provisionClient,
    resetClientCredentials,
    removeClientAccess,
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
