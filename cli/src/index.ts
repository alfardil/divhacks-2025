#!/usr/bin/env node

import chalk from "chalk";
import { exec } from "child_process";
import { Command } from "commander";
import { mkdirSync, writeFileSync } from "fs";
import inquirer from "inquirer";
import ora from "ora";
import { basename, dirname, resolve } from "path";
import { promisify } from "util";
import { GeminiProvider, OpenAIProvider } from "./ai-providers";
import { DatabaseAnalyzer } from "./analyzer";
import { FileDiscovery } from "./file-discovery";
import { HTMLGenerator } from "./html-generator";
import { CliOptions } from "./types";

const program = new Command();
const execAsync = promisify(exec);

program
  .name("dagger")
  .description("Generate database function documentation")
  .version("1.0.0");

program
  .command("generate")
  .description("Generate documentation from database functions in your project")
  .argument("[path]", "Path to analyze (default: current directory)", ".")
  .option("-o, --output <path>", "Output file path", "docs/index.html")
  .option("-f, --format <format>", "Output format", "html")
  .option("-r, --recursive", "Search recursively", true)
  .option("-v, --verbose", "Verbose output")
  .option("-p, --provider <provider>", "AI provider to use")
  .action(async (path: string, options: any) => {
    let provider = options.provider;

    // If no provider specified, prompt the user to choose
    if (!provider) {
      const answers = await inquirer.prompt([
        {
          type: "list",
          name: "provider",
          message: "Which AI provider would you like to use?",
          choices: [
            {
              name: "OpenAI (GPT-4o-mini)",
              value: "openai",
              short: "OpenAI",
            },
            {
              name: "Gemini (2.0 Flash)",
              value: "gemini",
              short: "Gemini",
            },
          ],
          default: "openai",
        },
      ]);
      provider = answers.provider;
    }

    const cliOptions: CliOptions = {
      input: resolve(path),
      output: options.output,
      format: options.format,
      recursive: options.recursive,
      verbose: options.verbose,
      provider: provider,
    };

    try {
      await generateDocumentation(cliOptions);
    } catch (error) {
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

async function generateDocumentation(options: CliOptions) {
  const { input, output, format, recursive, verbose, provider } = options;

  console.log(chalk.blue.bold("Database Functions Documentation Generator\n"));

  // Check for appropriate API key based on provider
  let apiKey: string;
  let providerName: string;

  if (provider === "openai") {
    apiKey = process.env.OPENAI_API_KEY || "";
    providerName = "OpenAI";
    if (!apiKey) {
      console.error(
        chalk.red(
          "Error: OPENAI_API_KEY environment variable is required for OpenAI provider"
        )
      );
      console.log(chalk.yellow("Please set your OpenAI API key:"));
      console.log(chalk.gray('export OPENAI_API_KEY="your-api-key-here"'));
      process.exit(1);
    }
  } else if (provider === "gemini") {
    apiKey = process.env.GEMINI_API_KEY || "";
    providerName = "Gemini";
    if (!apiKey) {
      console.error(
        chalk.red(
          "Error: GEMINI_API_KEY environment variable is required for Gemini provider"
        )
      );
      console.log(chalk.yellow("Please set your Gemini API key:"));
      console.log(chalk.gray('export GEMINI_API_KEY="your-api-key-here"'));
      process.exit(1);
    }
  } else {
    console.error(
      chalk.red(
        `Error: Invalid provider "${provider}". Use "openai" or "gemini".`
      )
    );
    process.exit(1);
  }

  const spinner = ora("Generating...").start();

  try {
    // Step 1: Discover files
    const fileDiscovery = new FileDiscovery(input);

    // Check if input is a single file
    const fs = require("fs");
    const path = require("path");
    let databaseFiles;

    if (fs.existsSync(input) && fs.statSync(input).isFile()) {
      // Single file provided
      const result = fileDiscovery.analyzeFile(input);
      databaseFiles = result.hasDatabaseFunctions ? [result] : [];
    } else {
      // Directory provided
      databaseFiles = await fileDiscovery.discoverDatabaseFiles({
        recursive,
      });
    }

    spinner.text = `Found ${databaseFiles.length} files with database functions`;

    if (databaseFiles.length === 0) {
      console.log(
        chalk.yellow("No database functions found in the specified path.")
      );
      console.log(
        chalk.gray("Make sure your files contain database operations like:")
      );
      console.log(
        chalk.gray("  - Prisma queries (prisma.user.findMany, etc.)")
      );
      console.log(
        chalk.gray("  - SQL queries (SELECT, INSERT, UPDATE, DELETE)")
      );
      console.log(chalk.gray("  - Database function calls"));
      return;
    }

    if (verbose) {
      console.log(chalk.gray("\nFiles to analyze:"));
      databaseFiles.forEach((file) => {
        console.log(chalk.gray(`  - ${file.fileName}`));
      });
    }

    // Step 2: Analyze files
    spinner.text = `Analyzing database functions using ${providerName}...`;

    // Create appropriate AI provider
    const aiProvider =
      provider === "openai"
        ? new OpenAIProvider(apiKey)
        : new GeminiProvider(apiKey);

    const analyzer = new DatabaseAnalyzer(aiProvider);
    const projectTitle = basename(input) || "Database Functions";

    const spec = await analyzer.analyzeWithStreaming(
      databaseFiles.map((file) => ({
        content: file.content,
        fileName: file.fileName,
      })),
      projectTitle,
      (message) => {
        if (verbose) {
          spinner.text = message;
        }
      }
    );

    spinner.text = `Analyzed ${spec.functions.length} database functions`;

    if (verbose) {
      console.log(chalk.gray("\nFunctions found:"));
      spec.functions.forEach((func) => {
        console.log(chalk.gray(`  - ${func.opId}: ${func.summary}`));
      });
    }

    // Step 3: Generate output
    spinner.text = "Generating documentation...";

    const outputPath = resolve(output || "docs/index.html");
    const outputDir = dirname(outputPath);

    // Ensure output directory exists
    mkdirSync(outputDir, { recursive: true });

    if (format === "html") {
      const htmlGenerator = new HTMLGenerator();
      const html = htmlGenerator.generateHTML(spec);
      writeFileSync(outputPath, html);
    } else if (format === "json") {
      writeFileSync(outputPath, JSON.stringify(spec, null, 2));
    }

    // Step 4: Success message
    spinner.succeed();
    console.log(chalk.green.bold("Database documentation generated"));

    console.log(chalk.blue("📊 Summary:"));
    console.log(chalk.gray(`  • Files analyzed: ${databaseFiles.length}`));
    console.log(
      chalk.gray(`  • Functions documented: ${spec.functions.length}`)
    );
    console.log(chalk.gray(`  • AI Provider: ${providerName}`));
    console.log(chalk.gray(`  • Output format: ${format.toUpperCase()}`));
    console.log(chalk.gray(`  • Output file: ${outputPath}`));

    if (format === "html") {
      console.log(chalk.yellow("\n🌐 HTML documentation generated!"));
      console.log(chalk.gray(`  • Output file: ${outputPath}`));
      console.log(chalk.gray(`  • Output directory: ${outputDir}`));
      
      // Ask user if they want to start a local server
      const { startServer } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'startServer',
          message: 'Would you like to start a local server to view the documentation?',
          default: true
        }
      ]);
      
      if (startServer) {
        console.log(chalk.yellow("\n🚀 Starting local server..."));
        
        try {
          // Start the server on a specific port
          const port = 3000;
          const serverUrl = `http://localhost:${port}`;
          
          console.log(chalk.gray(`  • Starting server on port ${port}...`));
          console.log(chalk.gray(`  • Serving from: ${outputDir}`));
          
          // Use spawn to run the server
          const { spawn } = require('child_process');
          const serverProcess = spawn('npx', ['serve', outputDir, '-l', port.toString()], {
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false
          });
          
          // Wait a moment for server to start
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          console.log(chalk.green("✅ Server started successfully!"));
          console.log(chalk.blue(`  • Server URL: ${serverUrl}`));
          console.log(chalk.gray("  • Server is running. Press Ctrl+C to stop."));
          
          // Keep the process alive so the server keeps running
          // The user can stop it with Ctrl+C
          
        } catch (error: any) {
          console.log(chalk.yellow("⚠️  Could not start server."));
          console.log(chalk.gray(`  • Error: ${error.message}`));
          console.log(
            chalk.gray("  • You can manually run: npx serve " + outputDir)
          );
          console.log(chalk.gray("  • Or open the file directly: " + outputPath));
        }
      } else {
        console.log(chalk.gray("\n📁 To view your documentation:"));
        console.log(chalk.gray(`  • Open the file directly: ${outputPath}`));
        console.log(chalk.gray(`  • Or run: npx serve ${outputDir}`));
      }
    }
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error(chalk.red("Uncaught Exception:"), error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error(chalk.red("Unhandled Rejection:"), reason);
  process.exit(1);
});

program.parse();
