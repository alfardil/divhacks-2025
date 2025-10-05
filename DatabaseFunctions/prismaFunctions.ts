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
