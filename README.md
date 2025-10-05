# DB Doc Generator

```bash
dbdoc generate test
```

A powerful tool for generating Swagger-like documentation for database functions. Available as both a web interface and CLI tool.

## Features

- 🔍 **Automatic Detection**: Scans your codebase for database functions
- 📚 **Swagger-like UI**: Beautiful, interactive documentation interface
- 🧪 **Try it Out**: Test functions directly from the documentation
- 🎯 **Multi-format Support**: Generate HTML or JSON documentation
- ⚡ **CLI Tool**: Generate docs from command line
- 🌐 **Web Interface**: Upload files and generate docs in browser

## Quick Start

### Web Interface

1. Start the development server:

   ```bash
   just dev
   ```

2. Open http://localhost:3000/dbdoc

3. Upload your database functions file and generate documentation

### CLI Tool

1. Set up the CLI:

   ```bash
   cd cli
   ./setup.sh
   ```

2. Set your OpenAI API key:

   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

3. Generate documentation:

   ```bash
   # From project root
   node cli/dist/index.js generate

   # Or install globally and use anywhere
   npm run install-global
   dbdoc generate
   ```

## CLI Usage

```bash
# Generate docs for current directory
dbdoc generate

# Generate docs for specific file
dbdoc generate functions.ts

# Specify output location
dbdoc generate -o docs/my-docs.html

# Generate JSON format
dbdoc generate -f json -o functions.json

# Verbose output
dbdoc generate -v
```

## What it Detects

The tool automatically detects database operations including:

- **Prisma Queries**: `prisma.user.findMany`, `prisma.post.create`, etc.
- **SQL Queries**: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, etc.
- **Database Functions**: Custom database function calls
- **Raw Operations**: Direct database interactions

## Example Output

The generated documentation includes:

- 📊 **Statistics Dashboard**: Function counts by engine type
- 🔍 **Search & Filter**: Find functions quickly
- 📝 **Detailed Documentation**: Parameters, return types, descriptions
- 🧪 **Interactive Testing**: Try functions with real parameters
- 🎨 **Beautiful UI**: Swagger-inspired design

## Project Structure

```
├── js/                    # Next.js web interface
│   ├── app/
│   │   ├── api/dbdoc/    # API endpoints
│   │   └── dbdoc/        # Web UI
│   └── components/       # React components
├── cli/                   # Command-line tool
│   ├── src/              # TypeScript source
│   └── dist/             # Compiled JavaScript
├── backend/               # Python backend (optional)
└── functions.ts          # Example database functions
```

## Development

### Web Interface

```bash
cd js
pnpm install
pnpm run dev
```

### CLI Tool

```bash
cd cli
npm install
npm run build
npm run test
```

## Environment Variables

- `OPENAI_API_KEY`: Required for AI-powered function analysis

## License

MIT
