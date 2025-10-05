import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AIProvider {
  analyzeFile(fileContent: string, fileName: string): Promise<string>;
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async analyzeFile(fileContent: string, fileName: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
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

    return completion.choices[0]?.message?.content ?? "";
  }
}

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });
  }

  async analyzeFile(fileContent: string, fileName: string): Promise<string> {
    const prompt = `${SYSTEM_PROMPT}

FILE_NAME: ${fileName}

-----
${fileContent}`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}

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
