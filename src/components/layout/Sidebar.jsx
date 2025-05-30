import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
  Collapse,
} from "@mui/material";
import {
  Dashboard,
  FolderOpen,
  Assignment,
  Category,
  People,
  Add,
  Analytics,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";

const menuItems = [
  {
    text: "Dashboard",
    icon: <Dashboard />,
    path: "/dashboard",
    color: "#8B7EC8",
  },
  {
    text: "Projects",
    icon: <FolderOpen />,
    path: "/projects",
    color: "#8B7EC8",
    subItems: [
      { text: "All Projects", path: "/projects" },
      { text: "Create Project", path: "/projects/create" },
    ],
  },
  {
    text: "Tasks",
    icon: <Assignment />,
    path: "/tasks",
    color: "#8B7EC8",
  },
  {
    text: "Categories",
    icon: <Category />,
    path: "/categories",
    color: "#8B7EC8",
  },
  {
    text: "Team",
    icon: <People />,
    path: "/employees",
    color: "#8B7EC8",
  },
];

const quickActions = [
  {
    text: "New Project",
    icon: <Add />,
    path: "/projects/create",
    color: "#8B7EC8",
  },
];

const Sidebar = ({ onItemClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openSubMenu, setOpenSubMenu] = useState({
    Projects: location.pathname.startsWith("/projects"),
  });

  const handleItemClick = (path) => {
    navigate(path);
    if (onItemClick) {
      onItemClick();
    }
  };

  const handleSubMenuToggle = (text) => {
    setOpenSubMenu((prev) => ({ ...prev, [text]: !prev[text] }));
  };

  const isActive = (path) => {
    return (
      location.pathname === path ||
      (path === "/projects" && location.pathname.startsWith("/projects"))
    );
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 2, pt: 1 }}>
        <Typography
          variant="overline"
          sx={{
            color: "text.secondary",
            fontWeight: 600,
            letterSpacing: 1,
            fontSize: "0.75rem",
          }}
        >
          Main Menu
        </Typography>
      </Box>
      <List sx={{ px: 2 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() =>
                  item.subItems
                    ? handleSubMenuToggle(item.text)
                    : handleItemClick(item.path)
                }
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  px: 2,
                  backgroundColor: isActive(item.path)
                    ? "rgba(139, 126, 200, 0.1)"
                    : "transparent",
                  border: isActive(item.path)
                    ? "1px solid rgba(139, 126, 200, 0.2)"
                    : "1px solid transparent",
                  "&:hover": {
                    backgroundColor: "rgba(139, 126, 200, 0.08)",
                    transform: "translateX(4px)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? item.color : "text.secondary",
                    minWidth: 40,
                    transition: "color 0.2s ease-in-out",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    "& .MuiListItemText-primary": {
                      fontWeight: isActive(item.path) ? 600 : 500,
                      color: isActive(item.path)
                        ? "text.primary"
                        : "text.secondary",
                      fontSize: "0.95rem",
                    },
                  }}
                />
                {item.subItems ? (
                  openSubMenu[item.text] ? (
                    <ExpandLess
                      sx={{ color: "text.secondary", fontSize: 20 }}
                    />
                  ) : (
                    <ExpandMore
                      sx={{ color: "text.secondary", fontSize: 20 }}
                    />
                  )
                ) : isActive(item.path) ? (
                  <Box
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      backgroundColor: item.color,
                    }}
                  />
                ) : null}
              </ListItemButton>
            </ListItem>
            {item.subItems && (
              <Collapse
                in={openSubMenu[item.text]}
                timeout="auto"
                unmountOnExit
              >
                <List component="div" disablePadding>
                  {item.subItems.map((subItem) => (
                    <ListItem
                      key={subItem.text}
                      disablePadding
                      sx={{ mb: 0.5 }}
                    >
                      <ListItemButton
                        onClick={() => handleItemClick(subItem.path)}
                        sx={{
                          borderRadius: 2,
                          py: 1.5,
                          px: 2,
                          pl: 6,
                          backgroundColor:
                            location.pathname === subItem.path
                              ? "rgba(139, 126, 200, 0.1)"
                              : "transparent",
                          border:
                            location.pathname === subItem.path
                              ? "1px solid rgba(139, 126, 200, 0.2)"
                              : "1px solid transparent",
                          "&:hover": {
                            backgroundColor: "rgba(139, 126, 200, 0.08)",
                            transform: "translateX(4px)",
                          },
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        <ListItemText
                          primary={subItem.text}
                          sx={{
                            "& .MuiListItemText-primary": {
                              fontWeight:
                                location.pathname === subItem.path ? 600 : 500,
                              color:
                                location.pathname === subItem.path
                                  ? "text.primary"
                                  : "text.secondary",
                              fontSize: "0.9rem",
                            },
                          }}
                        />
                        {location.pathname === subItem.path && (
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              borderRadius: "50%",
                              backgroundColor: item.color,
                            }}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
      <Divider sx={{ mx: 2, my: 2 }} />
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography
          variant="overline"
          sx={{
            color: "text.secondary",
            fontWeight: 600,
            letterSpacing: 1,
            fontSize: "0.75rem",
          }}
        >
          Quick Actions
        </Typography>
      </Box>
      <List sx={{ px: 2 }}>
        {quickActions.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleItemClick(item.path)}
              sx={{
                borderRadius: 2,
                py: 1.5,
                px: 2,
                background: `linear-gradient(135deg, ${item.color}15, ${item.color}08)`,
                border: `1px solid ${item.color}30`,
                "&:hover": {
                  background: `linear-gradient(135deg, ${item.color}25, ${item.color}15)`,
                  transform: "translateX(4px)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              <ListItemIcon
                sx={{
                  color: item.color,
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  "& .MuiListItemText-primary": {
                    fontWeight: 600,
                    color: item.color,
                    fontSize: "0.95rem",
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            background: "linear-gradient(135deg, #8B7EC815, #B5A9D615)",
            border: "1px solid rgba(139, 126, 200, 0.1)",
            textAlign: "center",
          }}
        >
          <Analytics sx={{ color: "#8B7EC8", mb: 1, fontSize: 32 }} />
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Project Insights
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Get detailed analytics on your project performance
          </Typography>
          <Chip
            label="Coming Soon"
            size="small"
            sx={{
              backgroundColor: "rgba(139, 126, 200, 0.1)",
              color: "#8B7EC8",
              fontWeight: 500,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
