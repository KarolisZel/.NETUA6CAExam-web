import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Axios from "axios";
import { configure } from "axios-hooks";
import { BASE_URL } from "./api";
import { Toaster } from "react-hot-toast";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "./components/theme-provider";
import { routeTree } from "./routeTree.gen";
import { useAuthStore } from "./components/hooks/use-auth";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const axios = Axios.create({
  baseURL: BASE_URL,
});

// Add auth token to all requests
axios.interceptors.request.use((config) => {
  const auth = useAuthStore.getState().auth;
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

configure({ axios, cache: false });

const router = createRouter({ routeTree });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            marginRight: "50px",
            marginTop: "50px",
            borderRadius: "3px",
            background: "#333",
            color: "#fff",
          },
        }}
      />
    </ThemeProvider>
  </React.StrictMode>,
);
