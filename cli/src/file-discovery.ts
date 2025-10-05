import { glob } from "glob";
import { readFileSync } from "fs";
import { join, relative } from "path";
import { FileAnalysisResult } from "./types";

// Database function indicators
const DATABASE_KEYWORDS = [
  "prisma.",
  "db.",
  "database",
  "query(",
  "execute(",
  "INSERT",
  "SELECT",
  "UPDATE",
  "DELETE",
  "CREATE",
  "ALTER",
  "DROP",
  "findMany",
  "findFirst",
  "findUnique",
  "create",
  "update",
  "delete",
  "upsert",
  "aggregate",
  "groupBy",
  "count",
  "transaction",
];

// File patterns to scan
const FILE_PATTERNS = [
  "**/*.ts",
  "**/*.js",
  "**/*.tsx",
  "**/*.jsx",
  "**/*.sql",
  "**/*.py",
  "**/*.go",
];

// Files to ignore
const IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/coverage/**",
  "**/test/**",
  "**/tests/**",
  "**/spec/**",
  "**/specs/**",
  "**/*.test.*",
  "**/*.spec.*",
];

export class FileDiscovery {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Find all files that might contain database functions
   */
  async findDatabaseFiles(
    options: { recursive: boolean } = { recursive: true }
  ): Promise<string[]> {
    const patterns = options.recursive
      ? FILE_PATTERNS
      : FILE_PATTERNS.map((pattern) => pattern.replace("**/", ""));

    const allFiles: string[] = [];

    for (const pattern of patterns) {
      const files = await glob(pattern, {
        cwd: this.projectRoot,
        ignore: IGNORE_PATTERNS,
        absolute: true,
      });
      allFiles.push(...files);
    }

    return [...new Set(allFiles)]; // Remove duplicates
  }

  /**
   * Analyze a file to determine if it contains database functions
   */
  analyzeFile(filePath: string): FileAnalysisResult {
    try {
      const content = readFileSync(filePath, "utf-8");
      const fileName = relative(this.projectRoot, filePath);

      const hasDatabaseFunctions = this.hasDatabaseOperations(content);

      return {
        filePath,
        fileName,
        content,
        hasDatabaseFunctions,
      };
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  /**
   * Analyze multiple files
   */
  async analyzeFiles(filePaths: string[]): Promise<FileAnalysisResult[]> {
    const results: FileAnalysisResult[] = [];

    for (const filePath of filePaths) {
      try {
        const result = this.analyzeFile(filePath);
        results.push(result);
      } catch (error) {
        console.warn(`Warning: ${error}`);
      }
    }

    return results;
  }

  /**
   * Find and analyze all database files in the project
   */
  async discoverDatabaseFiles(
    options: { recursive: boolean } = { recursive: true }
  ): Promise<FileAnalysisResult[]> {
    const allFiles = await this.findDatabaseFiles(options);
    const analysisResults = await this.analyzeFiles(allFiles);

    // Filter to only files with database functions
    return analysisResults.filter((result) => result.hasDatabaseFunctions);
  }

  /**
   * Check if file content contains database operations
   */
  private hasDatabaseOperations(content: string): boolean {
    const lowerContent = content.toLowerCase();

    // Check for database keywords
    const hasKeywords = DATABASE_KEYWORDS.some((keyword) =>
      lowerContent.includes(keyword.toLowerCase())
    );

    // Check for function definitions that might be database functions
    const hasFunctionDefinitions = this.hasDatabaseFunctionPatterns(content);

    return hasKeywords || hasFunctionDefinitions;
  }

  /**
   * Check for common database function patterns
   */
  private hasDatabaseFunctionPatterns(content: string): boolean {
    // Common patterns for database functions
    const patterns = [
      /export\s+(async\s+)?function\s+\w+.*\{[\s\S]*?(prisma|db|database|query|execute)/i,
      /export\s+(async\s+)?function\s+\w+.*\{[\s\S]*?(findMany|findFirst|create|update|delete)/i,
      /const\s+\w+\s*=\s*(async\s+)?\([^)]*\)\s*=>\s*\{[\s\S]*?(prisma|db|database|query|execute)/i,
      /async\s+function\s+\w+.*\{[\s\S]*?(SELECT|INSERT|UPDATE|DELETE|CREATE)/i,
    ];

    return patterns.some((pattern) => pattern.test(content));
  }
}

