"use client"

import React, { useState } from "react";
import { Button } from "@heroui/react";
import { useCrashGame } from "@/hooks/useCrashGame";
import Layout from "@/layout/layout";
import BettingModal from "@/components/BettingModal";
import TransactionHistory from "@/components/TransactionHistory";
import FlyingAnimation from "@/components/FlyingAnimation";
import toast from "react-hot-toast";
import WalletProtection from "@/components/WalletProtection";

const CrashGame = () => {
    const { 
        playerGame, 
        currentMultiplier, 
        isFlying, 
        loading, 
        history,
        placeBet, 
        startFlying, 
        cashout 
    } = useCrashGame();

    const [showBettingModal, setShowBettingModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Handle bet from modal
    const handlePlaceBet = async (amount: number) => {
        try {
            await placeBet(amount);
            setShowBettingModal(false);
            toast.success('Bet placed! Click START FLY to begin!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to place bet');
        }
    };

    // Handle start flying (no transaction needed)
    const handleStartFly = () => {
        try {
            startFlying();
            toast.success('Plane is flying! 🚀');
        } catch (error: any) {
            toast.error(error.message || 'Failed to start');
        }
    };

    // Handle cashout
    const handleCashout = async () => {
        try {
            await cashout();
            const payout = ((playerGame?.betAmount || 0) * currentMultiplier) / 100;
            toast.success(`Landed safely! Won ${payout.toFixed(2)} OCT! 💰`);
        } catch (error: any) {
            toast.error(error.message || 'Cashout failed');
        }
    };

    return (
        <WalletProtection>
        <Layout>
            <div className="w-full h-[calc(100vh-80px)] overflow-hidden relative">
                <div className="w-full bg-gradient-to-b from-[#1a1f3a] via-[#0f1729] to-[#0a0e1a] h-full flex justify-center">
                    <div className="w-full h-full relative">
                        
                        {/* Game Canvas */}
                        <div className="w-full h-full relative overflow-hidden">
                            
                            {/* Game History */}
                            <div className="absolute top-4 z-10 left-5 max-w-[70%]">
                                <div className="flex space-x-2 items-center">
                                    {history.slice(0, 8).map((item: any, key: number) => (
                                        <div
                                            key={key}
                                            className={`animate-zoomIn cursor-pointer px-3 py-1.5 rounded-lg font-bold text-sm backdrop-blur-md border ${
                                                item.won
                                                    ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                                                    : 'bg-red-500/20 border-red-500/50 text-red-400'
                                            }`}
                                        >
                                            {item.multiplier.toFixed(2)}x
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Current Multiplier Display */}
                            {isFlying && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                    <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 animate-pulse drop-shadow-2xl">
                                        {(currentMultiplier / 100).toFixed(2)}x
                                    </div>
                                </div>
                            )}

                            {/* Waiting for bet message */}
                            {!playerGame && !isFlying && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center">
                                    <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-pulse drop-shadow-2xl">
                                        PLACE YOUR BET!
                                    </div>
                                </div>
                            )}

                            {/* Bet placed, waiting to fly */}
                            {playerGame && !isFlying && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center">
                                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 animate-pulse drop-shadow-2xl">
                                        READY TO FLY!
                                    </div>
                                    <div className="text-2xl text-white/80 mt-4">
                                        Bet: {playerGame.betAmount} OCT | Crash at: {(playerGame.crashPoint / 100).toFixed(2)}x
                                    </div>
                                </div>
                            )}

                            {/* Flying Animation */}
                            <FlyingAnimation
                                isFlying={isFlying}
                                multiplier={currentMultiplier}
                                crashPoint={playerGame?.crashPoint || 200}
                            />

                            {/* Floating Action Buttons */}
                            <div className="absolute bottom-8 right-8 flex flex-col gap-4 z-20">
                                
                                {/* Transaction History Button */}
                                <Button
                                    size="lg"
                                    onPress={() => setShowHistory(true)}
                                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white font-bold text-lg h-14 rounded-2xl shadow-2xl border-2 border-pink-400/50 hover:scale-105 transition-transform"
                                >
                                    📊 HISTORY
                                </Button>

                                {/* Place Bet Button - Show when no active game */}
                                {!playerGame && (
                                    <Button
                                        size="lg"
                                        onPress={() => setShowBettingModal(true)}
                                        disabled={loading}
                                        className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white font-bold text-xl h-20 rounded-2xl shadow-2xl border-2 border-green-400/50 hover:scale-105 transition-transform disabled:opacity-50"
                                    >
                                        💰 PLACE BET
                                    </Button>
                                )}

                                {/* Start Fly Button - Show after bet placed */}
                                {playerGame && !isFlying && (
                                    <Button
                                        size="lg"
                                        onPress={handleStartFly}
                                        isLoading={loading}
                                        className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 text-white font-black text-2xl h-24 rounded-2xl shadow-2xl border-4 border-cyan-400 animate-pulse hover:animate-none hover:scale-110 transition-all"
                                    >
                                        🚀 START FLY!
                                    </Button>
                                )}

                                {/* Land Plane (Cash Out) Button - Show while flying */}
                                {isFlying && (
                                    <Button
                                        size="lg"
                                        onPress={handleCashout}
                                        disabled={loading}
                                        className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 text-white font-black text-2xl h-24 rounded-2xl shadow-2xl border-4 border-yellow-400 animate-pulse hover:animate-none hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? '⏳ LANDING...' : '🛬 LAND PLANE!'}
                                    </Button>
                                )}

                            </div>
                        </div>

                        {/* Betting Modal */}
                        <BettingModal
                            isOpen={showBettingModal}
                            onClose={() => setShowBettingModal(false)}
                            onStartGame={handlePlaceBet}
                            gameType="crash"
                            loading={loading}
                        />

                        {/* Transaction History Modal */}
                        {showHistory && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-3xl font-bold text-white">Game History</h2>
                                        <button
                                            onClick={() => setShowHistory(false)}
                                            className="text-white/60 hover:text-white text-2xl"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    
                                    {history.length === 0 ? (
                                        <div className="text-center text-white/60 py-12">
                                            No games played yet
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {history.map((game, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`p-4 rounded-xl border-2 ${
                                                        game.won
                                                            ? 'bg-green-500/10 border-green-500/30'
                                                            : 'bg-red-500/10 border-red-500/30'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <div className={`text-2xl font-bold ${
                                                                game.won ? 'text-green-400' : 'text-red-400'
                                                            }`}>
                                                                {game.multiplier.toFixed(2)}x
                                                            </div>
                                                            <div className="text-white/60 text-sm">
                                                                {new Date(game.timestamp).toLocaleTimeString()}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`text-xl font-bold ${
                                                                game.won ? 'text-green-400' : 'text-red-400'
                                                            }`}>
                                                                {game.won ? '+' : ''}{game.payout.toFixed(2)} OCT
                                                            </div>
                                                            <div className="text-white/60 text-sm">
                                                                {game.won ? 'Won' : 'Lost'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
        </WalletProtection>
    );
};

export default CrashGame;
