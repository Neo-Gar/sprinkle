import type { Group } from "./group";

export type Bill = {
  id: string;
  group: Group;
  description: string;
  totalAmount: number;
  /** Amount the current user owes (0 = paid) */
  userAmount: number;
  /** True if the current user has already paid their share (on-chain payment recorded) */
  userHasPaid?: boolean;
  currency?: string;
};
