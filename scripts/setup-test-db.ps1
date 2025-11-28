#!/usr/bin/env pwsh

# Test Database Setup Script
# Run this once to set up your test database

Write-Host "🔧 Setting up test database..." -ForegroundColor Cyan

# Load test environment
if (Test-Path .env.test) {
    Get-Content .env.test | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Host "⚠️  .env.test not found. Copy .env.test.example and configure it first." -ForegroundColor Yellow
    exit 1
}

# Check if DATABASE_URL_TEST is set
if (-not $env:DATABASE_URL_TEST) {
    Write-Host "❌ DATABASE_URL_TEST not set in .env.test" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "🗃️  Running migrations on test database..." -ForegroundColor Yellow
$env:DATABASE_URL = $env:DATABASE_URL_TEST
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Test database ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Run tests with:" -ForegroundColor Cyan
    Write-Host "  npm test" -ForegroundColor White
} else {
    Write-Host "❌ Migration failed. Check your DATABASE_URL_TEST configuration." -ForegroundColor Red
    exit 1
}
