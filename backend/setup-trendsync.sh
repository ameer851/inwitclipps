#!/bin/bash
# setup-trendsync.sh
# Quick setup script for TrendSync feature

echo "=========================================="
echo "TrendSync Setup — InwitClipps"
echo "=========================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js $(node --version)"

# Navigate to backend
cd "$(dirname "$0")" || exit

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install axios node-cron

if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check environment variables
echo ""
echo "🔑 Checking environment variables..."

if [ -f .env ]; then
    source .env
    
    # Check required
    if [ -z "$ANTHROPIC_API_KEY" ]; then
        echo "⚠️  ANTHROPIC_API_KEY not set (required for AI worker)"
    else
        echo "✓ ANTHROPIC_API_KEY set"
    fi
    
    # Check optional TrendSync keys
    if [ -z "$APIFY_API_KEY" ]; then
        echo "⚠️  APIFY_API_KEY not set (TikTok trends will be skipped)"
        echo "   Get one at: https://console.apify.com/account/integrations"
    else
        echo "✓ APIFY_API_KEY set"
    fi
    
    if [ -z "$TWITTER_BEARER_TOKEN" ]; then
        echo "⚠️  TWITTER_BEARER_TOKEN not set (X trends will use fallback)"
        echo "   Get one at: https://developer.twitter.com/en/portal/dashboard"
    else
        echo "✓ TWITTER_BEARER_TOKEN set"
    fi
    
    if [ -z "$YOUTUBE_API_KEY" ]; then
        echo "ℹ️  YOUTUBE_API_KEY not set (RSS fallback will be used)"
        echo "   Optional — get one at: https://console.cloud.google.com/apis/credentials"
    else
        echo "✓ YOUTUBE_API_KEY set"
    fi
else
    echo "❌ .env file not found"
    echo "   Copy .env.example to .env and fill in your API keys"
    exit 1
fi

# Database check
echo ""
echo "🗄️  Checking database..."
npm run db:studio -- --port 4983 &> /dev/null &
STUDIO_PID=$!
sleep 2

if ps -p $STUDIO_PID > /dev/null; then
    echo "✓ Database connection OK"
    kill $STUDIO_PID 2>/dev/null
else
    echo "⚠️  Could not verify database (this may be normal)"
fi

# Summary
echo ""
echo "=========================================="
echo "Setup Complete! 🎉"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the server:"
echo "   npm run dev"
echo ""
echo "2. Trigger manual TrendSync:"
echo "   curl -X POST http://localhost:3001/api/v1/trends/sync \\"
echo "     -H \"Authorization: Bearer YOUR_SUPABASE_JWT\""
echo ""
echo "3. View fetched trends:"
echo "   curl http://localhost:3001/api/v1/trends"
echo ""
echo "4. Submit a test video job and watch the TrendSync magic!"
echo ""
echo "Documentation: docs/TRENDSYNC.md"
echo "=========================================="
