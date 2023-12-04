import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "@descope/react-sdk";
import "./index.css";
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';

// We should take the project id from the environment variables
// For now make sure to replace the project id with the same you used in the backend (`.env` file)
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider projectId="P2YlsE5KvXaKJ7gvXF1kIB2oj1Kg">
      <Theme>
        <App />
      </Theme>
    </AuthProvider>
  </React.StrictMode>,
);
