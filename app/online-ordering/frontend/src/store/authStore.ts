// frontend/src/store/useAuthStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  username: string;
  enrollmentId: string;
  role: "STUDENT" | "FACULTY";
  // token: string; // Note: Usually better to keep token in HTTP-only cookie, but safe to keep here for UI if needed
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
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage", // This is the key in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
