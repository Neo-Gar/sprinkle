import { create } from "zustand";

export interface SidebarStore {
  selectedGroupId: string | null;
  showAllBills: boolean;
  setSelectedGroupId: (id: string | null) => void;
  setShowAllBills: (show: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  selectedGroupId: null,
  showAllBills: false,
  setSelectedGroupId: (id) => set({ selectedGroupId: id, showAllBills: false }),
  setShowAllBills: (show) =>
    set({ showAllBills: show, selectedGroupId: show ? null : null }),
}));
