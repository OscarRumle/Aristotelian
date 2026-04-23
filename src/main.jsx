import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import Root from "./Root.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>
);
