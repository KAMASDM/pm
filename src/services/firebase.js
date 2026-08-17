// src/services/firebase.js

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

export const db = getFirestore(app);
export const functions = getFunctions(app, "asia-south1");

const clientAuthDomain =
  import.meta.env.VITE_CLIENT_AUTH_DOMAIN || "clients.pm.local";

const normalizeClientId = (clientId) =>
  clientId.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");

const normalizeDateFields = (data) => {
  if (!("dueDate" in data) || !data.dueDate || data.dueDate?.toDate) return data;
  const value = data.dueDate instanceof Date ? data.dueDate : new Date(data.dueDate);
  return Number.isNaN(value.getTime())
    ? { ...data, dueDate: null }
    : { ...data, dueDate: Timestamp.fromDate(value) };
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const signInWithClientId = async (clientId, password) => {
  const normalizedId = normalizeClientId(clientId);
  if (!normalizedId) throw new Error("Enter a valid client ID");
  const result = await signInWithEmailAndPassword(
    auth,
    `${normalizedId}@${clientAuthDomain}`,
    password
  );
  return result.user;
};

export const changeCurrentUserPassword = async (password) => {
  if (!auth.currentUser) throw new Error("No authenticated user");
  await updatePassword(auth.currentUser, password);
  const completeChange = httpsCallable(functions, "completePasswordChange");
  await completeChange();
};

export const provisionClientAccount = async (clientData) => {
  const provisionClient = httpsCallable(functions, "provisionClientAccount");
  const result = await provisionClient(clientData);
  return result.data;
};

export const resetClientAccess = async (clientData) => {
  const resetAccess = httpsCallable(functions, "resetClientAccess");
  const result = await resetAccess(clientData);
  return result.data;
};

export const removeClientProjectAccess = async (clientData) => {
  const removeAccess = httpsCallable(functions, "removeClientFromProject");
  const result = await removeAccess(clientData);
  return result.data;
};

export const firebaseService = {
  // Projects
  async createProject(projectData) {
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        ...normalizeDateFields(projectData),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  },

  async getProjects(userId = null) {
    try {
      let q;
      if (userId) {
        q = query(
          collection(db, "projects"),
          where("assignedTo", "array-contains", userId),
          orderBy("createdAt", "desc")
        );
      } else {
        q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt,
      }));
    } catch (error) {
      console.error("Error getting projects:", error);
      throw error;
    }
  },

  async getClientProjects(userId) {
    try {
      const q = query(
        collection(db, "projects"),
        where("clientUserIds", "array-contains", userId),
        orderBy("updatedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((projectDoc) => ({
        id: projectDoc.id,
        ...projectDoc.data(),
      }));
    } catch (error) {
      console.error("Error getting client projects:", error);
      throw error;
    }
  },

  async getProject(projectId) {
    try {
      const docRef = doc(db, "projects", projectId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        };
      } else {
        throw new Error("Project not found");
      }
    } catch (error) {
      console.error("Error getting project:", error);
      throw error;
    }
  },

  async updateProject(projectId, updateData) {
    try {
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        ...normalizeDateFields(updateData),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  },

  async deleteProject(projectId) {
    try {
      const deleteProjectCascade = httpsCallable(functions, "deleteProjectCascade");
      await deleteProjectCascade({ projectId });
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  },

  // Milestones
  async createMilestone(milestoneData) {
    try {
      const docRef = await addDoc(collection(db, "milestones"), {
        ...normalizeDateFields(milestoneData),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating milestone:", error);
      throw error;
    }
  },

  async getMilestonesByProject(projectId) {
    try {
      const q = query(
        collection(db, "milestones"),
        where("projectId", "==", projectId),
        orderBy("createdAt", "asc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting milestones:", error);
      throw error;
    }
  },

  async getMilestonesForProjects(projectIds) {
    if (!projectIds.length) return [];
    const results = await Promise.all(
      projectIds.map((projectId) => this.getMilestonesByProject(projectId))
    );
    return results.flat();
  },

  async updateMilestone(milestoneId, updateData) {
    try {
      const milestoneRef = doc(db, "milestones", milestoneId);
      await updateDoc(milestoneRef, {
        ...normalizeDateFields(updateData),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating milestone:", error);
      throw error;
    }
  },

  async deleteMilestone(milestoneId) {
    try {
      const tasksQuery = query(
        collection(db, "tasks"),
        where("milestoneId", "==", milestoneId)
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      const batch = writeBatch(db);
      tasksSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      await deleteDoc(doc(db, "milestones", milestoneId));
    } catch (error) {
      console.error("Error deleting milestone:", error);
      throw error;
    }
  },

  // Tasks
  async createTask(taskData) {
    try {
      // Remove temporary id if it exists (from category templates)
      const cleanTaskData = { ...taskData };
      delete cleanTaskData.id;

      const docRef = await addDoc(collection(db, "tasks"), {
        ...normalizeDateFields(cleanTaskData),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  },

  async getTasks(projectId = null) {
    try {
      let q;
      if (projectId) {
        q = query(
          collection(db, "tasks"),
          where("projectId", "==", projectId),
          orderBy("createdAt", "desc")
        );
      } else {
        q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        // Remove any temporary id from data to avoid conflicts
        const restData = { ...data };
        delete restData.id;
        return {
          id: doc.id, // Use Firestore document ID
          ...restData,
        };
      });
    } catch (error) {
      console.error("Error getting tasks:", error);
      throw error;
    }
  },

  async getTasksForProjects(projectIds) {
    if (!projectIds.length) return [];
    const results = await Promise.all(
      projectIds.map((projectId) => this.getTasks(projectId))
    );
    return results.flat().sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  },

  async getTask(taskId) {
    try {
      const docRef = doc(db, "tasks", taskId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        };
      } else {
        throw new Error("Task not found");
      }
    } catch (error) {
      console.error("Error getting task:", error);
      throw error;
    }
  },

  async updateTask(taskId, updateData) {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        ...normalizeDateFields(updateData),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  },

  async deleteTask(taskId) {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  },

  // Task Comments
  async addTaskComment(taskId, commentData) {
    try {
      const addComment = httpsCallable(functions, "addTaskComment");
      await addComment({
        taskId,
        text: commentData.text,
        parentId: commentData.parentId || null,
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  },

  // Categories
  async createCategory(categoryData) {
    try {
      const docRef = await addDoc(collection(db, "categories"), {
        ...categoryData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },

  async getCategories() {
    try {
      const q = query(collection(db, "categories"), orderBy("name"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting categories:", error);
      throw error;
    }
  },

  async updateCategory(categoryId, updateData) {
    try {
      const categoryRef = doc(db, "categories", categoryId);
      await updateDoc(categoryRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  },

  async deleteCategory(categoryId) {
    try {
      await deleteDoc(doc(db, "categories", categoryId));
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  },

  // Employees
  async createEmployee(employeeData) {
    try {
      const docRef = await addDoc(collection(db, "employees"), {
        ...employeeData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating employee:", error);
      throw error;
    }
  },

  async getEmployees() {
    try {
      const q = query(collection(db, "employees"), orderBy("name"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting employees:", error);
      throw error;
    }
  },

  async getEmployee(employeeId) {
    try {
      const docRef = doc(db, "employees", employeeId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        };
      } else {
        throw new Error("Employee not found");
      }
    } catch (error) {
      console.error("Error getting employee:", error);
      throw error;
    }
  },

  async updateEmployee(employeeId, updateData) {
    try {
      const employeeRef = doc(db, "employees", employeeId);
      await updateDoc(employeeRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating employee:", error);
      throw error;
    }
  },

  async deleteEmployee(employeeId) {
    try {
      await deleteDoc(doc(db, "employees", employeeId));
    } catch (error) {
      console.error("Error deleting employee:", error);
      throw error;
    }
  },

  // Real-time listeners
  subscribeToProjects(callback, userId = null) {
    let q;
    if (userId) {
      q = query(
        collection(db, "projects"),
        where("assignedTo", "array-contains", userId),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    }

    return onSnapshot(
      q,
      (querySnapshot) => {
        const projects = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(projects);
      },
      (error) => {
        console.error("Error in projects subscription:", error);
      }
    );
  },

  subscribeToTasks(callback, projectId = null) {
    let q;
    if (projectId) {
      q = query(
        collection(db, "tasks"),
        where("projectId", "==", projectId),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    }

    return onSnapshot(
      q,
      (querySnapshot) => {
        const tasks = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(tasks);
      },
      (error) => {
        console.error("Error in tasks subscription:", error);
      }
    );
  },

  subscribeToProject(projectId, callback) {
    const projectRef = doc(db, "projects", projectId);

    return onSnapshot(
      projectRef,
      (doc) => {
        if (doc.exists()) {
          callback({
            id: doc.id,
            ...doc.data(),
          });
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error("Error in project subscription:", error);
      }
    );
  },

  subscribeToTask(taskId, callback) {
    const taskRef = doc(db, "tasks", taskId);

    return onSnapshot(
      taskRef,
      (doc) => {
        if (doc.exists()) {
          callback({
            id: doc.id,
            ...doc.data(),
          });
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error("Error in task subscription:", error);
      }
    );
  },

  // Analytics and reporting
  async getProjectStats(projectId) {
    try {
      const tasks = await this.getTasks(projectId);
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(
        (task) => task.status === "completed"
      ).length;
      const inProgressTasks = tasks.filter(
        (task) => task.status === "in-progress"
      ).length;
      const pendingTasks = tasks.filter(
        (task) => task.status === "pending"
      ).length;
      const blockedTasks = tasks.filter(
        (task) => task.status === "blocked"
      ).length;

      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        blockedTasks,
        progress,
      };
    } catch (error) {
      console.error("Error getting project stats:", error);
      throw error;
    }
  },

  async getUserStats(userId) {
    try {
      const userProjects = await this.getProjects(userId);
      const allTasks = await this.getTasks();
      const userTasks = allTasks.filter((task) => task.assignedTo === userId);

      return {
        totalProjects: userProjects.length,
        totalTasks: userTasks.length,
        completedTasks: userTasks.filter((task) => task.status === "completed")
          .length,
        inProgressTasks: userTasks.filter(
          (task) => task.status === "in-progress"
        ).length,
        overdueTasks: userTasks.filter((task) => {
          if (!task.dueDate || task.status === "completed") return false;
          const dueDate = task.dueDate.toDate
            ? task.dueDate.toDate()
            : new Date(task.dueDate);
          return dueDate < new Date();
        }).length,
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      throw error;
    }
  },
};

export default app;
