import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface ConnectModalStore {
  isConnectModalOpen: boolean;
  setIsConnectModalOpen: (isOpen: boolean) => void;
}

export const useConnectModalStore = create<
  ConnectModalStore,
  [["zustand/immer", never]]
>(
  immer((set) => ({
    isConnectModalOpen: false,
    setIsConnectModalOpen: (isOpen: boolean) => {
      set((state) => {
        state.isConnectModalOpen = isOpen;
      });
    },
  })),
);
