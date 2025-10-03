#!/bin/bash

echo "🚀 Installing DopeWars React..."
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "🎮 To start the game, run:"
    echo "   npm start"
    echo ""
    echo "🌐 The game will open at http://localhost:3000"
    echo ""
    echo "🎯 Game Controls:"
    echo "   - Buy/sell drugs in the market"
    echo "   - Travel between locations"
    echo "   - Visit banks, hospitals, gun shops"
    echo "   - Fight cops in combat"
    echo "   - Pay off your debt to win!"
    echo ""
    echo "Good luck on the streets! 💊"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
