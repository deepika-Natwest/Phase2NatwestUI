import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  spacing: 8,
  palette: {
    primary: {
      main: "#42145f",
      dark: "#2c0c40",
      light: "#f0e8f5",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#e6007e",
      light: "#fde5f2",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f6f7fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#252a4e",
      secondary: "#626b83",
    },
  },
  typography: {
    fontFamily: '"Lexend Deca", "Segoe UI", sans-serif',
    fontSize: 14,
    h1: {
      fontSize: "clamp(2rem, 4vw, 2.75rem)",
      fontWeight: 700,
      lineHeight: 1.15,
    },
    h2: {
      fontSize: "clamp(1.5rem, 3vw, 2rem)",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: "1.35rem",
      fontWeight: 700,
      lineHeight: 1.25,
    },
    body1: {
      lineHeight: 1.65,
    },
    body2: {
      lineHeight: 1.55,
    },
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: [
    "none",
    "0 2px 8px rgba(37, 42, 78, 0.06)",
    "0 6px 18px rgba(37, 42, 78, 0.08)",
    "0 10px 28px rgba(37, 42, 78, 0.10)",
    ...Array(21).fill("0 12px 32px rgba(37, 42, 78, 0.12)"),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#f6f7fb",
          color: "#252a4e",
        },
        "*, *::before, *::after": {
          boxSizing: "border-box",
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: "xl",
      },
      styleOverrides: {
        root: {
          paddingLeft: "clamp(16px, 3vw, 40px)",
          paddingRight: "clamp(16px, 3vw, 40px)",
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 1,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(37, 42, 78, 0.07)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 40,
          borderRadius: 8,
          paddingLeft: 18,
          paddingRight: 18,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "#ffffff",
        },
      },
    },
  },
});

export default theme;
