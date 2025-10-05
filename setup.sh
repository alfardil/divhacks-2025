#!/bin/bash
set -e

# Print banner
echo ""
echo "██████╗  █████╗  ██████╗  ███████╗ ███████╗ ██████╗ "
echo "██╔══██╗██╔══██╗██╔════╝  ██╔════╝ ██╔════╝██╔═══██╗"
echo "██║  ██║███████║██║  ███╗ ██║  ███╗█████╗  ███║████║"
echo "██║  ██║██╔══██║██║   ██║ ██║   ██║██╔══╝  ██║    ██ "
echo "██████╔╝██║  ██║╚██████╔╝ ███████╗ ███████╗██     ██╔╝"
echo "╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚══════╝ ╚══════╝ ╚═════╝ "
echo ""

if [ ! -d "divhacks-2025" ]; then
  echo "📦 Cloning repository..."
  git clone https://github.com/alfardil/divhacks-2025.git
else
  echo "📁 Repository already exists. Skipping clone."
fi

cd divhacks-2025

echo "⚙️  Setting up Dagger CLI..."
chmod +x dagger.sh
./dagger.sh

echo ""
echo "✅ Setup complete!"
echo "You can now run:"
echo "👉 dagger generate test"