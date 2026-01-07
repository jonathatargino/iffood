import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import "./styles/globals.css";
import { AuthProvider } from "./contexts/auth";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
