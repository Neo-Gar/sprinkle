import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import clientPromise from "@/server/db";
import { nanoid } from "nanoid";

const client = await clientPromise;
const db = client.db(process.env.MONGODB_DB);

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export const billRouter = createTRPCRouter({
  createBill: publicProcedure
    .input(
      z.object({
        groupId: z.string(),
        description: z.string().min(1),
        totalAmount: z.number().positive(),
        currency: z.string().optional(),
        payerAddress: z.string(),
        splits: z.record(z.string(), z.number().min(0)),
      }),
    )
    .mutation(async ({ input }) => {
      const group = await db
        .collection("groups")
        .findOne({ id: input.groupId });
      if (!group) return { success: false as const, error: "group_not_found" };
      const members = (group.members as string[]) ?? [];
      if (members.length <= 1)
        return {
          success: false as const,
          error: "group_too_small",
          message: "Add members to the group first to split the bill",
        };
      if (!members.includes(input.payerAddress))
        return { success: false as const, error: "payer_not_in_group" };
      const splitEntries = Object.entries(input.splits).filter(
        ([_, amount]) => amount > 0,
      );
      for (const [addr] of splitEntries) {
        if (!members.includes(addr))
          return { success: false as const, error: "member_not_in_group" };
      }
      const sum = round2(
        splitEntries.reduce((acc, [, amount]) => acc + amount, 0),
      );
      const totalRounded = round2(input.totalAmount);
      if (splitEntries.length > 0 && Math.abs(sum - totalRounded) > 0.01)
        return {
          success: false as const,
          error: "splits_total_mismatch",
          message: `Sum of splits (${sum}) must equal total amount (${totalRounded})`,
        };
      const id = nanoid();
      const splitsRecord: Record<string, number> = {};
      for (const [addr, amount] of splitEntries) {
        splitsRecord[addr] = round2(amount);
      }
      await db.collection("bills").insertOne({
        id,
        groupId: input.groupId,
        description: input.description,
        totalAmount: totalRounded,
        currency: input.currency ?? "USD",
        payerAddress: input.payerAddress,
        splits: splitsRecord,
        createdBy: input.payerAddress,
        createdAt: new Date(),
      });
      return { success: true as const, id };
    }),
  getBills: publicProcedure
    .input(
      z.object({ groupId: z.string(), userAddress: z.string().optional() }),
    )
    .query(async ({ input }) => {
      if (!input.groupId) return [];
      const bills = await db
        .collection("bills")
        .find({ groupId: input.groupId })
        .toArray();
      const group = await db
        .collection("groups")
        .findOne(
          { id: input.groupId },
          { projection: { password: 0 } },
        );
      const members = (group?.members as string[] | undefined) ?? [];
      const groupInfo = group
        ? {
            id: group.id as string,
            name: group.name as string,
            iconId: group.iconId as string,
            membersCount: members.length,
            inviteLink: "",
          }
        : null;
      const userAddr = input.userAddress ?? "";
      return bills.map((b) => {
        const splits = (b.splits as Record<string, number>) ?? {};
        const userAmount = userAddr ? splits[userAddr] ?? 0 : 0;
        return {
          id: b.id,
          groupId: b.groupId,
          description: b.description,
          totalAmount: b.totalAmount,
          currency: b.currency,
          payerAddress: b.payerAddress,
          group: groupInfo,
          userAmount,
          splits,
        };
      });
    }),
  getBillsForUser: publicProcedure
    .input(
      z.object({
        userAddress: z.string(),
        debtsOnly: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      const groups = await db
        .collection("groups")
        .find({
          members: input.userAddress,
        })
        .toArray();
      const groupIds = groups.map((g) => g.id as string);
      if (groupIds.length === 0) return [];
      const bills = await db
        .collection("bills")
        .find({ groupId: { $in: groupIds } })
        .toArray();
      const groupMap = new Map(
        groups.map((g) => [
          g.id,
          {
            id: g.id as string,
            name: g.name as string,
            iconId: g.iconId as string,
            membersCount: (g.members as string[])?.length ?? 0,
            inviteLink: "",
          },
        ]),
      );
      const userAddr = input.userAddress;
      const result = bills
        .map((b) => {
          const splits = (b.splits as Record<string, number>) ?? {};
          const userAmount = splits[userAddr] ?? 0;
          if (input.debtsOnly && userAmount <= 0) return null;
          return {
            id: b.id,
            groupId: b.groupId,
            description: b.description,
            totalAmount: b.totalAmount,
            currency: b.currency,
            payerAddress: b.payerAddress,
            group: groupMap.get(b.groupId as string) ?? null,
            userAmount,
            splits,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);
      return result;
    }),
  getBill: publicProcedure
    .input(
      z.object({ id: z.string(), userAddress: z.string().optional() }),
    )
    .query(async ({ input }) => {
      const b = await db.collection("bills").findOne({ id: input.id });
      if (!b) return null;
      const group = await db
        .collection("groups")
        .findOne(
          { id: b.groupId as string },
          { projection: { password: 0 } },
        );
      const members = (group?.members as string[] | undefined) ?? [];
      const groupInfo = group
        ? {
            id: group.id as string,
            name: group.name as string,
            iconId: group.iconId as string,
            membersCount: members.length,
            inviteLink: "",
          }
        : null;
      const splits = (b.splits as Record<string, number>) ?? {};
      const userAddr = input.userAddress ?? "";
      const userAmount = userAddr ? splits[userAddr] ?? 0 : 0;
      return {
        id: b.id,
        groupId: b.groupId,
        description: b.description,
        totalAmount: b.totalAmount,
        currency: b.currency,
        payerAddress: b.payerAddress,
        group: groupInfo,
        userAmount,
        splits,
        createdAt: b.createdAt,
      };
    }),
});
