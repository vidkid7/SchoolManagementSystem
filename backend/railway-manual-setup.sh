#!/bin/bash
# Manual Railway Database Setup Script
# Run this from Railway shell if automatic setup fails

set -e

echo "🚀 Manual Railway Database Setup"
echo "=================================="
echo ""

# Check database connection
echo "1️⃣ Testing database connection..."
if npm run migrate:up > /dev/null 2>&1; then
  echo "✅ Database connection successful"
else
  echo "❌ Database connection failed!"
  echo "Please check your DATABASE_URL environment variable"
  exit 1
fi

# Run migrations
echo ""
echo "2️⃣ Running migrations..."
npm run migrate:up || echo "⚠️  Some migrations may have already been applied"

# Seed database
echo ""
echo "3️⃣ Seeding initial data..."
npm run seed || echo "⚠️  Some data may already exist"

# Seed roles and permissions
echo ""
echo "4️⃣ Setting up roles and permissions..."
npm run seed:roles || echo "⚠️  Roles may already exist"

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "No default demo credentials are created or displayed."
echo "Initialize the first administrator using the bootstrap-admin command and a one-time secret."
echo ""
