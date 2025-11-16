"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, Button } from "@heroui/react";

interface LeaderboardEntry {
  rank: number;
  player: string;
  score: number;
  profit: number;
  games: number;
}

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  gameType: string;
}

export default function Leaderboard({ isOpen, onClose, gameType }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, gameType]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    
    // Simulate fetching from blockchain
    // In production, query blockchain events and calculate scores
    setTimeout(() => {
      const mockData: LeaderboardEntry[] = [
        { rank: 1, player: "0xc466ea...a8c742", score: 15420, profit: 245.5, games: 89 },
        { rank: 2, player: "0x7a3b2c...d4e5f6", score: 12350, profit: 198.2, games: 76 },
        { rank: 3, player: "0x9f8e7d...c6b5a4", score: 10890, profit: 167.8, games: 65 },
        { rank: 4, player: "0x4d3c2b...a1f0e9", score: 9560, profit: 142.3, games: 58 },
        { rank: 5, player: "0x8e7f6d...b5c4a3", score: 8340, profit: 125.6, games: 52 },
        { rank: 6, player: "0x2b1a0f...e9d8c7", score: 7120, profit: 98.4, games: 47 },
        { rank: 7, player: "0x6c5d4e...f3a2b1", score: 6450, profit: 87.2, games: 43 },
        { rank: 8, player: "0x1f0e9d...c8b7a6", score: 5890, profit: 76.5, games: 39 },
        { rank: 9, player: "0x5e4d3c...b2a1f0", score: 5230, profit: 65.8, games: 35 },
        { rank: 10, player: "0x9d8c7b...a6f5e4", score: 4670, profit: 54.3, games: 31 },
      ];
      
      setLeaderboard(mockData);
      setLoading(false);
    }, 500);
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-[#1a1a1a] border border-cyan-500",
        header: "border-b border-[#2f4553]",
        body: "py-4",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-white text-2xl font-bold uppercase">
            🏆 Leaderboard - {gameType}
          </h2>
          <p className="text-gray-400 text-sm">Top players on ONE Chain</p>
        </ModalHeader>
        <ModalBody>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-5 gap-2 px-4 py-2 text-gray-400 text-xs font-bold uppercase">
                <div>Rank</div>
                <div className="col-span-2">Player</div>
                <div className="text-right">Profit</div>
                <div className="text-right">Games</div>
              </div>

              {/* Leaderboard Entries */}
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`grid grid-cols-5 gap-2 px-4 py-3 rounded-lg transition-all hover:scale-[1.02] ${
                    entry.rank <= 3
                      ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50"
                      : "bg-[#0f212e] hover:bg-[#1a2c38]"
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-white font-bold text-lg">
                      {getMedalEmoji(entry.rank)}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-white font-mono text-sm truncate">
                      {entry.player}
                    </span>
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="text-green-400 font-bold">
                      +{entry.profit} OCT
                    </span>
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="text-gray-400 text-sm">
                      {entry.games}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Refresh Button */}
          <Button
            onPress={fetchLeaderboard}
            className="w-full mt-4 bg-[#2f4553] hover:bg-[#3f5563] text-white font-bold"
            isLoading={loading}
          >
            🔄 Refresh Leaderboard
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
