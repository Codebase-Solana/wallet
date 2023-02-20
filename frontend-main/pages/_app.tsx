import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  components: {
    MuiButton: {
      defaultProps: {
        className: "bg-emerald-600"
      }
    }
  },
  palette: {
    mode: "dark",
    primary: {
      main: "#059668", //Tailwind's emerald-600
    },
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="flex justify-center align-center items-center h-[600px] w-[350px] p-8">
        <Component {...pageProps} />
      </div>
    </ThemeProvider>
  );
}

export default MyApp;
