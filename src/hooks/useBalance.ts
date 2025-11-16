import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';

export function useBalance() {
  const currentAccount = useCurrentAccount();
  const client = useSuiClient();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentAccount?.address) {
      setBalance('0');
      return;
    }

    const fetchBalance = async () => {
      setLoading(true);
      try {
        const balanceData = await client.getBalance({
          owner: currentAccount.address,
        });
        
        // Convert from MIST to OCT (1 OCT = 1,000,000,000 MIST)
        const octBalance = (parseInt(balanceData.totalBalance) / 1_000_000_000).toFixed(2);
        setBalance(octBalance);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance('0');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    
    // Refresh balance every 10 seconds
    const interval = setInterval(fetchBalance, 10000);
    
    return () => clearInterval(interval);
  }, [currentAccount, client]);

  return { balance, loading };
}
