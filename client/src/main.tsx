import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "@descope/react-sdk";
import "./index.css";
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { loadEnv } from './env';

const env = loadEnv();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider projectId={env.descopeProjectId}>
      <Theme>
        <App />
      </Theme>
    </AuthProvider>
  </React.StrictMode>,
);
