import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#6B5B95",
      light: "#8E80B1",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#D1C4E9",
      contrastText: "#4A4A4A",
    },
    background: {
      default: "#F8F8F8",
      paper: "#FFFFFF",
    },
    success: {
      main: "#4CAF50",
      light: "#81C784",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#FF9800",
      light: "#FFB74D",
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#F44336",
      light: "#E57373",
      contrastText: "#FFFFFF",
    },
    info: {
      main: "#2196F3",
      light: "#64B5F6",
      contrastText: "#FFFFFF",
    },
    text: {
      primary: "#2D2D2D",
      secondary: "#6B6B6B",
      disabled: "#AAAAAA",
    },
    divider: "#E8E8E8",
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: "2.5rem", fontWeight: 700, color: "#2D2D2D" },
    h2: { fontSize: "2rem", fontWeight: 700, color: "#2D2D2D" },
    h3: { fontSize: "1.75rem", fontWeight: 700, color: "#2D2D2D" },
    h4: { fontSize: "1.5rem", fontWeight: 600, color: "#2D2D2D" },
    h5: { fontSize: "1.25rem", fontWeight: 600, color: "#2D2D2D" },
    h6: { fontSize: "1rem", fontWeight: 600, color: "#2D2D2D" },
    body1: { fontSize: "1rem", color: "#2D2D2D" },
    body2: { fontSize: "0.875rem", color: "#6B6B6B" },
    caption: { fontSize: "0.75rem", color: "#6B6B6B" },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 6px 24px rgba(107, 91, 149, 0.08)",
          borderRadius: 16,
          border: "1px solid rgba(107, 91, 149, 0.05)",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            boxShadow: "0 10px 40px rgba(107, 91, 149, 0.12)",
            transform: "translateY(-3px)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: "none",
          fontWeight: 500,
          padding: "10px 24px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(107, 91, 149, 0.15)",
          },
        },
        contained: {
          background: "linear-gradient(135deg, #6B5B95 0%, #8E80B1 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #534575 0%, #6B5B95 100%)",
            boxShadow: "0 6px 16px rgba(107, 91, 149, 0.25)",
          },
        },
        outlined: {
          borderColor: "rgba(107, 91, 149, 0.4)",
          color: "#6B5B95",
          "&:hover": {
            borderColor: "#6B5B95",
            backgroundColor: "rgba(107, 91, 149, 0.05)",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#2D2D2D",
          boxShadow: "0 2px 10px rgba(107, 91, 149, 0.05)",
          borderBottom: "1px solid rgba(107, 91, 149, 0.05)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#FAFAFA",
          borderRight: "1px solid rgba(107, 91, 149, 0.08)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            "& fieldset": {
              borderColor: "rgba(107, 91, 149, 0.2)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(107, 91, 149, 0.4)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#6B5B95",
              borderWidth: "2px",
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          "&.Mui-expanded": {
            margin: "auto",
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          "&.Mui-expanded": {
            minHeight: 48,
          },
        },
      },
    },
  },
});

export default theme;
