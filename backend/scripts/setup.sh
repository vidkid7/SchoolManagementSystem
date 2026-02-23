#!/bin/bash

# School Management System - Backend Setup Script
# This script helps set up the development environment

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   🏫 School Management System - Backend Setup             ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18 or higher is required${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi
echo -e "${GREEN}✅ Node.js version OK: $(node -v)${NC}"
echo ""

# Check npm version
echo "📦 Checking npm version..."
NPM_VERSION=$(npm -v | cut -d'.' -f1)
if [ "$NPM_VERSION" -lt 9 ]; then
    echo -e "${RED}❌ npm 9 or higher is required${NC}"
    echo "Current version: $(npm -v)"
    exit 1
fi
echo -e "${GREEN}✅ npm version OK: $(npm -v)${NC}"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Setup .env file
if [ ! -f .env ]; then
    echo "⚙️  Setting up environment file..."
    cp .env.example .env
    
    # Generate secrets
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    # Update .env with generated secrets
    sed -i.bak "s/your_super_secret_jwt_key_min_32_chars_here_change_this_in_production/$JWT_SECRET/" .env
    sed -i.bak "s/your_refresh_token_secret_min_32_chars_change_this_in_production/$JWT_REFRESH_SECRET/" .env
    sed -i.bak "s/0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef/$ENCRYPTION_KEY/" .env
    sed -i.bak "s/your_session_secret_key_here_change_this_in_production/$SESSION_SECRET/" .env
    
    rm .env.bak 2>/dev/null || true
    
    echo -e "${GREEN}✅ Environment file created with secure secrets${NC}"
    echo -e "${YELLOW}⚠️  Please update database credentials in .env${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists, skipping...${NC}"
fi
echo ""

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs uploads backups
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Check MySQL
echo "🗄️  Checking MySQL..."
if command -v mysql &> /dev/null; then
    echo -e "${GREEN}✅ MySQL is installed${NC}"
    echo -e "${YELLOW}⚠️  Make sure to create the database:${NC}"
    echo "   mysql -u root -p"
    echo "   CREATE DATABASE school_management_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
else
    echo -e "${YELLOW}⚠️  MySQL not found. Please install MySQL 8.0+${NC}"
fi
echo ""

# Check Redis
echo "💾 Checking Redis..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✅ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis is installed but not running${NC}"
        echo "   Start with: sudo systemctl start redis-server"
    fi
else
    echo -e "${YELLOW}⚠️  Redis not found (optional but recommended)${NC}"
    echo "   Install with: sudo apt-get install redis-server"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   ✅ Setup Complete!                                       ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Update database credentials in .env"
echo "2. Create MySQL database (see command above)"
echo "3. Run: npm run dev"
echo ""
echo "For more information, see README.md"
echo ""
