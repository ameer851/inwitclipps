# setup-trendsync.ps1
# Quick setup script for TrendSync feature (PowerShell)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TrendSync Setup — InwitClipps" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Navigate to backend
Set-Location $PSScriptRoot

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install axios node-cron

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Check environment variables
Write-Host ""
Write-Host "🔑 Checking environment variables..." -ForegroundColor Yellow

if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
        }
    }
    
    # Check required
    if (-not $env:ANTHROPIC_API_KEY) {
        Write-Host "⚠️  ANTHROPIC_API_KEY not set (required for AI worker)" -ForegroundColor Yellow
    } else {
        Write-Host "✓ ANTHROPIC_API_KEY set" -ForegroundColor Green
    }
    
    # Check optional TrendSync keys
    if (-not $env:APIFY_API_KEY) {
        Write-Host "⚠️  APIFY_API_KEY not set (TikTok trends will be skipped)" -ForegroundColor Yellow
        Write-Host "   Get one at: https://console.apify.com/account/integrations" -ForegroundColor Gray
    } else {
        Write-Host "✓ APIFY_API_KEY set" -ForegroundColor Green
    }
    
    if (-not $env:TWITTER_BEARER_TOKEN) {
        Write-Host "⚠️  TWITTER_BEARER_TOKEN not set (X trends will use fallback)" -ForegroundColor Yellow
        Write-Host "   Get one at: https://developer.twitter.com/en/portal/dashboard" -ForegroundColor Gray
    } else {
        Write-Host "✓ TWITTER_BEARER_TOKEN set" -ForegroundColor Green
    }
    
    if (-not $env:YOUTUBE_API_KEY) {
        Write-Host "ℹ️  YOUTUBE_API_KEY not set (RSS fallback will be used)" -ForegroundColor Cyan
        Write-Host "   Optional — get one at: https://console.cloud.google.com/apis/credentials" -ForegroundColor Gray
    } else {
        Write-Host "✓ YOUTUBE_API_KEY set" -ForegroundColor Green
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "   Copy .env.example to .env and fill in your API keys" -ForegroundColor Yellow
    exit 1
}

# Database check
Write-Host ""
Write-Host "🗄️  Checking database..." -ForegroundColor Yellow

try {
    $dbCheck = Start-Job -ScriptBlock { npm run db:studio -- --port 4983 }
    Start-Sleep -Seconds 2
    
    if ($dbCheck.State -eq 'Running') {
        Write-Host "✓ Database connection OK" -ForegroundColor Green
        Stop-Job -Job $dbCheck
        Remove-Job -Job $dbCheck
    }
} catch {
    Write-Host "⚠️  Could not verify database (this may be normal)" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Setup Complete! 🎉" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host ""
Write-Host "1. Start the server:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "2. Trigger manual TrendSync:" -ForegroundColor Yellow
Write-Host '   curl -X POST http://localhost:3001/api/v1/trends/sync \' -ForegroundColor White
Write-Host '     -H "Authorization: Bearer YOUR_SUPABASE_JWT"' -ForegroundColor White
Write-Host ""
Write-Host "3. View fetched trends:" -ForegroundColor Yellow
Write-Host "   curl http://localhost:3001/api/v1/trends" -ForegroundColor White
Write-Host ""
Write-Host "4. Submit a test video job and watch the TrendSync magic!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Documentation: docs\TRENDSYNC.md" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
