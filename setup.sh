#!/bin/bash
set -e

if [ ! -d "divhacks-2025" ]; then
  git clone https://github.com/alfardil/divhacks-2025.git
fi

cd divhacks-2025

echo "Setting up Dagger CLI..."
chmod +x dagger.sh
./dagger.sh

echo "Setup complete! You can now run:"
echo "dagger generate test"