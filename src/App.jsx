// src/App.jsx

import React, { lazy, Suspense } from "react";
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
import RoleRoute from "./components/auth/RoleRoute";
import ChangePassword from "./components/auth/ChangePassword";
import Layout from "./components/layout/Layout";
import AuthProvider from "./provider/AuthProvider";
import NotificationProvider from "./provider/NotificationProvider";
import { ProjectProvider } from "./contexts/ProjectContext";
import Loading from "./components/common/Loading";
import AppErrorBoundary from "./components/common/AppErrorBoundary";

const Login = lazy(() => import("./components/auth/Login"));
const Dashboard = lazy(() => import("./components/dashboard/Dashboard"));
const ProjectList = lazy(() => import("./components/projects/ProjectList"));
const ProjectDetails = lazy(() => import("./components/projects/ProjectDetails"));
const CreateProject = lazy(() => import("./components/projects/CreateProject"));
const CreateTask = lazy(() => import("./components/tasks/CreateTask"));
const TaskList = lazy(() => import("./components/tasks/TaskList"));
const CategoryManager = lazy(() => import("./components/tasks/CategoryManager"));
const EmployeeList = lazy(() => import("./components/employees/EmployeeList"));
const ClientDashboard = lazy(() => import("./components/client/ClientDashboard"));
const ClientProjectDetails = lazy(() => import("./components/client/ClientProjectDetails"));

function App() {
  const teamRoles = ["admin", "team"];
  const clientRoles = ["client"];

  return (
    <AppErrorBoundary>
      <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          <NotificationProvider>
            <ProjectProvider>
              <Router>
                <Suspense fallback={<Loading message="Preparing your workspace..." fullScreen />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/change-password"
                  element={
                    <ProtectedRoute>
                      <ChangePassword />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<RoleRoute allowedRoles={teamRoles}><Dashboard /></RoleRoute>} />
                  <Route path="projects" element={<RoleRoute allowedRoles={teamRoles}><ProjectList /></RoleRoute>} />
                  <Route path="projects/create" element={<RoleRoute allowedRoles={teamRoles}><CreateProject /></RoleRoute>} />
                  <Route path="projects/:id" element={<RoleRoute allowedRoles={teamRoles}><ProjectDetails /></RoleRoute>} />
                  <Route path="projects/:id/edit" element={<RoleRoute allowedRoles={teamRoles}><CreateProject /></RoleRoute>} />
                  <Route path="tasks" element={<RoleRoute allowedRoles={teamRoles}><TaskList /></RoleRoute>} />
                  <Route path="tasks/create" element={<RoleRoute allowedRoles={teamRoles}><CreateTask /></RoleRoute>} />
                  <Route path="categories" element={<RoleRoute allowedRoles={teamRoles}><CategoryManager /></RoleRoute>} />
                  <Route path="employees" element={<RoleRoute allowedRoles={teamRoles}><EmployeeList /></RoleRoute>} />
                  <Route
                    path="team"
                    element={<Navigate to="/employees" replace />}
                  />
                  <Route path="client/dashboard" element={<RoleRoute allowedRoles={clientRoles}><ClientDashboard /></RoleRoute>} />
                  <Route path="client/projects/:id" element={<RoleRoute allowedRoles={clientRoles}><ClientProjectDetails /></RoleRoute>} />
                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
                </Suspense>
              </Router>
            </ProjectProvider>
          </NotificationProvider>
        </AuthProvider>
      </LocalizationProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

export default App;
