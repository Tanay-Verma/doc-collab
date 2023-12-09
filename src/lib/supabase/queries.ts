"use server";
import { files, workspaces } from "@/migrations/schema";
import db from "./db";
import { File, Subscription, workspace } from "./supabase.types";
import { validate } from "uuid";
import { eq } from "drizzle-orm";

export const createWorkspace = async (workspace: workspace) => {
  try {
    const response = await db.insert(workspaces).values(workspace);
    return { data: null, error: null };
  } catch (error) {
    console.log("Error", error);
    return { data: null, error: `Error ${error}` };
  }
};

export const getUserSubscriptionStatus = async (userId: string) => {
  try {
    const data = await db.query.subscriptions.findFirst({
      where: (s, { eq }) => eq(s.userId, userId),
    });
    if (data) return { data: data as Subscription, error: null };
    else return { data: null, error: null };
  } catch (error) {
    console.log("Error", error);
    return { data: null, error: `Error ${error}` };
  }
};

export const getFiles = async (folderId: string) => {
  const isValid = validate(folderId);
  if (!isValid) return { data: null, error: "Error" };
  try {
    const result = (await db
      .select()
      .from(files)
      .orderBy(files.createdAt)
      .where(eq(files.folderId, folderId))) as File[] | [];
    return { data: result, error: null };
  } catch (error) {
    console.log("Get Files Error: ", error);
    return { data: null, error: "Error" };
  }
};
