"use client";

import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, Button, Input, Slider } from "@heroui/react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { OctSvg } from "./svgs";

interface BettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (betAmount: number, gameConfig?: any) => void;
  gameType: "crash" | "mines" | "slide" | "videopoker";
  loading?: boolean;
}

export default function BettingModal({ isOpen, onClose, onStartGame, gameType, loading }: BettingModalProps) {
  const currentAccount = useCurrentAccount();
  const [betAmount, setBetAmount] = useState("1.0");
  const [mineCount, setMineCount] = useState(5);
  const [targetMultiplier, setTargetMultiplier] = useState("2.0");

  const handleStartGame = () => {
    const amount = parseFloat(betAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid bet amount!");
      return;
    }

    let config: any = {};
    
    if (gameType === "mines") {
      config.mineCount = mineCount;
    } else if (gameType === "crash" || gameType === "slide") {
      config.targetMultiplier = parseFloat(targetMultiplier);
    }

    onStartGame(amount, config);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="md"
      classNames={{
        base: "bg-[#1a1a1a] border border-cyan-500",
        header: "border-b border-[#2f4553]",
        body: "py-6",
        closeButton: "hover:bg-white/5 active:bg-white/10",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-white text-xl font-bold uppercase">
            {gameType === "crash" && "🚀 Crash Game"}
            {gameType === "mines" && "💣 Mines Game"}
            {gameType === "slide" && "🎰 Slide Game"}
            {gameType === "videopoker" && "🃏 Video Poker"}
          </h2>
        </ModalHeader>
        <ModalBody>
          {/* Wallet Status */}
          {currentAccount ? (
            <div className="bg-cyan-500/20 border border-cyan-500 rounded-lg p-3 text-center mb-4">
              <p className="text-cyan-400 text-sm font-mono truncate">
                {currentAccount.address.slice(0, 12)}...{currentAccount.address.slice(-8)}
              </p>
            </div>
          ) : (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-center mb-4">
              <p className="text-red-400 font-bold">Please Connect Wallet</p>
            </div>
          )}

          {/* Bet Amount */}
          <div className="space-y-2 mb-4">
            <label className="text-white text-sm font-bold">BET AMOUNT (OCT)</label>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="1.0"
              size="lg"
              classNames={{
                input: "text-white font-bold text-xl",
                inputWrapper: "bg-[#0f212e] border-2 border-[#2f4553] h-14",
              }}
              endContent={
                <div className="flex items-center gap-2">
                  <OctSvg className="w-5 h-5" />
                  <span className="text-cyan-400 font-bold">OCT</span>
                </div>
              }
            />
            <div className="grid grid-cols-4 gap-2">
              <Button size="sm" onPress={() => setBetAmount("0.5")} className="bg-[#2f4553] text-white h-10">
                0.5
              </Button>
              <Button size="sm" onPress={() => setBetAmount("1.0")} className="bg-[#2f4553] text-white h-10">
                1.0
              </Button>
              <Button size="sm" onPress={() => setBetAmount("5.0")} className="bg-[#2f4553] text-white h-10">
                5.0
              </Button>
              <Button size="sm" onPress={() => setBetAmount("10")} className="bg-[#2f4553] text-white h-10">
                10
              </Button>
            </div>
          </div>

          {/* Game-specific settings */}
          {gameType === "mines" && (
            <div className="space-y-2 mb-4">
              <label className="text-white text-sm font-bold">MINES: {mineCount}</label>
              <Slider
                size="lg"
                step={1}
                minValue={1}
                maxValue={24}
                value={mineCount}
                onChange={(value) => setMineCount(value as number)}
                classNames={{
                  track: "bg-[#2f4553] h-2",
                  filler: "bg-cyan-500",
                  thumb: "w-6 h-6 bg-cyan-500",
                }}
              />
            </div>
          )}

          {(gameType === "crash" || gameType === "slide") && (
            <div className="space-y-2 mb-4">
              <label className="text-white text-sm font-bold">AUTO CASHOUT AT</label>
              <Input
                type="number"
                value={targetMultiplier}
                onChange={(e) => setTargetMultiplier(e.target.value)}
                placeholder="2.0"
                step="0.1"
                size="lg"
                classNames={{
                  input: "text-white font-bold text-xl",
                  inputWrapper: "bg-[#0f212e] border-2 border-[#2f4553] h-14",
                }}
                endContent={<span className="text-cyan-400 font-bold text-xl">x</span>}
              />
            </div>
          )}

          {/* Start Game Button */}
          <Button
            size="lg"
            onPress={handleStartGame}
            disabled={!currentAccount || loading}
            isLoading={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-xl h-16 rounded-xl uppercase"
          >
            {loading ? "Starting..." : "START GAME"}
          </Button>

          {/* Info */}
          <div className="mt-4 p-3 bg-[#0f212e] rounded-lg">
            <p className="text-gray-400 text-xs text-center">
              🔒 All bets are real blockchain transactions on ONE Chain
            </p>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
