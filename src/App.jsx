// src/App.jsx

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import theme from "./theme/theme";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./components/auth/Login";
import Layout from "./components/layout/Layout";
import Dashboard from "./components/dashboard/Dashboard";
import ProjectList from "./components/projects/ProjectList";
import ProjectDetails from "./components/projects/ProjectDetails";
import CreateProject from "./components/projects/CreateProject";
import CreateTask from "./components/tasks/CreateTask";
import TaskList from "./components/tasks/TaskList";
import CategoryManager from "./components/tasks/CategoryManager";
import EmployeeList from "./components/employees/EmployeeList";
import AuthProvider from "./provider/AuthProvider";
import { ProjectProvider } from "./contexts/ProjectContext";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          <ProjectProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="projects" element={<ProjectList />} />
                  <Route path="projects/create" element={<CreateProject />} />
                  <Route path="projects/:id" element={<ProjectDetails />} />
                  <Route path="projects/:id/edit" element={<CreateProject />} />
                  <Route path="tasks" element={<TaskList />} />
                  <Route path="tasks/create" element={<CreateTask />} />
                  <Route path="categories" element={<CategoryManager />} />
                  <Route path="employees" element={<EmployeeList />} />
                  <Route
                    path="team"
                    element={<Navigate to="/employees" replace />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Router>
          </ProjectProvider>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;