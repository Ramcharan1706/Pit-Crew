#!/bin/bash
# Comprehensive Deployment Readiness Verification Script
# Run this before deploying to verify all requirements are met

echo "════════════════════════════════════════════════════════════"
echo "     PITCREW PRODUCTION DEPLOYMENT READINESS CHECK"
echo "════════════════════════════════════════════════════════════"
echo ""

PASS=0
FAIL=0

check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
        ((PASS++))
    else
        echo "❌ $1 - FILE NOT FOUND"
        ((FAIL++))
    fi
}

check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo "✅ $1 contains: $2"
        ((PASS++))
    else
        echo "❌ $1 missing: $2"
        ((FAIL++))
    fi
}

echo "1. DOCUMENTATION FILES"
echo "─────────────────────────────────────────────────────────────"
check_file "DEPLOYMENT.md"
check_file "PRODUCTION_CHECKLIST.md"
check_file "ENV_VARS.md"
check_file "PRODUCTION_READY.md"
check_file "README.md"
echo ""

echo "2. BACKEND CONFIGURATION"
echo "─────────────────────────────────────────────────────────────"
check_file "projects/Pitcrew-backend/render.yaml"
check_file "projects/Pitcrew-backend/tsconfig.json"
check_file "projects/Pitcrew-backend/package.json"
check_file "projects/Pitcrew-backend/.env.example"
check_file "projects/Pitcrew-backend/prisma/schema.prisma"
echo ""

echo "3. FRONTEND CONFIGURATION"
echo "─────────────────────────────────────────────────────────────"
check_file "projects/Pitcrew-frontend/vercel.json"
check_file "projects/Pitcrew-frontend/tsconfig.json"
check_file "projects/Pitcrew-frontend/package.json"
check_file "projects/Pitcrew-frontend/.env.production"
check_file "projects/Pitcrew-frontend/.env.development"
echo ""

echo "4. BUILD SCRIPTS VERIFICATION"
echo "─────────────────────────────────────────────────────────────"
check_content "projects/Pitcrew-backend/package.json" '"build":'
check_content "projects/Pitcrew-backend/package.json" '"start":'
check_content "projects/Pitcrew-frontend/package.json" '"build":'
echo ""

echo "5. DATABASE CONFIGURATION"
echo "─────────────────────────────────────────────────────────────"
check_file "projects/Pitcrew-backend/prisma/migrations"
check_content "projects/Pitcrew-backend/render.yaml" "postgresql"
check_content "projects/Pitcrew-backend/render.yaml" "databases:"
echo ""

echo "6. ENVIRONMENT VARIABLES"
echo "─────────────────────────────────────────────────────────────"
check_content "projects/Pitcrew-backend/render.yaml" "NODE_ENV"
check_content "projects/Pitcrew-backend/render.yaml" "ALLOWED_ORIGINS"
check_content "projects/Pitcrew-frontend/.env.production" "VITE_BACKEND_URL"
echo ""

echo "7. GIT REPOSITORY"
echo "─────────────────────────────────────────────────────────────"
if [ -d ".git" ]; then
    echo "✅ Git repository initialized"
    ((PASS++))
else
    echo "❌ Git repository not found"
    ((FAIL++))
fi

if git rev-parse --verify HEAD > /dev/null 2>&1; then
    echo "✅ Git commits exist"
    ((PASS++))
else
    echo "❌ No git commits found"
    ((FAIL++))
fi
echo ""

echo "8. SECURITY CHECK"
echo "─────────────────────────────────────────────────────────────"
if grep -r "DATABASE_URL" .git/config 2>/dev/null; then
    echo "❌ WARNING: Database credentials may be in git"
    ((FAIL++))
else
    echo "✅ No credentials exposed in git config"
    ((PASS++))
fi

if [ -f ".gitignore" ] && grep -q "\.env" ".gitignore"; then
    echo "✅ .env files are in .gitignore"
    ((PASS++))
else
    echo "❌ .env files may not be properly ignored"
    ((FAIL++))
fi
echo ""

echo "════════════════════════════════════════════════════════════"
echo "RESULTS: ✅ $PASS PASSED  |  ❌ $FAIL FAILED"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 ALL CHECKS PASSED - READY FOR DEPLOYMENT!"
    echo ""
    echo "Next steps:"
    echo "1. Review DEPLOYMENT.md"
    echo "2. Complete PRODUCTION_CHECKLIST.md"
    echo "3. Deploy to Render (backend)"
    echo "4. Deploy to Vercel (frontend)"
    echo "5. Monitor services"
    exit 0
else
    echo "⚠️  SOME CHECKS FAILED - REVIEW ABOVE"
    exit 1
fi
