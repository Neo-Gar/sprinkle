import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import clientPromise from "@/server/db";
import { nanoid } from "nanoid";

const client = await clientPromise;
const db = client.db(process.env.MONGODB_DB);

export const groupRouter = createTRPCRouter({
  createGroup: publicProcedure
    .input(
      z.object({
        name: z.string(),
        iconId: z.string(),
        creatorAddress: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const id = nanoid();
      const password = nanoid(6);
      await db.collection("groups").insertOne({
        id,
        name: input.name,
        iconId: input.iconId,
        creator: input.creatorAddress,
        members: [input.creatorAddress],
        password,
      });
      return {
        id,
        name: input.name,
        iconId: input.iconId,
        membersCount: 1,
        inviteLink: `http://localhost:3000/invite/${id}?pass=${password}`,
      };
    }),
  updateGroup: publicProcedure
    .input(z.object({ id: z.string(), name: z.string(), iconId: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .collection("groups")
        .updateOne(
          { id: input.id },
          { $set: { name: input.name, iconId: input.iconId } },
        );
    }),
  getGroup: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const doc = await db.collection("groups").findOne({ id: input.id });
      if (!doc) return null;
      const members = (doc.members as string[] | undefined) ?? [];
      return {
        id: doc.id as string,
        name: doc.name as string,
        iconId: doc.iconId as string,
        membersCount: members.length,
      };
    }),
  joinGroup: publicProcedure
    .input(
      z.object({
        id: z.string(),
        pass: z.string(),
        address: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const group = await db.collection("groups").findOne({ id: input.id });
      if (!group)
        return { success: false as const, error: "not_found" };
      if (group.password !== input.pass)
        return { success: false as const, error: "wrong_password" };
      const members = (group.members as string[]) ?? [];
      if (members.includes(input.address))
        return { success: true as const, alreadyMember: true };
      await db.collection("groups").updateOne(
        { id: input.id },
        { $addToSet: { members: input.address } },
      );
      return { success: true as const, alreadyMember: false };
    }),
  getUserGroups: publicProcedure
    .input(z.object({ address: z.string() }))
    .query(async ({ input }) => {
      return await db
        .collection("groups")
        .find({ members: { $in: [input.address] } })
        .toArray();
    }),
});
