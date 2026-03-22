#!/usr/bin/env bash
set -e

# Install backend dependencies
pip install -r backend/requirements.txt

# Install frontend dependencies & build
cd frontend
npm install
npm run build

# Copy build output to backend/static
rm -rf ../backend/static
cp -r dist ../backend/static

echo "✅ Build complete — frontend copied to backend/static"
