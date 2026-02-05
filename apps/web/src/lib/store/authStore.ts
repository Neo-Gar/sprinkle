import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthStore {
  zkLoginAddress?: string;
  setZkLoginAddress: (address: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      zkLoginAddress: undefined,
      setZkLoginAddress: (address) => {
        set({ zkLoginAddress: address });
      },
    }),
    {
      name: "sprinkle-auth",
      partialize: (state) => ({
        zkLoginAddress: state.zkLoginAddress,
      }),
    },
  ),
);
