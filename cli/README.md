# DB Doc CLI

A command-line tool for generating Swagger-like documentation for database functions.

## Installation

```bash
cd cli
npm install
npm run build
```

## Usage

```bash
# Set your API key (choose one)
export OPENAI_API_KEY="your-openai-api-key-here"
# OR
export GEMINI_API_KEY="your-gemini-api-key-here"

# Generate documentation for current directory (will prompt to choose AI provider)
node dist/index.js generate

# Generate documentation using OpenAI
node dist/index.js generate --provider openai

# Generate documentation using Gemini
node dist/index.js generate --provider gemini

# Generate documentation for specific directory
node dist/index.js generate /path/to/your/project

# Generate documentation for specific file
node dist/index.js generate functions.ts

# Specify output file
node dist/index.js generate -o docs/my-docs.html

# Generate JSON format
node dist/index.js generate -f json -o docs/functions.json

# Verbose output
node dist/index.js generate -v
```

## Options

- `[path]` - Path to analyze (default: current directory)
- `-o, --output <path>` - Output file path (default: docs/index.html)
- `-f, --format <format>` - Output format: html or json (default: html)
- `-r, --recursive` - Search recursively (default: true)
- `-v, --verbose` - Verbose output
- `-p, --provider <provider>` - AI provider: openai or gemini (if not specified, will prompt to choose)

## Interactive Mode

When you run `dbdoc generate` without specifying a provider, you'll be prompted to choose between:

- **OpenAI (GPT-4o-mini)** - Fast and reliable
- **Gemini (2.0 Flash)** - Google's latest model

This makes it easy to switch between providers without remembering command-line flags.

## What it detects

The CLI automatically detects files containing database operations like:

- Prisma queries (`prisma.user.findMany`, `prisma.post.create`, etc.)
- SQL queries (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, etc.)
- Database function calls
- Raw database operations

## Output

- **HTML format**: Interactive Swagger-like documentation with search, filtering, and "Try it out" functionality
- **JSON format**: Raw function specifications for integration with other tools

## Example

````bash
# Generate docs for your project
node dist/index.js generate

# Output: docs/index.html - Open in browser to view documentation
```bash
npm run install-global

````
