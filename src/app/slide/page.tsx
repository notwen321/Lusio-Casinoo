"use client";

import React, { useState } from "react";
import { Button } from "@heroui/react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useSlideGame } from "@/hooks/useSlideGame";
import Slider, { findTile } from "@/components/Slider";
import Layout from "@/layout/layout";
import BettingModal from "@/components/BettingModal";
import Leaderboard from "@/components/Leaderboard";
import toast from "react-hot-toast";
import WalletProtection from "@/components/WalletProtection";

const SlideGame = () => {
  const currentAccount = useCurrentAccount();
  const { placeBet, loading, history, roundState } = useSlideGame();

  const [showBettingModal, setShowBettingModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleStartGame = async (betAmount: number, config: any) => {
    try {
      await placeBet(betAmount, config.targetMultiplier);
      setShowBettingModal(false);
      toast.success('Bet placed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to place bet');
    }
  };

  return (
    <WalletProtection>
    <Layout>
      <div className="h-[calc(100vh-80px)] overflow-hidden p-2">
        <div className="flex h-full gap-2">
          <div className="flex-1 flex items-center justify-center bg-[#0f212e] rounded-lg relative">
            <div className="relative h-full w-full flex items-center justify-center">
              {/* History */}
              <div className="absolute top-4 left-4 flex gap-2 flex-wrap max-w-md z-10">
                {(history || []).slice(0, 10).map((h: any, index: number) => (
                  <Button
                    key={index}
                    size="sm"
                    className="px-2 py-1 text-xs font-bold"
                    style={{
                      background: findTile(h.resultMultiplier).color,
                      color: findTile(h.resultMultiplier).text,
                    }}
                  >
                    {h.resultMultiplier}x
                  </Button>
                ))}
              </div>

              {/* Slider Display */}
              <div className="w-full h-full flex items-center">
                <Slider
                  multiplier={roundState?.resultMultiplier || 1}
                  elapsedTime={5}
                  numbers={[]}
                />
              </div>

              {/* Floating Action Buttons */}
              <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-20">
                <Button
                  size="lg"
                  onPress={() => setShowLeaderboard(true)}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-lg h-14 rounded-xl shadow-lg"
                >
                  🏆 Leaderboard
                </Button>

                <Button
                  size="lg"
                  onPress={() => setShowBettingModal(true)}
                  disabled={loading}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-xl h-16 rounded-xl shadow-lg"
                >
                  💰 PLACE BET
                </Button>
              </div>

              <div className="absolute z-10 top-0 left-0 w-full h-full" style={{ background: "linear-gradient(90deg,#071824,transparent,#071824)" }} />
            </div>
          </div>
        </div>

        <BettingModal
          isOpen={showBettingModal}
          onClose={() => setShowBettingModal(false)}
          onStartGame={handleStartGame}
          gameType="slide"
          loading={loading}
        />

        <Leaderboard
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
          gameType="Slide"
        />
      </div>
    </Layout>
    </WalletProtection>
  );
};

export default SlideGame;
