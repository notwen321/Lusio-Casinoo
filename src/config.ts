// ONE Chain Configuration
export const ONECHAIN_CONFIG = {
  network: process.env.NEXT_PUBLIC_ONECHAIN_NETWORK || 'testnet',
  
  // RPC Endpoints
  rpc: {
    testnet: 'https://rpc-testnet.onelabs.cc:443',
    devnet: 'https://rpc-devnet.onelabs.cc:443',
    mainnet: 'https://rpc-mainnet.onelabs.cc:443',
  },
  
  // Package IDs (update after deployment)
  packages: {
    crash: process.env.NEXT_PUBLIC_CRASH_PACKAGE_ID || '',
    mines: process.env.NEXT_PUBLIC_MINES_PACKAGE_ID || '',
    slide: process.env.NEXT_PUBLIC_SLIDE_PACKAGE_ID || '',
    videopoker: process.env.NEXT_PUBLIC_POKER_PACKAGE_ID || '',
  },
  
  // Shared Object IDs (update after deployment)
  objects: {
    crashGame: process.env.NEXT_PUBLIC_CRASH_GAME_ID || '',
    minesTreasury: process.env.NEXT_PUBLIC_MINES_TREASURY_ID || '',
    slideRound: process.env.NEXT_PUBLIC_SLIDE_ROUND_ID || '',
    pokerTreasury: process.env.NEXT_PUBLIC_POKER_TREASURY_ID || '',
  },
  
  // OCT Token Configuration
  oct: {
    // OCT is the native token on ONE Chain
    // 1 OCT = 1,000,000,000 MIST (smallest unit)
    decimals: 9,
    symbol: 'OCT',
    name: 'ONE Chain Token',
    type: '0x2::oct::OCT', // OCT coin type
  },
};

// Helper to get current RPC URL
export const getRpcUrl = () => {
  const network = ONECHAIN_CONFIG.network as keyof typeof ONECHAIN_CONFIG.rpc;
  return ONECHAIN_CONFIG.rpc[network];
};

// Helper to convert OCT to MIST
export const octToMist = (oct: number): number => {
  return Math.floor(oct * Math.pow(10, ONECHAIN_CONFIG.oct.decimals));
};

// Helper to convert MIST to OCT
export const mistToOct = (mist: number): number => {
  return mist / Math.pow(10, ONECHAIN_CONFIG.oct.decimals);
};

// Deprecated: Old backend API URL (kept for backwards compatibility)
// Backend is removed - all logic is now on ONE Chain blockchain
export const API_URL = '';
