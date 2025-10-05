# Dagger - Database Documentation Generator

Frontend deployed on [https://divhacks-2025.vercel.app/](https://divhacks-2025.vercel.app/)
Backend deployed on [https://backend-green-thunder-5490.fly.dev/](https://backend-green-thunder-5490.fly.dev/)

Run the cli with the following instructions.

```bash
curl -fsSL https://raw.githubusercontent.com/alfardil/divhacks-2025/main/setup.sh | bash
```

Then export your preferred AI model.
For example:

`export GEMINI_API_KEY=123456789`

Then use the CLI:

```bash
dagger generate test
```

## CLI Usage

```bash
# Generate docs for current directory
dagger generate
```

```bash
# Generate docs for specific file
dagger generate functions.ts
```

```bash
# Specify output location
dagger generate -o docs/my-docs.html
```

```bash
# Generate JSON format
dagger generate -f json -o functions.json
```

```bash

# Verbose output
dagger generate -v
```

## License

MIT
