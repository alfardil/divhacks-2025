import OpenAI from "openai";
import { Spec, DatabaseFunction, SpecSchema } from "./types";

// Same system prompt as the web version
const SYSTEM_PROMPT = `You are a database functions documentation expert. Your task is to meticulously analyze the provided TypeScript/JavaScript code and identify ALL functions that perform database operations.

IMPORTANT: You must identify EVERY function that:
- Uses Prisma client (prisma.*)
- Executes SQL queries (SELECT, INSERT, UPDATE, DELETE, etc.)
- Performs database operations (findMany, create, update, delete, etc.)
- Interacts with any database/ORM

Look for functions with names like: create*, add*, get*, find*, search*, list*, update*, edit*, delete*, remove*, etc.

For each identified database function, provide:
- opId: unique identifier (e.g., "user.createUser", "problem.searchProblems")
- summary: brief description
- description: detailed explanation
- tags: array of relevant tags
- input: JSON schema for parameters
- output: JSON schema for return value
- engine: database engine used (e.g., "prisma", "sql", "raw-sql")
- touches: object indicating what data is read/written (e.g., {"read": ["users"], "write": ["submissions"]})

Return ONLY a valid JSON array of ALL database function objects. Do not miss any functions.`;

export class DatabaseAnalyzer {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Analyze a single file and extract database functions
   */
  async analyzeFile(
    fileContent: string,
    fileName: string
  ): Promise<DatabaseFunction[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `FILE_NAME: ${fileName}\n\n-----\n${fileContent}`,
          },
        ],
        temperature: 0.2,
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      const [jsonPart] = raw.split("\n-----\n");

      // Clean up markdown code blocks
      let cleanJson = jsonPart.trim();
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      try {
        const parsed = JSON.parse(cleanJson);

        // Ensure it's an array
        const functions = Array.isArray(parsed) ? parsed : [parsed];

        // Validate each function
        const validatedFunctions: DatabaseFunction[] = [];
        for (const func of functions) {
          try {
            const validated = SpecSchema.shape.functions.element.parse(func);
            validatedFunctions.push(validated);
          } catch (error) {
            console.warn(
              `Warning: Invalid function schema for ${func.opId || "unknown"}:`,
              error
            );
          }
        }

        return validatedFunctions;
      } catch (parseError) {
        throw new Error(`Failed to parse AI response: ${parseError}`);
      }
    } catch (error) {
      throw new Error(`Analysis failed: ${error}`);
    }
  }

  /**
   * Analyze multiple files and create a complete spec
   */
  async analyzeFiles(
    files: Array<{ content: string; fileName: string }>,
    projectTitle: string = "Database Functions"
  ): Promise<Spec> {
    const allFunctions: DatabaseFunction[] = [];

    for (const file of files) {
      try {
        const functions = await this.analyzeFile(file.content, file.fileName);
        allFunctions.push(...functions);
      } catch (error) {
        console.warn(`Warning: Failed to analyze ${file.fileName}: ${error}`);
      }
    }

    return {
      version: "0.1.0",
      info: {
        title: projectTitle,
      },
      functions: allFunctions,
    };
  }

  /**
   * Analyze with streaming (for progress updates)
   */
  async analyzeWithStreaming(
    files: Array<{ content: string; fileName: string }>,
    projectTitle: string = "Database Functions",
    onProgress?: (message: string) => void
  ): Promise<Spec> {
    const allFunctions: DatabaseFunction[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      onProgress?.(`Analyzing ${file.fileName} (${i + 1}/${files.length})`);

      try {
        const functions = await this.analyzeFile(file.content, file.fileName);
        allFunctions.push(...functions);
      } catch (error) {
        console.warn(`Warning: Failed to analyze ${file.fileName}: ${error}`);
      }
    }

    onProgress?.("Generating documentation...");

    return {
      version: "0.1.0",
      info: {
        title: projectTitle,
      },
      functions: allFunctions,
    };
  }
}
