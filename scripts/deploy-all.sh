#!/bin/bash

# ONE Chain Casino - Deploy All Contracts Script
# This script deploys all game contracts to ONE Chain testnet

set -e

echo "🎰 ONE Chain Casino - Deploying All Contracts"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if one CLI is installed
if ! command -v one &> /dev/null; then
    echo -e "${RED}❌ ONE Chain CLI not found!${NC}"
    echo "Please install it first:"
    echo "cargo install --locked --git https://github.com/one-chain-labs/onechain.git one_chain --features tracing"
    exit 1
fi

echo -e "${GREEN}✅ ONE Chain CLI found${NC}"
echo ""

# Check balance
echo "Checking your balance..."
one client gas
echo ""

read -p "Do you have enough gas to deploy? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please get testnet tokens first: one client faucet"
    exit 1
fi

# Deploy Crash Game
echo ""
echo -e "${BLUE}📦 Deploying Crash Game...${NC}"
cd move_contracts/crash
one move build
CRASH_OUTPUT=$(one client publish --gas-budget 100000000 --json)
CRASH_PACKAGE_ID=$(echo $CRASH_OUTPUT | jq -r '.objectChanges[] | select(.type == "published") | .packageId')
echo -e "${GREEN}✅ Crash Game deployed: $CRASH_PACKAGE_ID${NC}"
cd ../..

# Deploy Mines Game
echo ""
echo -e "${BLUE}📦 Deploying Mines Game...${NC}"
cd move_contracts/mines
one move build
MINES_OUTPUT=$(one client publish --gas-budget 100000000 --json)
MINES_PACKAGE_ID=$(echo $MINES_OUTPUT | jq -r '.objectChanges[] | select(.type == "published") | .packageId')
echo -e "${GREEN}✅ Mines Game deployed: $MINES_PACKAGE_ID${NC}"
cd ../..

# Deploy Slide Game
echo ""
echo -e "${BLUE}📦 Deploying Slide Game...${NC}"
cd move_contracts/slide
one move build
SLIDE_OUTPUT=$(one client publish --gas-budget 100000000 --json)
SLIDE_PACKAGE_ID=$(echo $SLIDE_OUTPUT | jq -r '.objectChanges[] | select(.type == "published") | .packageId')
echo -e "${GREEN}✅ Slide Game deployed: $SLIDE_PACKAGE_ID${NC}"
cd ../..

# Deploy Video Poker
echo ""
echo -e "${BLUE}📦 Deploying Video Poker...${NC}"
cd move_contracts/videopoker
one move build
POKER_OUTPUT=$(one client publish --gas-budget 100000000 --json)
POKER_PACKAGE_ID=$(echo $POKER_OUTPUT | jq -r '.objectChanges[] | select(.type == "published") | .packageId')
echo -e "${GREEN}✅ Video Poker deployed: $POKER_PACKAGE_ID${NC}"
cd ../..

# Create .env.local file
echo ""
echo -e "${BLUE}📝 Creating .env.local file...${NC}"
cat > .env.local << EOF
# ONE Chain Configuration
NEXT_PUBLIC_ONECHAIN_NETWORK=testnet

# Package IDs (deployed $(date))
NEXT_PUBLIC_CRASH_PACKAGE_ID=$CRASH_PACKAGE_ID
NEXT_PUBLIC_MINES_PACKAGE_ID=$MINES_PACKAGE_ID
NEXT_PUBLIC_SLIDE_PACKAGE_ID=$SLIDE_PACKAGE_ID
NEXT_PUBLIC_POKER_PACKAGE_ID=$POKER_PACKAGE_ID

# Shared Object IDs (update these manually after creating game objects)
NEXT_PUBLIC_CRASH_GAME_ID=
NEXT_PUBLIC_MINES_TREASURY_ID=
NEXT_PUBLIC_SLIDE_ROUND_ID=
NEXT_PUBLIC_POKER_TREASURY_ID=

# RPC Endpoints
NEXT_PUBLIC_TESTNET_RPC=https://rpc-testnet.onelabs.cc:443
EOF

echo -e "${GREEN}✅ .env.local created${NC}"
echo ""

# Summary
echo ""
echo "=============================================="
echo -e "${GREEN}🎉 All Contracts Deployed Successfully!${NC}"
echo "=============================================="
echo ""
echo "Package IDs:"
echo "  Crash:       $CRASH_PACKAGE_ID"
echo "  Mines:       $MINES_PACKAGE_ID"
echo "  Slide:       $SLIDE_PACKAGE_ID"
echo "  Video Poker: $POKER_PACKAGE_ID"
echo ""
echo "Next steps:"
echo "1. Create game objects (see README_ONECHAIN_MIGRATION.md)"
echo "2. Update shared object IDs in .env.local"
echo "3. Run: npm run dev"
echo ""
echo "Happy gaming! 🎰"
