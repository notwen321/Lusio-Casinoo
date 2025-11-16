"use client"

import React, { useState } from "react";
import { Button } from "@heroui/react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useMinesGame } from "@/hooks/useMinesGame";
import Layout from "@/layout/layout";
import BettingModal from "@/components/BettingModal";
import Leaderboard from "@/components/Leaderboard";
import toast from "react-hot-toast";
import WalletProtection from "@/components/WalletProtection";

const MineGame = () => {
    const currentAccount = useCurrentAccount();
    const { currentGame, loading, revealedTiles, createGame, revealTile, cashout } = useMinesGame();

    const [mineCount, setMineCount] = useState<number>(3);
    const [showBettingModal, setShowBettingModal] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const handleStartGame = async (betAmount: number, config: any) => {
        try {
            setMineCount(config.mineCount);
            await createGame(betAmount, config.mineCount);
            setShowBettingModal(false);
            toast.success('Game started! Click tiles to reveal.');
        } catch (error: any) {
            toast.error(error.message || 'Failed to start game');
        }
    };

    const handleTileClick = async (point: number) => {
        if (!currentGame || loading) return;
        if (revealedTiles.some(t => t.point === point)) return;

        try {
            await revealTile(currentGame.gameId, point);
            const revealed = revealedTiles.find(t => t.point === point);
            if (revealed?.isMine) {
                toast.error('💣 Hit a mine! Game over.');
            } else {
                toast.success('💎 Safe! Keep going or cash out.');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to reveal tile');
        }
    };

    const handleCashout = async () => {
        if (!currentGame) return;

        try {
            await cashout(currentGame.gameId);
            toast.success('💰 Cashed out successfully!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to cashout');
        }
    };

    const getTileState = (point: number) => {
        const revealed = revealedTiles.find(t => t.point === point);
        if (revealed) {
            return revealed.isMine ? 'mine' : 'safe';
        }
        return 'hidden';
    };

    return (
        <WalletProtection>
        <Layout>
            <div className="flex w-full justify-center h-[calc(100vh-80px)] overflow-hidden relative">
                <div className="w-full bg-[#10100f] h-full flex justify-center p-2">
                    <div className="w-full h-full relative">
                        <div className="flex items-center w-full justify-center h-full">
                            <div className="max-w-[600px] w-full">
                                <div className="grid grid-cols-5 gap-2 p-2 bg-[#1a1a1a] rounded-lg">
                                    {[...Array(25)].map((_, index) => {
                                        const state = getTileState(index);
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handleTileClick(index)}
                                                disabled={!currentGame || loading || state !== 'hidden'}
                                                className={`
                                                    aspect-square rounded-lg flex items-center justify-center text-2xl font-bold
                                                    transition-all duration-300 transform hover:scale-105
                                                    ${state === 'hidden' ? 'bg-[#2f4553] hover:bg-[#3f5563] cursor-pointer' : ''}
                                                    ${state === 'safe' ? 'bg-green-500 text-white' : ''}
                                                    ${state === 'mine' ? 'bg-red-500 text-white' : ''}
                                                    ${!currentGame || loading ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                {state === 'safe' && '💎'}
                                                {state === 'mine' && '💣'}
                                                {state === 'hidden' && '?'}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-20">
                                <Button
                                    size="lg"
                                    onPress={() => setShowLeaderboard(true)}
                                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-lg h-14 rounded-xl shadow-lg"
                                >
                                    🏆 Leaderboard
                                </Button>

                                {!currentGame ? (
                                    <Button
                                        size="lg"
                                        onPress={() => setShowBettingModal(true)}
                                        disabled={loading}
                                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-xl h-16 rounded-xl shadow-lg"
                                    >
                                        💰 START GAME
                                    </Button>
                                ) : (
                                    <Button
                                        size="lg"
                                        onPress={handleCashout}
                                        isLoading={loading}
                                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-xl h-16 rounded-xl shadow-lg"
                                    >
                                        💸 CASH OUT
                                    </Button>
                                )}
                            </div>
                        </div>

                        <BettingModal
                            isOpen={showBettingModal}
                            onClose={() => setShowBettingModal(false)}
                            onStartGame={handleStartGame}
                            gameType="mines"
                            loading={loading}
                        />

                        <Leaderboard
                            isOpen={showLeaderboard}
                            onClose={() => setShowLeaderboard(false)}
                            gameType="Mines"
                        />
                    </div>
                </div>
            </div>
        </Layout>
        </WalletProtection>
    );
};

export default MineGame;
