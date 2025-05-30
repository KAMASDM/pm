import React from "react";
import { Box, CircularProgress, Typography, Fade } from "@mui/material";

const Loading = ({
  message = "Loading...",
  size = 60,
  fullScreen = false,
  color = "primary",
}) => {
  const content = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        ...(fullScreen && {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
        }),
      }}
    >
      <CircularProgress
        size={size}
        thickness={4}
        sx={{
          color: color === "primary" ? "primary.main" : color,
          "& .MuiCircularProgress-circle": {
            strokeLinecap: "round",
          },
        }}
      />
      {message && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontWeight: 500,
            textAlign: "center",
            maxWidth: 300,
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  return fullScreen ? (
    <Fade in={true} timeout={300}>
      {content}
    </Fade>
  ) : (
    content
  );
};

export default Loading;