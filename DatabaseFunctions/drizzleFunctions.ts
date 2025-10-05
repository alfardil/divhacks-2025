import { db } from "@/db";
import { users, problems, submissions } from "@/db/schema";
import { eq, and, or, desc, sql, gt } from "drizzle-orm";

/**
 * Retrieves a list of successful submissions for a given user
 */
export async function listSubs(userId: string, limit = 20) {
  if (!userId) throw new Error("USER_NOT_FOUND");

  const subs = await db
    .select({
      id: submissions.id,
      userId: submissions.userId,
      status: submissions.status,
      createdAt: submissions.createdAt,
      title: problems.title,
      difficulty: problems.difficulty,
    })
    .from(submissions)
    .where(and(eq(submissions.userId, userId), eq(submissions.status, "AC")))
    .orderBy(desc(submissions.createdAt))
    .limit(Math.min(limit, 100))
    .innerJoin(problems, eq(submissions.problemId, problems.id));

  return subs;
}

/**
 * Creates a new user profile with validation
 */
export async function createUser(userData: {
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
}) {
  const existing = await db
    .select()
    .from(users)
    .where(
      or(eq(users.email, userData.email), eq(users.username, userData.username))
    )
    .limit(1);

  if (existing.length > 0) throw new Error("USER_ALREADY_EXISTS");

  const [created] = await db
    .insert(users)
    .values({
      email: userData.email,
      username: userData.username,
      displayName: userData.displayName,
      avatar: userData.avatar,
      createdAt: new Date(),
      lastActiveAt: new Date(),
    })
    .returning();

  return created;
}

/**
 * Updates user's submission status and tracks progress
 */
export async function updateSubmission(
  userId: string,
  problemId: string,
  submissionData: {
    status: "AC" | "WA" | "TLE" | "RE" | "CE";
    runtime?: number;
    memory?: number;
    language: string;
    code?: string;
  }
) {
  const [submission] = await db
    .insert(submissions)
    .values({
      userId,
      problemId,
      status: submissionData.status,
      runtime: submissionData.runtime,
      memory: submissionData.memory,
      language: submissionData.language,
      code: submissionData.code,
      submittedAt: new Date(),
    })
    .returning({
      id: submissions.id,
      userId: submissions.userId,
      status: submissions.status,
      problemId: submissions.problemId,
    });

  if (submissionData.status === "AC") {
    await db
      .update(users)
      .set({
        totalSubmissions: sql`${users.totalSubmissions} + 1`,
        acceptedSubmissions: sql`${users.acceptedSubmissions} + 1`,
        lastActiveAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  return submission;
}

/**
 * Retrieves user statistics and leaderboard position
 */
export async function getUserStats(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      totalSubmissions: users.totalSubmissions,
      acceptedSubmissions: users.acceptedSubmissions,
      createdAt: users.createdAt,
      lastActiveAt: users.lastActiveAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) throw new Error("USER_NOT_FOUND");

  const acceptanceRate =
    user.totalSubmissions > 0
      ? (user.acceptedSubmissions / user.totalSubmissions) * 100
      : 0;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(gt(users.acceptedSubmissions, user.acceptedSubmissions));

  return {
    ...user,
    acceptanceRate: Math.round(acceptanceRate * 100) / 100,
    rank: count + 1,
  };
}

/**
 * Searches problems by title, difficulty, or tags with pagination
 */
export async function searchProblems(searchParams: {
  query?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  tags?: string[];
  page?: number;
  limit?: number;
}) {
  const page = searchParams.page || 1;
  const limit = Math.min(searchParams.limit || 20, 50);
  const offset = (page - 1) * limit;

  const conditions = [];

  if (searchParams.query) {
    conditions.push(
      sql`LOWER(${problems.title}) LIKE LOWER('%${searchParams.query}%')`
    );
  }

  if (searchParams.difficulty) {
    conditions.push(eq(problems.difficulty, searchParams.difficulty));
  }

  if (searchParams.tags && searchParams.tags.length > 0) {
    conditions.push(sql`${problems.tags} && ${searchParams.tags}`);
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const problemsList = await db
    .select({
      id: problems.id,
      title: problems.title,
      difficulty: problems.difficulty,
      tags: problems.tags,
      acceptanceRate: problems.acceptanceRate,
      totalSubmissions: problems.totalSubmissions,
    })
    .from(problems)
    .where(whereClause)
    .orderBy(desc(problems.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(problems)
    .where(whereClause);

  return {
    problems: problemsList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Deletes a user and all associated data (admin function)
 */
export async function deleteUser(userId: string, adminUserId: string) {
  const [admin] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, adminUserId));

  if (!admin || admin.role !== "ADMIN") {
    throw new Error("INSUFFICIENT_PERMISSIONS");
  }

  if (userId === adminUserId) throw new Error("CANNOT_DELETE_SELF");

  await db.delete(users).where(eq(users.id, userId));

  return { success: true, message: `User ${userId} deleted successfully` };
}
