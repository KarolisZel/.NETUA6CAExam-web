import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthData, UserData } from "@/auth";
import axios from "axios";
import { getUrl } from "@/utils/navigation";

type Actions = {
  logout: () => void;
  register: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  updateUser: (userData: UserData) => void;
};

type State = {
  user: UserData | null;
  auth: AuthData | null;
};

// Helper to convert old auth format to new format
const convertAuthFormat = (oldAuth: any): AuthData | null => {
  if (!oldAuth?.accessToken) return null;
  return {
    token: oldAuth.accessToken,
    user: oldAuth.user || null
  };
};

export const useAuthStore = create<State & Actions>()(
  persist(
    (set) => ({
      user: null,
      auth: null,
      logout: () => {
        set({ auth: null, user: null });
      },
      updateUser: (userData: UserData) => {
        set((state) => ({
          user: userData,
          auth: state.auth ? { ...state.auth, user: userData } : null
        }));
      },
      register: async (email: string, password: string, username: string) => {
        try {
          // Step 1: Register the user
          const registerResponse = await axios.post(
            getUrl("register"),
            { email, password, username }
          );

          if (registerResponse.status < 200 || registerResponse.status >= 300) {
            throw new Error(`Registration failed with status ${registerResponse.status}`);
          }

          // Step 2: Login to get auth token
          const loginResponse = await axios.post<AuthData>(
            getUrl("login"),
            { email, password }
          );

          if (loginResponse.status < 200 || loginResponse.status >= 300) {
            throw new Error("Failed to login after registration");
          }

          // Step 3: Process auth data
          let authData: AuthData | null = null;

          if ((loginResponse.data as any).accessToken) {
            authData = {
              token: (loginResponse.data as any).accessToken,
              user: (loginResponse.data as any).user || null
            };
          } else if ((loginResponse.data as any).token) {
            authData = loginResponse.data as AuthData;
          }

          if (!authData) {
            throw new Error("Invalid auth data received");
          }

          // Step 4: Fetch user data if needed
          if (!authData.user || Object.keys(authData.user).length === 0) {
            const userResponse = await axios.get<UserData>(
              getUrl(["user", "me"]),
              {
                headers: {
                  Authorization: `Bearer ${authData.token}`
                }
              }
            );
            authData.user = userResponse.data;
          }

          // Step 5: Set auth state
          set({
            auth: authData,
            user: authData.user,
          });
        } catch (error: any) {
          console.error('Registration error:', error);

          if (error.response?.data?.errors?.DuplicateUserName) {
            throw error;
          }

          throw new Error(error.response?.data?.message || "Failed to register. Please try again.");
        }
      },
      login: async (email: string, password: string) => {
        const response = await axios.post<AuthData>(
          getUrl("login"),
          { email, password }
        );
        if (response.status < 200 || response.status >= 300) throw new Error("Failed to login");

        // Convert old format to new format if needed
        const authData = (response.data as any).accessToken
          ? convertAuthFormat(response.data)
          : response.data;

        if (!authData) {
          throw new Error("Invalid auth data received");
        }

        // If user data is missing or empty, fetch it
        if (!authData.user || Object.keys(authData.user).length === 0) {
          try {
            const userResponse = await axios.get<UserData>(
              getUrl(["user", "me"]),
              {
                headers: {
                  Authorization: `Bearer ${authData.token}`
                }
              }
            );
            authData.user = userResponse.data;
          } catch (error) {
            console.error("Failed to fetch user data:", error);
            throw new Error("Failed to fetch user data");
          }
        }

        set({
          auth: authData,
          user: authData.user,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ auth: state.auth, user: state.user }),
      onRehydrateStorage: () => (state) => {
        // Convert any old format auth data when rehydrating
        if (state) {
          const oldAuth = state.auth as any;
          if (oldAuth?.accessToken) {
            const newAuth = convertAuthFormat(oldAuth);
            state.auth = newAuth;
            state.user = newAuth?.user || null;
          }
        }
      },
    },
  ),
);
