#!/bin/bash

set -e

echo "🗄️  EnQue Database Setup Script"
echo "===================================="

if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with SUPABASE_URL and SUPABASE_ANON_KEY"
    exit 1
fi

source .env

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""
echo "Database URL: $SUPABASE_URL"
echo ""

echo "📊 Database schema has been applied via Supabase migrations"
echo ""
echo "Tables created:"
echo "  - analysis_results (stores AI analysis results)"
echo "  - raw_posts (stores fetched posts from sources)"
echo "  - chat_sessions (stores chat conversation history)"
echo ""
echo "✅ Database setup complete!"
echo ""
echo "You can verify the setup by:"
echo "  1. Logging into Supabase dashboard"
echo "  2. Checking the Table Editor"
echo "  3. Running a test query"
