import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SidebarStore {
  selectedGroupId: string | null;
  showAllBills: boolean;
  showMyDebts: boolean;
  setSelectedGroupId: (id: string | null) => void;
  setShowAllBills: (show: boolean) => void;
  setShowMyDebts: (show: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set, get) => ({
      selectedGroupId: null,
      showAllBills: false,
      showMyDebts: false,
      setSelectedGroupId: (id) => {
        set({ selectedGroupId: id, showAllBills: false, showMyDebts: false });
      },
      setShowAllBills: (show) => {
        if (get().showMyDebts) set({ showMyDebts: false });
        set({ showAllBills: show, selectedGroupId: show ? null : null });
      },
      setShowMyDebts: (show) => {
        if (get().showAllBills) set({ showAllBills: false });
        set({ showMyDebts: show });
      },
    }),
    {
      name: "sprinkle-sidebar",
      partialize: (state) => ({
        selectedGroupId: state.selectedGroupId,
        showAllBills: state.showAllBills,
        showMyDebts: state.showMyDebts,
      }),
    },
  ),
);
