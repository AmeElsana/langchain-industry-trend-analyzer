#!/bin/bash

set -e

echo "🧪 EnQue Test Suite"
echo "========================"

RUN_BACKEND=false
RUN_FRONTEND=false
RUN_E2E=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend)
            RUN_BACKEND=true
            shift
            ;;
        --frontend)
            RUN_FRONTEND=true
            shift
            ;;
        --e2e)
            RUN_E2E=true
            shift
            ;;
        --all)
            RUN_BACKEND=true
            RUN_FRONTEND=true
            RUN_E2E=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--backend] [--frontend] [--e2e] [--all]"
            exit 1
            ;;
    esac
done

if [ "$RUN_BACKEND" = false ] && [ "$RUN_FRONTEND" = false ] && [ "$RUN_E2E" = false ]; then
    echo "No test suite specified. Running all tests..."
    RUN_BACKEND=true
    RUN_FRONTEND=true
    RUN_E2E=true
fi

if [ "$RUN_BACKEND" = true ]; then
    echo ""
    echo "🐍 Running backend validation..."
    cd backend
    if [ -d "venv" ]; then
        source venv/bin/activate
    fi

    echo "Checking Python syntax..."
    python -m py_compile app/*.py
    echo "✅ Backend validation passed"
    cd ..
fi

if [ "$RUN_FRONTEND" = true ]; then
    echo ""
    echo "⚛️  Running frontend tests..."
    cd frontend

    echo "Running TypeScript type check..."
    npx tsc --noEmit

    echo "Building frontend..."
    npm run build

    echo "✅ Frontend tests passed"
    cd ..
fi

if [ "$RUN_E2E" = true ]; then
    echo ""
    echo "🌐 Running Cypress E2E tests..."
    cd frontend

    echo "Note: Make sure backend and frontend servers are running"
    echo "Backend: http://localhost:8000"
    echo "Frontend: http://localhost:5173"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to cancel..."

    npm run test

    echo "✅ E2E tests completed"
    cd ..
fi

echo ""
echo "✅ All tests completed successfully!"
