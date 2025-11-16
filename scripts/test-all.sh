#!/bin/bash

# ONE Chain Casino - Test All Contracts Script

set -e

echo "🧪 Testing All Smart Contracts"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Test Crash Game
echo -e "${BLUE}Testing Crash Game...${NC}"
cd move_contracts/crash
one move test
echo -e "${GREEN}✅ Crash Game tests passed${NC}"
echo ""
cd ../..

# Test Mines Game
echo -e "${BLUE}Testing Mines Game...${NC}"
cd move_contracts/mines
one move test
echo -e "${GREEN}✅ Mines Game tests passed${NC}"
echo ""
cd ../..

# Test Slide Game
echo -e "${BLUE}Testing Slide Game...${NC}"
cd move_contracts/slide
one move test
echo -e "${GREEN}✅ Slide Game tests passed${NC}"
echo ""
cd ../..

# Test Video Poker
echo -e "${BLUE}Testing Video Poker...${NC}"
cd move_contracts/videopoker
one move test
echo -e "${GREEN}✅ Video Poker tests passed${NC}"
echo ""
cd ../..

echo ""
echo "=============================="
echo -e "${GREEN}🎉 All Tests Passed!${NC}"
echo "=============================="
