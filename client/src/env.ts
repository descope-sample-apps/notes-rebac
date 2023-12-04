interface Env {
    descopeProjectId: string;
  }
  
  export function loadEnv(): Env {
    return {
      descopeProjectId: import.meta.env.VITE_DESCOPE_PROJECT_ID,
    };
  }