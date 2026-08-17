import React, { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  Tooltip,
  Typography,
} from "@mui/material";
import { Notifications, NotificationsActive } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useNotifications from "../../hooks/useNotifications";
import useAuth from "../../hooks/useAuth";

const formatTime = (timestamp) => {
  const date = timestamp?.toDate?.();
  if (!date) return "Just now";
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return date.toLocaleDateString();
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { notifications, unreadCount, permission, enabling, enablePush, markRead } =
    useNotifications();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = async (event) => {
    if (permission === "default") await enablePush();
    setAnchorEl(event.currentTarget);
  };

  const handleNotification = async (notification) => {
    await markRead(notification.id);
    setAnchorEl(null);
    if (notification.route) navigate(notification.route);
  };

  return (
    <>
      <Tooltip title={permission === "granted" ? "Notifications" : "Enable notifications"}>
        <IconButton size="large" sx={{ color: "text.primary" }} onClick={handleOpen}>
          {enabling ? (
            <CircularProgress size={22} />
          ) : (
            <Badge badgeContent={unreadCount} color="error" max={99}>
              {permission === "granted" ? <NotificationsActive /> : <Notifications />}
            </Badge>
          )}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { width: { xs: 340, sm: 410 }, maxWidth: "calc(100vw - 24px)", mt: 1.5 } }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ px: 2.5, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6">Updates</Typography>
            <Typography variant="caption">Your project pulse, in one place</Typography>
          </Box>
          {unreadCount > 0 && <Chip size="small" color="primary" label={`${unreadCount} new`} />}
        </Box>
        <Divider />
        {permission !== "granted" && permission !== "unsupported" && (
          <Box sx={{ p: 2 }}>
            <Button fullWidth variant="contained" onClick={enablePush} disabled={enabling}>
              Enable instant updates
            </Button>
          </Box>
        )}
        <List disablePadding sx={{ maxHeight: 430, overflowY: "auto" }}>
          {notifications.map((notification) => {
            const isRead = notification.readBy?.includes(currentUser.uid);
            return (
            <ListItemButton
              key={notification.id}
              onClick={() => handleNotification(notification)}
              sx={{
                alignItems: "flex-start",
                px: 2.5,
                py: 1.75,
                bgcolor: isRead ? "transparent" : "rgba(107,91,149,.06)",
              }}
            >
              <Box
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  bgcolor: isRead ? "divider" : "primary.main",
                  mt: 0.8,
                  mr: 1.5,
                  flexShrink: 0,
                }}
              />
              <ListItemText
                primary={notification.title}
                secondary={
                  <><span>{notification.body}</span><br /><small>{formatTime(notification.createdAt)}</small></>
                }
                primaryTypographyProps={{ fontWeight: isRead ? 500 : 700 }}
              />
            </ListItemButton>
            );
          })}
          {!notifications.length && (
            <Box sx={{ py: 6, px: 3, textAlign: "center" }}>
              <Notifications sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
              <Typography fontWeight={600}>All quiet for now</Typography>
              <Typography variant="body2">New project activity will appear here.</Typography>
            </Box>
          )}
        </List>
      </Menu>
    </>
  );
};

export default NotificationBell;
