import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "@descope/react-sdk";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider projectId="P2YlsE5KvXaKJ7gvXF1kIB2oj1Kg">
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
