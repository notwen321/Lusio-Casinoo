"use client";

import React, { useState } from "react";
import { Button } from "@heroui/react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useVideoPokerGame } from "@/hooks/useVideoPokerGame";
import Layout from "@/layout/layout";
import BettingModal from "@/components/BettingModal";
import Leaderboard from "@/components/Leaderboard";
import toast from "react-hot-toast";
import WalletProtection from "@/components/WalletProtection";

type Suit = "Hearts" | "Diamonds" | "Clubs" | "Spades";
type Card = { rank: string; suit: Suit } | undefined;

const suits = {
  Hearts: { color: "#e9113c", symbol: "♥" },
  Diamonds: { color: "#e9113c", symbol: "♦" },
  Clubs: { color: "#1a2c38", symbol: "♣" },
  Spades: { color: "#1a2c38", symbol: "♠" },
};

const payouts = [
  { id: "royal_flush", multiplier: 800, name: "Royal Flush" },
  { id: "straight_flush", multiplier: 60, name: "Straight Flush" },
  { id: "4_of_a_kind", multiplier: 22, name: "4 of a Kind" },
  { id: "full_house", multiplier: 9, name: "Full House" },
  { id: "flush", multiplier: 6, name: "Flush" },
  { id: "straight", multiplier: 4, name: "Straight" },
  { id: "3_of_a_kind", multiplier: 3, name: "3 of a Kind" },
  { id: "2_pair", multiplier: 2, name: "2 Pair" },
  { id: "pair", multiplier: 1, name: "Pair of Jacks" },
];

const VideoPoker = () => {
  const currentAccount = useCurrentAccount();
  const { dealCards, drawCards, isLoading, gameState } = useVideoPokerGame();

  const [holds, setHolds] = useState<number[]>([]);
  const [showBettingModal, setShowBettingModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [betAmount, setBetAmount] = useState(1);

  const handleStartGame = async (amount: number) => {
    try {
      setBetAmount(amount);
      await dealCards(amount);
      setShowBettingModal(false);
      setHolds([]);
      toast.success('Cards dealt!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to deal cards');
    }
  };

  const handleDraw = async () => {
    try {
      await drawCards(holds);
      setHolds([]);
      toast.success('Draw complete!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to draw');
    }
  };

  const handleHolder = (index: number) => {
    if (!gameState?.cards || gameState.phase !== "hold") return;
    setHolds(prev => 
      prev.includes(index) ? prev.filter(h => h !== index) : [...prev, index]
    );
  };

  const cards = gameState?.cards || Array(5).fill(undefined);
  const isHolding = gameState?.phase === "hold";
  const ranking = gameState?.result?.handRank || "";

  return (
    <WalletProtection>
    <Layout>
      <div className="flex w-full justify-center h-[calc(100vh-80px)] overflow-hidden p-2">
        <div className="w-full h-full flex flex-col gap-4 relative">
          {/* Payout Table */}
          <div className="bg-[#1a2c38] rounded-lg p-3">
            <div className="grid grid-cols-3 gap-2">
              {payouts.map((payout) => {
                const isWinning = payout.id === ranking;
                return (
                  <div
                    key={payout.id}
                    className={`px-3 py-2 rounded text-center ${
                      isWinning ? "bg-green-500 text-white" : "bg-[#0f212e] text-gray-400"
                    }`}
                  >
                    <div className="text-xs font-bold">{payout.name}</div>
                    <div className="text-sm">{payout.multiplier}x</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cards Display */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex gap-3 justify-center flex-wrap max-w-4xl">
              {cards.map((card, index) => {
                const isHold = holds.includes(index);
                const isWinning = gameState?.result?.winningCards.some(
                  (wc) => wc?.rank === card?.rank && wc?.suit === card?.suit
                );
                
                return (
                  <div
                    key={index}
                    onClick={() => handleHolder(index)}
                    className={`relative w-32 h-44 cursor-pointer transition-all ${
                      !card ? "opacity-50" : ""
                    }`}
                  >
                    <div
                      className={`w-full h-full bg-white rounded-lg shadow-lg flex flex-col items-center justify-center ${
                        isHold ? "ring-4 ring-cyan-500" : ""
                      } ${isWinning ? "ring-4 ring-green-500" : ""}`}
                    >
                      {card ? (
                        <>
                          <div
                            className="text-4xl font-bold"
                            style={{ color: suits[card.suit].color }}
                          >
                            {card.rank}
                          </div>
                          <div
                            className="text-5xl"
                            style={{ color: suits[card.suit].color }}
                          >
                            {suits[card.suit].symbol}
                          </div>
                        </>
                      ) : (
                        <div className="text-6xl text-gray-300">?</div>
                      )}
                    </div>
                    {isHold && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-cyan-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        HOLD
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Result Display */}
          {gameState?.result && (
            <div
              className={`p-4 rounded-lg text-center ${
                gameState.result.won
                  ? "bg-green-500/20 border border-green-500"
                  : "bg-red-500/20 border border-red-500"
              }`}
            >
              <div className="text-white">
                <div className="text-2xl font-bold">
                  {gameState.result.handRank.replace("_", " ").toUpperCase()}
                </div>
                <div className="text-xl">
                  {gameState.result.won
                    ? `Won ${gameState.result.payout * betAmount} OCT`
                    : "No Win"}
                </div>
              </div>
            </div>
          )}

          {/* Floating Action Buttons */}
          <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-20">
            <Button
              size="lg"
              onPress={() => setShowLeaderboard(true)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-lg h-14 rounded-xl shadow-lg"
            >
              🏆 Leaderboard
            </Button>

            {isHolding ? (
              <Button
                size="lg"
                onPress={handleDraw}
                isLoading={isLoading}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-xl h-16 rounded-xl shadow-lg"
              >
                🎴 DRAW
              </Button>
            ) : (
              <Button
                size="lg"
                onPress={() => setShowBettingModal(true)}
                disabled={isLoading}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-xl h-16 rounded-xl shadow-lg"
              >
                💰 DEAL
              </Button>
            )}
          </div>

          <BettingModal
            isOpen={showBettingModal}
            onClose={() => setShowBettingModal(false)}
            onStartGame={handleStartGame}
            gameType="videopoker"
            loading={isLoading}
          />

          <Leaderboard
            isOpen={showLeaderboard}
            onClose={() => setShowLeaderboard(false)}
            gameType="Video Poker"
          />
        </div>
      </div>
    </Layout>
    </WalletProtection>
  );
};

export default VideoPoker;
