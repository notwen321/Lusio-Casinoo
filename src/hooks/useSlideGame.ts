import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { SuiEvent } from '@mysten/sui/client';

const SLIDE_PACKAGE_ID = process.env.NEXT_PUBLIC_SLIDE_PACKAGE_ID || '';
const SLIDE_ROUND_ID = process.env.NEXT_PUBLIC_SLIDE_ROUND_ID || '';

interface RoundState {
  roundId: number;
  status: number; // 0=WAITING, 1=BETTING, 2=PLAYING
  resultMultiplier: number;
}

interface PlayerBet {
  betId: string;
  amount: number;
  targetMultiplier: number;
  won: boolean;
  payout: number;
}

export function useSlideGame() {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [roundState, setRoundState] = useState<RoundState>({
    roundId: 0,
    status: 0,
    resultMultiplier: 0,
  });
  
  const [playerBet, setPlayerBet] = useState<PlayerBet | null>(null);
  const [loading, setLoading] = useState(false);
  const [allBets, setAllBets] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // Poll for round events
  const pollRoundEvents = useCallback(async () => {
    if (!SLIDE_PACKAGE_ID) return;
    
    try {
      const events = await client.queryEvents({
        query: {
          MoveModule: {
            package: SLIDE_PACKAGE_ID,
            module: 'slide_game'
          }
        },
        limit: 50,
        order: 'descending'
      });
      
      events.data.forEach((event: SuiEvent) => {
        const eventType = event.type.split('::').pop();
        const data = event.parsedJson as any;
        
        switch (eventType) {
          case 'BettingPhase':
            setRoundState(prev => ({
              ...prev,
              roundId: data.round_id,
              status: 1,
            }));
            setAllBets([]);
            break;
            
          case 'RoundPlaying':
            setRoundState(prev => ({
              ...prev,
              status: 2,
              resultMultiplier: data.result_multiplier,
            }));
            
            // Add to history
            setHistory(prev => [
              {
                roundId: data.round_id,
                resultMultiplier: data.result_multiplier / 100,
              },
              ...prev.slice(0, 9)
            ]);
            break;
            
          case 'BetPlaced':
            setAllBets(prev => [...prev, {
              player: data.player,
              amount: data.bet_amount / 1_000_000_000,
              targetMultiplier: data.target_multiplier / 100,
            }]);
            
            if (data.player === currentAccount?.address) {
              setPlayerBet({
                betId: '',
                amount: data.bet_amount / 1_000_000_000,
                targetMultiplier: data.target_multiplier,
                won: false,
                payout: 0,
              });
            }
            break;
            
          case 'BetResult':
            if (data.player === currentAccount?.address) {
              setPlayerBet(prev => prev ? {
                ...prev,
                won: data.won,
                payout: data.payout / 1_000_000_000,
              } : null);
            }
            break;
        }
      });
    } catch (error) {
      console.error('Error polling events:', error);
    }
  }, [client, currentAccount, SLIDE_PACKAGE_ID]);

  useEffect(() => {
    const interval = setInterval(pollRoundEvents, 1000);
    pollRoundEvents();
    return () => clearInterval(interval);
  }, [pollRoundEvents]);

  // Place bet
  const placeBet = useCallback(async (betAmount: number, targetMultiplier: number) => {
    if (!currentAccount) throw new Error('Wallet not connected');
    if (!SLIDE_ROUND_ID || !SLIDE_PACKAGE_ID) throw new Error('Game not deployed');
    
    setLoading(true);
    
    try {
      const tx = new Transaction() as any;
      const amountInMist = Math.floor(betAmount * 1_000_000_000);
      
      const [coin] = tx.splitCoins(tx.gas, [amountInMist]);
      
      tx.moveCall({
        target: `${SLIDE_PACKAGE_ID}::slide_game::place_bet`,
        arguments: [
          tx.object(SLIDE_ROUND_ID),
          coin,
          tx.pure.u64(targetMultiplier),
        ],
      });
      
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('✅ Bet placed:', result);
            setLoading(false);
          },
          onError: (error) => {
            console.error('❌ Error placing bet:', error);
            alert('Failed to place bet: ' + error.message);
            setLoading(false);
          },
        }
      );
    } catch (error: any) {
      console.error('❌ Error:', error);
      alert('Failed: ' + error.message);
      setLoading(false);
    }
  }, [currentAccount, signAndExecute, SLIDE_ROUND_ID, SLIDE_PACKAGE_ID]);

  return {
    roundState,
    playerBet,
    loading,
    allBets,
    history,
    placeBet,
  };
}
