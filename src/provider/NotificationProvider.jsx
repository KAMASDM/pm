import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import NotificationContext from "../contexts/NotificationContext";
import useAuth from "../hooks/useAuth";
import {
  listenForForegroundMessages,
  markNotificationRead,
  registerPushDevice,
  subscribeToNotifications,
} from "../services/notifications";

const getBrowserPermission = () =>
  typeof Notification === "undefined" ? "unsupported" : Notification.permission;

const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [permission, setPermission] = useState(getBrowserPermission);
  const [enabling, setEnabling] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return undefined;
    }
    return subscribeToNotifications(
      currentUser.uid,
      setNotifications,
      (error) => console.error("Notification subscription failed:", error)
    );
  }, [currentUser]);

  useEffect(() => {
    let unsubscribe = () => {};
    listenForForegroundMessages((message) => {
      setToast({
        title: message.notification?.title || "Project update",
        body: message.notification?.body || "There is new activity in your workspace.",
      });
    }).then((listener) => {
      unsubscribe = listener;
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser && getBrowserPermission() === "granted") {
      registerPushDevice(currentUser.uid).catch((error) =>
        console.error("Push token refresh failed:", error)
      );
    }
  }, [currentUser]);

  const enablePush = useCallback(async () => {
    if (!currentUser) return false;
    setEnabling(true);
    try {
      const result = await registerPushDevice(currentUser.uid);
      setPermission(result.permission);
      if (result.permission === "granted") {
        setToast({ title: "Notifications enabled", body: "You will never miss an important project update." });
        return true;
      }
      return false;
    } catch (error) {
      setToast({ title: "Could not enable notifications", body: error.message });
      return false;
    } finally {
      setEnabling(false);
    }
  }, [currentUser]);

  const markRead = useCallback(
    async (notificationId) => {
      if (!currentUser) return;
      await markNotificationRead(notificationId, currentUser.uid);
    },
    [currentUser]
  );

  const value = useMemo(() => ({
    notifications,
    unreadCount: notifications.filter(
      (notification) => !notification.readBy?.includes(currentUser?.uid)
    ).length,
    permission,
    enabling,
    enablePush,
    markRead,
  }), [notifications, currentUser, permission, enabling, enablePush, markRead]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={6000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="info" variant="filled" onClose={() => setToast(null)} sx={{ minWidth: 320 }}>
          <strong>{toast?.title}</strong><br />{toast?.body}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
