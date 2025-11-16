import { useState, useCallback, useEffect } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction as SuiTransaction } from '@mysten/sui/transactions';

const GAME_STATES = {
  Betting: 1,
  Flying: 2,
  Crashed: 3,
};

interface PlayerGame {
  gameId: string;
  betAmount: number;
  crashPoint: number;
  status: number;
  startTime: number;
}

export function useCrashGame() {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [playerGame, setPlayerGame] = useState<PlayerGame | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState(100);
  const [isFlying, setIsFlying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const CRASH_PACKAGE_ID = process.env.NEXT_PUBLIC_CRASH_PACKAGE_ID;
  const CRASH_GAME_ID = process.env.NEXT_PUBLIC_CRASH_GAME_ID;
  const CLOCK_ID = '0x0000000000000000000000000000000000000000000000000000000000000006';

  // Place bet - creates a new game session
  const placeBet = useCallback(async (amount: number) => {
    if (!currentAccount || !CRASH_PACKAGE_ID || !CRASH_GAME_ID) {
      throw new Error('Wallet not connected or game not deployed');
    }
    
    setLoading(true);
    
    try {
      const tx = new SuiTransaction() as any;
      const betAmount = Math.floor(amount * 1_000_000_000);
      
      const [coin] = tx.splitCoins(tx.gas, [betAmount]);
      
      tx.moveCall({
        target: `${CRASH_PACKAGE_ID}::crash_game::place_bet`,
        arguments: [
          tx.object(CRASH_GAME_ID),
          coin,
          tx.object(CLOCK_ID),
        ],
      });
      
      const result = await new Promise<any>((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (data: any) => resolve(data),
            onError: (error: any) => reject(error),
          }
        );
      });
      
      console.log('✅ Bet placed! Digest:', result.digest);
      console.log('📦 Full result:', result);
      
      // Wait a bit for blockchain to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Query for objects owned by player
      const ownedObjects = await client.getOwnedObjects({
        owner: currentAccount.address,
        options: {
          showType: true,
          showContent: true,
        },
      });
      
      console.log('🔍 Owned objects:', ownedObjects);
      
      // Find the PlayerGame object
      const gameObject = ownedObjects.data.find((obj: any) => {
        const type = obj.data?.type || '';
        return type.includes('PlayerGame');
      });
      
      if (gameObject && gameObject.data?.objectId) {
        const gameId = gameObject.data.objectId;
        const fields = (gameObject.data?.content as any)?.fields;
        
        console.log('🎮 Game found:', gameId);
        console.log('📊 Game fields:', fields);
        
        if (fields) {
          setPlayerGame({
            gameId,
            betAmount: parseInt(fields.bet_amount) / 1_000_000_000,
            crashPoint: parseInt(fields.crash_point),
            status: parseInt(fields.status),
            startTime: parseInt(fields.start_time),
          });
          console.log('🎲 Crash point:', parseInt(fields.crash_point) / 100);
        }
      } else {
        console.error('❌ PlayerGame object not found!');
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('❌ Error:', error);
      setLoading(false);
      throw error;
    }
  }, [currentAccount, signAndExecute, CRASH_PACKAGE_ID, CRASH_GAME_ID, client]);

  // Start flying - NO TRANSACTION NEEDED (client-side only)
  const startFlying = useCallback(() => {
    if (!playerGame) {
      throw new Error('No active game');
    }
    
    console.log('🚀 Flight started!');
    setIsFlying(true);
    setCurrentMultiplier(100);
  }, [playerGame]);

  // Cash out - player lands the plane
  const cashout = useCallback(async () => {
    if (!playerGame || !CRASH_PACKAGE_ID || !CRASH_GAME_ID) {
      throw new Error('No active game');
    }
    
    setLoading(true);
    
    try {
      const tx = new SuiTransaction() as any;
      
      tx.moveCall({
        target: `${CRASH_PACKAGE_ID}::crash_game::cashout`,
        arguments: [
          tx.object(CRASH_GAME_ID),
          tx.object(playerGame.gameId),
          tx.pure.u64(currentMultiplier),
          tx.object(CLOCK_ID),
        ],
      });
      
      const result = await new Promise<any>((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (data: any) => resolve(data),
            onError: (error: any) => reject(error),
          }
        );
      });
      
      console.log('✅ Cashed out! Digest:', result.digest);
      const payout = (playerGame.betAmount * currentMultiplier) / 100;
      console.log('💰 Payout:', payout, 'OCT');
      
      setIsFlying(false);
      setPlayerGame(null);
      setLoading(false);
      
      // Add to history
      setHistory(prev => [{
        multiplier: currentMultiplier / 100,
        payout,
        timestamp: Date.now(),
        won: true,
      }, ...prev.slice(0, 9)]);
    } catch (error: any) {
      console.error('❌ Error:', error);
      setLoading(false);
      throw error;
    }
  }, [playerGame, currentMultiplier, signAndExecute, CRASH_PACKAGE_ID, CRASH_GAME_ID]);

  // Simulate multiplier increase when flying
  useEffect(() => {
    if (!isFlying || !playerGame) return;
    
    console.log('🎲 Game started! Crash point:', playerGame.crashPoint / 100);
    
    const interval = setInterval(() => {
      setCurrentMultiplier(prev => {
        const newMultiplier = prev + 1; // Increase by 0.01x every 100ms
        
        // Check if crashed
        if (newMultiplier >= playerGame.crashPoint) {
          console.log('💥 CRASHED at', newMultiplier / 100);
          console.log('❌ You lost! Money stays in pool.');
          
          setIsFlying(false);
          
          // Add to history (loss)
          setHistory(prevHistory => [{
            multiplier: playerGame.crashPoint / 100,
            payout: 0,
            timestamp: Date.now(),
            won: false,
          }, ...prevHistory.slice(0, 9)]);
          
          // Clear game state
          setPlayerGame(null);
          
          // Show crash message
          setTimeout(() => {
            alert(`💥 CRASHED at ${(playerGame.crashPoint / 100).toFixed(2)}x! You lost ${playerGame.betAmount} OCT`);
          }, 500);
          
          return playerGame.crashPoint;
        }
        
        return newMultiplier;
      });
    }, 100); // Update every 100ms
    
    return () => clearInterval(interval);
  }, [isFlying, playerGame, CRASH_PACKAGE_ID, CLOCK_ID, signAndExecute]);

  return {
    playerGame,
    currentMultiplier,
    isFlying,
    loading,
    history,
    placeBet,
    startFlying,
    cashout,
    GAME_STATES,
  };
}
