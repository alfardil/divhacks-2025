import { Spec, DatabaseFunction, SpecSchema } from "./types";
import { AIProvider } from "./ai-providers";

export class DatabaseAnalyzer {
  private aiProvider: AIProvider;

  constructor(aiProvider: AIProvider) {
    this.aiProvider = aiProvider;
  }

  /**
   * Analyze a single file and extract database functions
   */
  async analyzeFile(
    fileContent: string,
    fileName: string
  ): Promise<DatabaseFunction[]> {
    try {
      const raw = await this.aiProvider.analyzeFile(fileContent, fileName);
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
