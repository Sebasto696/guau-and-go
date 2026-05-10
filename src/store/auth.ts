import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
  role: "client" | "walker";
  avatar?: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (v: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    await fetch("/api/auth/me", { method: "DELETE" });
    set({ user: null });
    window.location.href = "/";
  },
}));
