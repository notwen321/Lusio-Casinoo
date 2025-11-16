"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, Button } from "@heroui/react";
import { useSuiClient } from "@mysten/dapp-kit";
import { useEffect, useState } from "react";

interface Transaction {
  player: string;
  amount: number;
  profit: number;
  multiplier: number;
  timestamp: number;
  won: boolean;
}

interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  gameType: string;
  packageId: string;
  moduleName: string;
}

export default function TransactionHistory({ 
  isOpen, 
  onClose, 
  gameType,
  packageId,
  moduleName 
}: TransactionHistoryProps) {
  const client = useSuiClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && packageId) {
      fetchTransactions();
    }
  }, [isOpen, packageId]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Fetch real events from blockchain
      const events = await client.queryEvents({
        query: {
          MoveModule: {
            package: packageId,
            module: moduleName
          }
        },
        limit: 50,
        order: 'descending'
      });

      const txs: Transaction[] = [];
      
      events.data.forEach((event: any) => {
        const eventType = event.type.split('::').pop();
        const data = event.parsedJson;

        // Process different event types
        if (eventType === 'PlayerCashedOut') {
          txs.push({
            player: data.player,
            amount: data.bet_amount / 1_000_000_000,
            profit: (data.payout - data.bet_amount) / 1_000_000_000,
            multiplier: data.multiplier / 100,
            timestamp: event.timestampMs,
            won: true,
          });
        } else if (eventType === 'GameCrashed') {
          // Players who didn't cash out lost
          // This would need more complex logic to track individual losses
        }
      });

      setTransactions(txs);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
    setLoading(false);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-gradient-to-b from-gray-900 to-black border border-cyan-500/30",
        header: "border-b border-cyan-500/30",
        body: "py-6",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-white">
            📊 {gameType} Transaction History
          </h2>
          <p className="text-sm text-gray-400">Real blockchain transactions</p>
        </ModalHeader>
        <ModalBody>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-cyan-400">Loading transactions...</div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No transactions yet. Be the first to play!
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    tx.won
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm font-mono">
                          {tx.player.slice(0, 6)}...{tx.player.slice(-4)}
                        </span>
                        {tx.won && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                            {tx.multiplier.toFixed(2)}x
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(tx.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        tx.profit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {tx.profit >= 0 ? '+' : ''}{tx.profit.toFixed(2)} OCT
                      </div>
                      <div className="text-xs text-gray-400">
                        Bet: {tx.amount.toFixed(2)} OCT
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <Button
            onPress={onClose}
            className="w-full mt-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold"
          >
            Close
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
