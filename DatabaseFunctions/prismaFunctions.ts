import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Retrieves a list of successful submissions for a given user
 * @param userId - The user ID to fetch submissions for
 * @param limit - Maximum number of submissions to return (default: 20, max: 100)
 * @returns Array of submission objects with id, userId, status, createdAt
 */
export async function listSubs(userId: string, limit = 20) {
  if (!userId) throw new Error("USER_NOT_FOUND");

  return prisma.submission.findMany({
    where: { userId, status: "AC" },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 100),
    select: {
      id: true,
      userId: true,
      status: true,
      createdAt: true,
      problem: {
        select: { title: true, difficulty: true },
      },
    },
  });
}

/**
 * Creates a new user profile with validation
 * @param userData - User information including email, username, displayName
 * @returns Created user object
 */
export async function createUser(userData: {
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
}) {
  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: userData.email }, { username: userData.username }],
    },
  });

  if (existingUser) {
    throw new Error("USER_ALREADY_EXISTS");
  }

  return prisma.user.create({
    data: {
      email: userData.email,
      username: userData.username,
      displayName: userData.displayName,
      avatar: userData.avatar,
      createdAt: new Date(),
      lastActiveAt: new Date(),
    },
  });
}

/**
 * Updates user's submission status and tracks progress
 * @param userId - User ID
 * @param problemId - Problem ID that was solved
 * @param submissionData - Submission details
 * @returns Updated submission record
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
  const submission = await prisma.submission.create({
    data: {
      userId,
      problemId,
      status: submissionData.status,
      runtime: submissionData.runtime,
      memory: submissionData.memory,
      language: submissionData.language,
      code: submissionData.code,
      submittedAt: new Date(),
    },
    include: {
      user: { select: { username: true, displayName: true } },
      problem: { select: { title: true, difficulty: true } },
    },
  });

  // Update user's statistics if submission was accepted
  if (submissionData.status === "AC") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalSubmissions: { increment: 1 },
        acceptedSubmissions: { increment: 1 },
        lastActiveAt: new Date(),
      },
    });
  }

  return submission;
}

/**
 * Retrieves user statistics and leaderboard position
 * @param userId - User ID
 * @returns User statistics with ranking information
 */
export async function getUserStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      totalSubmissions: true,
      acceptedSubmissions: true,
      createdAt: true,
      lastActiveAt: true,
    },
  });

  if (!user) throw new Error("USER_NOT_FOUND");

  // Calculate acceptance rate
  const acceptanceRate =
    user.totalSubmissions > 0
      ? (user.acceptedSubmissions / user.totalSubmissions) * 100
      : 0;

  // Get user's rank (simplified - in real app you'd use a more efficient ranking system)
  const userRank =
    (await prisma.user.count({
      where: {
        acceptedSubmissions: { gt: user.acceptedSubmissions },
      },
    })) + 1;

  return {
    ...user,
    acceptanceRate: Math.round(acceptanceRate * 100) / 100,
    rank: userRank,
  };
}

/**
 * Searches problems by title, difficulty, or tags with pagination
 * @param searchParams - Search criteria
 * @returns Paginated list of problems matching criteria
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
  const skip = (page - 1) * limit;

  const where: any = {};

  if (searchParams.query) {
    where.title = { contains: searchParams.query, mode: "insensitive" };
  }

  if (searchParams.difficulty) {
    where.difficulty = searchParams.difficulty;
  }

  if (searchParams.tags && searchParams.tags.length > 0) {
    where.tags = { hasSome: searchParams.tags };
  }

  const [problems, total] = await Promise.all([
    prisma.problem.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        difficulty: true,
        tags: true,
        acceptanceRate: true,
        totalSubmissions: true,
      },
    }),
    prisma.problem.count({ where }),
  ]);

  return {
    problems,
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
 * @param userId - User ID to delete
 * @param adminUserId - Admin user ID performing the deletion
 * @returns Deletion confirmation
 */
export async function deleteUser(userId: string, adminUserId: string) {
  // Check if admin user has permission
  const admin = await prisma.user.findUnique({
    where: { id: adminUserId },
    select: { role: true },
  });

  if (!admin || admin.role !== "ADMIN") {
    throw new Error("INSUFFICIENT_PERMISSIONS");
  }

  if (userId === adminUserId) {
    throw new Error("CANNOT_DELETE_SELF");
  }

  // Delete user and cascade delete related records
  await prisma.user.delete({
    where: { id: userId },
  });

  return { success: true, message: `User ${userId} deleted successfully` };
}

/**
 * Optimistic concurrency update for a user's profile.
 * Requires a numeric `version` column on `user` that increments on each write.
 * If the expected version does not match, the update is aborted.
 */
export async function updateUserProfileOptimistic(
  userId: string,
  updates: Partial<{
    email: string;
    username: string;
    displayName: string;
    avatar: string | null;
  }>,
  expectedVersion: number
) {
  // We attempt an update conditioned on the expected version.
  // If no row is changed, we throw a version conflict error.
  const updated = await prisma.user.updateMany({
    where: { id: userId, version: expectedVersion },
    data: {
      ...updates,
      version: { increment: 1 },
      lastActiveAt: new Date(),
    },
  });

  if (updated.count === 0) {
    throw new Error("VERSION_CONFLICT");
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatar: true,
      version: true,
      lastActiveAt: true,
    },
  });
}

/**
 * Bulk upsert Problems with chunked transactional writes.
 * - If a problem with the same `id` exists, update selective fields.
 * - If it doesn't exist, create it.
 * The function is resilient for large arrays via 100-sized chunks.
 */
export async function bulkUpsertProblems(
  problems: Array<{
    id: string;
    title: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    tags?: string[];
  }>
) {
  const CHUNK_SIZE = 100;
  const results: Array<{ id: string }> = [];

  for (let i = 0; i < problems.length; i += CHUNK_SIZE) {
    const chunk = problems.slice(i, i + CHUNK_SIZE);

    // Use a single transaction per chunk to ensure atomicity.
    const txResults = await prisma.$transaction(
      chunk.map((p) =>
        prisma.problem.upsert({
          where: { id: p.id },
          create: {
            id: p.id,
            title: p.title,
            difficulty: p.difficulty,
            tags: p.tags ?? [],
            createdAt: new Date(),
            totalSubmissions: 0,
            acceptanceRate: 0,
          },
          update: {
            title: p.title,
            difficulty: p.difficulty,
            tags: p.tags ?? [],
          },
          select: { id: true },
        })
      )
    );

    results.push(...txResults);
  }

  return { count: results.length, ids: results.map((r) => r.id) };
}

/**
 * Advanced leaderboard with cursor pagination and multi-key ordering.
 * Orders by acceptedSubmissions desc, then totalSubmissions asc (efficiency), then createdAt asc (older users first), then id.
 * Returns a stable cursor for the next page.
 */
export async function getLeaderboardSegment(params: {
  pageSize?: number;
  cursor?: {
    acceptedSubmissions: number;
    totalSubmissions: number;
    createdAt: Date;
    id: string;
  } | null;
  minimumAccepted?: number;
}) {
  const pageSize = Math.min(Math.max(params.pageSize ?? 25, 1), 100);

  const where = {
    acceptedSubmissions: params.minimumAccepted
      ? { gte: params.minimumAccepted }
      : undefined,
  } as const;

  const orderBy = [
    { acceptedSubmissions: "desc" as const },
    { totalSubmissions: "asc" as const },
    { createdAt: "asc" as const },
    { id: "asc" as const },
  ];

  // Prisma cursor pagination with a compound cursor emulated via AND conditions
  const users = await prisma.user.findMany({
    where,
    orderBy,
    take: pageSize + 1,
    ...(params.cursor
      ? {
          skip: 1,
          cursor: { id: params.cursor.id },
        }
      : {}),
    select: {
      id: true,
      username: true,
      displayName: true,
      acceptedSubmissions: true,
      totalSubmissions: true,
      createdAt: true,
    },
  });

  const hasNext = users.length > pageSize;
  const items = users.slice(0, pageSize);
  const nextCursor = hasNext
    ? {
        acceptedSubmissions: items[items.length - 1].acceptedSubmissions,
        totalSubmissions: items[items.length - 1].totalSubmissions,
        createdAt: items[items.length - 1].createdAt,
        id: items[items.length - 1].id,
      }
    : null;

  // Compute a derived rank locally if helpful to UI
  // NOTE: For true global ranks across pages, use a dedicated ranking table or window functions via SQL.
  return { items, hasNext, nextCursor };
}

/**
 * Recompute and persist Problem statistics from Submissions.
 * Useful after migrations/backfills to ensure acceptanceRate & totals are in sync.
 */
export async function rebuildProblemStats(problemId: string) {
  const [totals, accepted] = await Promise.all([
    prisma.submission.count({ where: { problemId } }),
    prisma.submission.count({ where: { problemId, status: "AC" } }),
  ]);

  const acceptanceRate =
    totals > 0
      ? Math.round(((accepted / totals) * 100 + Number.EPSILON) * 100) / 100
      : 0;

  await prisma.problem.update({
    where: { id: problemId },
    data: { totalSubmissions: totals, acceptanceRate },
  });

  return {
    problemId,
    totalSubmissions: totals,
    acceptedSubmissions: accepted,
    acceptanceRate,
  };
}

/**
 * Backfill users' aggregated stats from the Submissions table in batches.
 * Ensures `totalSubmissions`, `acceptedSubmissions`, and `lastActiveAt` are consistent.
 */
export async function backfillUserStats(batchSize = 200) {
  let cursor: string | null = null;
  let processed = 0;

  // Iterate through users in deterministic order to avoid skipping during updates
  // We avoid heavy joins by computing counts per user in small batches.
  // For large datasets, consider pre-aggregating into a separate table.
  while (true) {
    const users = await prisma.user.findMany({
      take: batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: { id: true },
    });

    if (users.length === 0) break;

    await prisma.$transaction(
      users.map((u) =>
        (async () => {
          const [total, accepted, last] = await Promise.all([
            prisma.submission.count({ where: { userId: u.id } }),
            prisma.submission.count({ where: { userId: u.id, status: "AC" } }),
            prisma.submission.findFirst({
              where: { userId: u.id },
              orderBy: { submittedAt: "desc" },
              select: { submittedAt: true },
            }),
          ]);

          return prisma.user.update({
            where: { id: u.id },
            data: {
              totalSubmissions: total,
              acceptedSubmissions: accepted,
              lastActiveAt: last?.submittedAt ?? undefined,
            },
          });
        })()
      )
    );

    processed += users.length;
    cursor = users[users.length - 1].id;
  }

  return { processed };
}

/**
 * Advanced search over Submissions with multiple filters and cursor pagination.
 * Supports: status, language(s), date range, problem difficulty, and text match on code (if stored).
 */
export async function searchSubmissionsAdvanced(params: {
  userId?: string;
  statuses?: Array<"AC" | "WA" | "TLE" | "RE" | "CE">;
  languages?: string[];
  problemDifficulty?: "EASY" | "MEDIUM" | "HARD";
  submittedFrom?: Date;
  submittedTo?: Date;
  textQuery?: string; // matches problem title or code (if code stored)
  limit?: number;
  cursorId?: string | null; // submission id for pagination
}) {
  const limit = Math.min(Math.max(params.limit ?? 25, 1), 100);

  const where: any = {};
  if (params.userId) where.userId = params.userId;
  if (params.statuses && params.statuses.length > 0)
    where.status = { in: params.statuses };
  if (params.languages && params.languages.length > 0)
    where.language = { in: params.languages };
  if (params.submittedFrom || params.submittedTo) {
    where.submittedAt = {
      ...(params.submittedFrom ? { gte: params.submittedFrom } : {}),
      ...(params.submittedTo ? { lte: params.submittedTo } : {}),
    };
  }

  const problemFilter: any = {};
  if (params.problemDifficulty)
    problemFilter.difficulty = params.problemDifficulty;
  if (params.textQuery)
    problemFilter.title = { contains: params.textQuery, mode: "insensitive" };

  const submissions = await prisma.submission.findMany({
    where,
    take: limit + 1,
    ...(params.cursorId ? { skip: 1, cursor: { id: params.cursorId } } : {}),
    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
    include: {
      problem: {
        where: Object.keys(problemFilter).length ? problemFilter : undefined,
        select: { id: true, title: true, difficulty: true, tags: true },
      },
      user: { select: { id: true, username: true, displayName: true } },
    },
  });

  const hasNext = submissions.length > limit;
  const items = submissions.slice(0, limit);
  const nextCursorId = hasNext ? items[items.length - 1].id : null;

  return { items, hasNext, nextCursorId };
}
