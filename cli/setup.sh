#!/bin/bash

echo "Setting up Dagger CLI..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building project..."
npm run build

# Test file discovery
echo "Testing file discovery..."
npm run test

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set your OpenAI API key:"
echo "   export OPENAI_API_KEY=\"your-api-key-here\""
echo ""
echo "2. Generate documentation:"
echo "   node dist/index.js generate"
echo ""
echo "3. (Optional) Install globally:"
echo "   npm run install-global"
echo "   # Then you can use: dagger generate"
echo ""

