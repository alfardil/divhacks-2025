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

      // Try to fix common JSON issues
      cleanJson = this.fixCommonJsonIssues(cleanJson);

      try {
        const parsed = JSON.parse(cleanJson);

        // Ensure it's an array
        const functions = Array.isArray(parsed) ? parsed : [parsed];

        // Validate each function
        const validatedFunctions: DatabaseFunction[] = [];
        for (const func of functions) {
          try {
            // Ensure required fields exist with defaults
            const normalizedFunc = this.normalizeFunction(func);
            const validated = SpecSchema.shape.functions.element.parse(normalizedFunc);
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
        console.error(`Raw AI response for debugging:`);
        console.error(cleanJson.substring(0, 500) + "...");
        throw new Error(`Failed to parse AI response: ${parseError}`);
      }
    } catch (error) {
      throw new Error(`Analysis failed: ${error}`);
    }
  }

  /**
   * Fix common JSON issues that AI models might produce
   */
  private fixCommonJsonIssues(json: string): string {
    // Remove any trailing commas before closing braces/brackets
    let fixed = json.replace(/,(\s*[}\]])/g, '$1');
    
    // Try to fix unterminated strings by finding the last quote and closing it
    const quoteCount = (fixed.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      // Odd number of quotes - likely an unterminated string
      const lastQuoteIndex = fixed.lastIndexOf('"');
      if (lastQuoteIndex !== -1) {
        // Check if it's inside a string (not escaped)
        const beforeQuote = fixed.substring(0, lastQuoteIndex);
        const escapedQuotes = (beforeQuote.match(/\\"/g) || []).length;
        const unescapedQuotes = (beforeQuote.match(/[^\\]"/g) || []).length;
        
        if (unescapedQuotes % 2 !== 0) {
          // This quote is opening a string, so we need to close it
          fixed = fixed.substring(0, lastQuoteIndex + 1) + '"' + fixed.substring(lastQuoteIndex + 1);
        }
      }
    }
    
    return fixed;
  }

  /**
   * Normalize function object to ensure all required fields exist
   */
  private normalizeFunction(func: any): any {
    return {
      opId: func.opId || "unknown",
      summary: func.summary || "",
      description: func.description || "",
      tags: Array.isArray(func.tags) ? func.tags : [],
      input: func.input ? {
        type: func.input.type || "object",
        properties: func.input.properties || {},
        required: func.input.required || []
      } : undefined,
      output: func.output ? {
        type: func.output.type || "object",
        properties: func.output.properties || {}
      } : undefined,
      engine: func.engine || "unknown",
      touches: func.touches || {}
    };
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
