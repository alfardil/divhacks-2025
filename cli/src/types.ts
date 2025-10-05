import { z } from "zod";

// Database function schema
export const DatabaseFunctionSchema = z.object({
  opId: z.string(),
  summary: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  input: z
    .object({
      type: z.string(),
      properties: z.record(z.any()).optional(),
      required: z.array(z.string()).optional(),
    })
    .optional(),
  output: z
    .object({
      type: z.string(),
      properties: z.record(z.any()).optional(),
    })
    .optional(),
  engine: z.string(),
  touches: z
    .object({
      read: z.array(z.string()).optional(),
      write: z.array(z.string()).optional(),
    })
    .optional(),
});

export type DatabaseFunction = z.infer<typeof DatabaseFunctionSchema>;

// Spec schema
export const SpecSchema = z.object({
  version: z.string(),
  info: z.object({
    title: z.string(),
  }),
  functions: z.array(DatabaseFunctionSchema),
});

export type Spec = z.infer<typeof SpecSchema>;

// File analysis result
export interface FileAnalysisResult {
  filePath: string;
  fileName: string;
  content: string;
  hasDatabaseFunctions: boolean;
  functions?: DatabaseFunction[];
}

// CLI options
export interface CliOptions {
  input: string;
  output?: string;
  format: "html" | "json";
  recursive: boolean;
  verbose: boolean;
  provider: "openai" | "gemini";
}
