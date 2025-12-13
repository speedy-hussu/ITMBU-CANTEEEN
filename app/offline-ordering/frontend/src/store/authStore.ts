import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  username: string;
  role: "POS" | "KDS" | "ADMIN";
  token: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (user: User) => {
        console.log("🔐 Zustand: Logging in user:", user);

        // Store in localStorage manually as backup
        localStorage.setItem("token", user.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            username: user.username,
            role: user.role,
          })
        );

        // Update Zustand state
        set({
          user,
          isAuthenticated: true,
        });

        console.log("✅ Zustand: User logged in successfully");
      },

      logout: () => {
        console.log("🚪 Zustand: Logging out user");

        // Clear localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Clear Zustand state
        set({
          user: null,
          isAuthenticated: false,
        });

        console.log("✅ Zustand: User logged out successfully");
      },
    }),
    {
      name: "auth-storage", // localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage
    }
  )
);
