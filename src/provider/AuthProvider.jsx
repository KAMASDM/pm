import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import AuthContext from "../contexts/AuthContext";
import {
  auth,
  changeCurrentUserPassword,
  db,
  logOut,
  signInWithClientId,
  signInWithGoogle,
} from "../services/firebase";

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeProfile?.();
      unsubscribeProfile = null;
      setCurrentUser(user);
      setUserProfile(null);
      setError(null);

      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      unsubscribeProfile = onSnapshot(
        doc(db, "users", user.uid),
        (snapshot) => {
          setUserProfile(
            snapshot.exists()
              ? { id: snapshot.id, ...snapshot.data() }
              : { id: user.uid, role: "unauthorized", email: user.email }
          );
          setLoading(false);
        },
        (profileError) => {
          console.error("Unable to load account profile:", profileError);
          setError("We could not verify your workspace access.");
          setUserProfile({ id: user.uid, role: "unauthorized" });
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  const login = async () => {
    try {
      setError(null);
      return await signInWithGoogle();
    } catch (loginError) {
      setError(loginError.message);
      throw loginError;
    }
  };

  const loginClient = async (clientId, password) => {
    try {
      setError(null);
      return await signInWithClientId(clientId, password);
    } catch (loginError) {
      const message =
        loginError.code === "auth/invalid-credential"
          ? "The client ID or password is incorrect."
          : loginError.message;
      setError(message);
      throw loginError;
    }
  };

  const changePassword = async (password) => {
    await changeCurrentUserPassword(password);
  };

  const logout = async () => {
    try {
      setError(null);
      await logOut();
    } catch (logoutError) {
      setError(logoutError.message);
      throw logoutError;
    }
  };

  const userRole = userProfile?.role || null;
  const value = {
    currentUser,
    userProfile,
    login,
    loginClient,
    changePassword,
    logout,
    loading,
    error,
    isAuthenticated: Boolean(currentUser),
    userRole,
    isClient: userRole === "client",
    isTeamMember: userRole === "team" || userRole === "admin",
    isAdmin: userRole === "admin",
    mustChangePassword: Boolean(userProfile?.mustChangePassword),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
