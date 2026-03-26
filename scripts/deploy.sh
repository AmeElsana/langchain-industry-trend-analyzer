#!/bin/bash

set -e

echo "🚀 EnQur Deployment Script"
echo "================================"

check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "❌ Error: $1 is not installed"
        exit 1
    fi
}

echo "📋 Checking prerequisites..."
check_command node
check_command npm
check_command python3

if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with required variables"
    exit 1
fi

echo "✅ Prerequisites check passed"

echo ""
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt
echo "✅ Backend dependencies installed"
cd ..

echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
echo "✅ Frontend dependencies installed"

echo ""
echo "🏗️  Building frontend..."
npm run build
echo "✅ Frontend built successfully"
cd ..

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "  1. Start backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "  2. Start frontend: cd frontend && npm run dev"
echo "  3. Run tests: cd frontend && npm test"
