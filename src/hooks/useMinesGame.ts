import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { SuiEvent } from '@mysten/sui/client';

// ONE Chain Configuration
const MINES_PACKAGE_ID = process.env.NEXT_PUBLIC_MINES_PACKAGE_ID || '';
const MINES_TREASURY_ID = process.env.NEXT_PUBLIC_MINES_TREASURY_ID || '';

interface MineGame {
  gameId: string;
  betAmount: number;
  mineCount: number;
  revealedPoints: number[];
  currentMultiplier: number;
  status: number; // 0=READY, 1=LIVE
}

export function useMinesGame() {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [currentGame, setCurrentGame] = useState<MineGame | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealedTiles, setRevealedTiles] = useState<{ point: number; isMine: boolean }[]>([]);

  // Poll for game events
  const pollGameEvents = useCallback(async () => {
    if (!MINES_PACKAGE_ID || !currentAccount) return;
    
    try {
      const events = await client.queryEvents({
        query: {
          MoveModule: {
            package: MINES_PACKAGE_ID,
            module: 'mines_game'
          }
        },
        limit: 50,
        order: 'descending'
      });
      
      events.data.forEach((event: SuiEvent) => {
        const eventType = event.type.split('::').pop();
        const data = event.parsedJson as any;
        
        // Only process events for current user
        if (data.player !== currentAccount.address) return;
        
        switch (eventType) {
          case 'GameCreated':
            setCurrentGame({
              gameId: data.game_id,
              betAmount: data.bet_amount / 1_000_000_000,
              mineCount: data.mine_count,
              revealedPoints: [],
              currentMultiplier: 100,
              status: 1,
            });
            setRevealedTiles([]);
            break;
            
          case 'TileRevealed':
            setRevealedTiles(prev => [...prev, {
              point: data.point,
              isMine: data.is_mine,
            }]);
            
            if (!data.is_mine) {
              setCurrentGame(prev => prev ? {
                ...prev,
                currentMultiplier: data.multiplier,
                revealedPoints: [...prev.revealedPoints, data.point],
              } : null);
            } else {
              // Hit mine - game over
              setCurrentGame(null);
            }
            break;
            
          case 'GameCashedOut':
          case 'GameEnded':
            setCurrentGame(null);
            break;
        }
      });
    } catch (error) {
      console.error('Error polling events:', error);
    }
  }, [client, currentAccount, MINES_PACKAGE_ID]);

  useEffect(() => {
    const interval = setInterval(pollGameEvents, 1000);
    pollGameEvents();
    return () => clearInterval(interval);
  }, [pollGameEvents]);

  // Create new game
  const createGame = useCallback(async (betAmount: number, mineCount: number) => {
    if (!currentAccount) throw new Error('Wallet not connected');
    if (!MINES_TREASURY_ID || !MINES_PACKAGE_ID) throw new Error('Game not deployed');
    
    setLoading(true);
    
    try {
      const tx = new Transaction() as any;
      const amountInMist = Math.floor(betAmount * 1_000_000_000);
      
      // Generate random mine positions (client-side for demo)
      const minePositions: number[] = [];
      while (minePositions.length < mineCount) {
        const pos = Math.floor(Math.random() * 25);
        if (!minePositions.includes(pos)) {
          minePositions.push(pos);
        }
      }
      
      const [coin] = tx.splitCoins(tx.gas, [amountInMist]);
      
      tx.moveCall({
        target: `${MINES_PACKAGE_ID}::mines_game::create_game`,
        arguments: [
          tx.object(MINES_TREASURY_ID),
          coin,
          tx.pure.u8(mineCount),
          tx.pure(minePositions, 'vector<u8>'),
        ],
      });
      
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('✅ Game created:', result);
            setLoading(false);
          },
          onError: (error) => {
            console.error('❌ Error creating game:', error);
            alert('Failed to create game: ' + error.message);
            setLoading(false);
          },
        }
      );
    } catch (error: any) {
      console.error('❌ Error:', error);
      alert('Failed: ' + error.message);
      setLoading(false);
    }
  }, [currentAccount, signAndExecute, MINES_TREASURY_ID, MINES_PACKAGE_ID]);

  // Reveal tile
  const revealTile = useCallback(async (gameObjectId: string, point: number) => {
    if (!currentAccount) throw new Error('Wallet not connected');
    if (!MINES_TREASURY_ID || !MINES_PACKAGE_ID) throw new Error('Game not deployed');
    
    setLoading(true);
    
    try {
      const tx = new Transaction() as any;
      
      tx.moveCall({
        target: `${MINES_PACKAGE_ID}::mines_game::reveal_tile`,
        arguments: [
          tx.object(MINES_TREASURY_ID),
          tx.object(gameObjectId),
          tx.pure.u8(point),
        ],
      });
      
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('✅ Tile revealed:', result);
            setLoading(false);
          },
          onError: (error) => {
            console.error('❌ Error revealing tile:', error);
            alert('Failed to reveal tile: ' + error.message);
            setLoading(false);
          },
        }
      );
    } catch (error: any) {
      console.error('❌ Error:', error);
      alert('Failed: ' + error.message);
      setLoading(false);
    }
  }, [currentAccount, signAndExecute, MINES_TREASURY_ID, MINES_PACKAGE_ID]);

  // Cashout
  const cashout = useCallback(async (gameObjectId: string) => {
    if (!currentAccount) throw new Error('Wallet not connected');
    if (!MINES_TREASURY_ID || !MINES_PACKAGE_ID) throw new Error('Game not deployed');
    
    setLoading(true);
    
    try {
      const tx = new Transaction() as any;
      
      tx.moveCall({
        target: `${MINES_PACKAGE_ID}::mines_game::cashout`,
        arguments: [
          tx.object(MINES_TREASURY_ID),
          tx.object(gameObjectId),
        ],
      });
      
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('✅ Cashed out:', result);
            setLoading(false);
          },
          onError: (error) => {
            console.error('❌ Error cashing out:', error);
            alert('Failed to cash out: ' + error.message);
            setLoading(false);
          },
        }
      );
    } catch (error: any) {
      console.error('❌ Error:', error);
      alert('Failed: ' + error.message);
      setLoading(false);
    }
  }, [currentAccount, signAndExecute, MINES_TREASURY_ID, MINES_PACKAGE_ID]);

  return {
    currentGame,
    loading,
    revealedTiles,
    createGame,
    revealTile,
    cashout,
  };
}
