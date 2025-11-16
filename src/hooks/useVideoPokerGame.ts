import { useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

type Card = {
  rank: string;
  suit: string;
};

type GameState = {
  cards: Card[];
  phase: "deal" | "hold" | "complete";
  result?: {
    handRank: string;
    won: boolean;
    payout: number;
    winningCards: Card[];
  };
};

export const useVideoPokerGame = () => {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [isLoading, setIsLoading] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const dealCards = async (betAmount: number) => {
    if (!currentAccount?.address) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    try {
      const tx = new Transaction();
      
      // Call the video poker deal function on the smart contract
      tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::videopoker_game::deal`,
        arguments: [
          tx.pure.u64(Math.floor(betAmount * 1_000_000_000)), // Convert to MIST
        ],
      });

      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      console.log("Deal transaction result:", result);

      // Simulate card dealing (in production, parse from blockchain events)
      const mockCards = generateRandomCards(5);
      setGameState({
        cards: mockCards,
        phase: "hold",
      });

      return result;
    } catch (error) {
      console.error("Error dealing cards:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const drawCards = async (holdIndexes: number[]) => {
    if (!currentAccount?.address || !gameState) {
      throw new Error("Invalid game state");
    }

    setIsLoading(true);
    try {
      const tx = new Transaction();
      
      // Call the video poker draw function on the smart contract
      tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::videopoker_game::draw`,
        arguments: [
          tx.pure.vector("u8", holdIndexes),
        ],
      });

      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      console.log("Draw transaction result:", result);

      // Replace non-held cards
      const newCards = gameState.cards.map((card, index) => 
        holdIndexes.includes(index) ? card : generateRandomCards(1)[0]
      );

      // Evaluate hand
      const handResult = evaluateHand(newCards);

      setGameState({
        cards: newCards,
        phase: "complete",
        result: handResult,
      });

      return result;
    } catch (error) {
      console.error("Error drawing cards:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    dealCards,
    drawCards,
    isLoading,
    gameState,
  };
};

// Helper functions
const SUITS = ["Hearts", "Diamonds", "Clubs", "Spades"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

function generateRandomCards(count: number): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    cards.push({
      rank: RANKS[Math.floor(Math.random() * RANKS.length)],
      suit: SUITS[Math.floor(Math.random() * SUITS.length)],
    });
  }
  return cards;
}

function evaluateHand(cards: Card[]) {
  const rankCounts: { [key: string]: number } = {};
  const suitCounts: { [key: string]: number } = {};

  cards.forEach((card) => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
  });

  const isFlush = Object.values(suitCounts).some((count) => count === 5);
  const isStraight = checkStraight(rankCounts);

  const pairs: string[] = [];
  let threeOfAKind: string | null = null;
  let fourOfAKind: string | null = null;

  for (const [rank, count] of Object.entries(rankCounts)) {
    if (count === 2) pairs.push(rank);
    else if (count === 3) threeOfAKind = rank;
    else if (count === 4) fourOfAKind = rank;
  }

  const hasRoyalFlushRanks = ["10", "J", "Q", "K", "A"].every((rank) => rankCounts[rank]);

  let handRank = "";
  let multiplier = 0;
  let winningCards: Card[] = [];

  if (isFlush && hasRoyalFlushRanks) {
    handRank = "royal_flush";
    multiplier = 800;
    winningCards = cards;
  } else if (isFlush && isStraight) {
    handRank = "straight_flush";
    multiplier = 60;
    winningCards = cards;
  } else if (fourOfAKind) {
    handRank = "4_of_a_kind";
    multiplier = 22;
    winningCards = cards.filter((card) => card.rank === fourOfAKind);
  } else if (threeOfAKind && pairs.length > 0) {
    handRank = "full_house";
    multiplier = 9;
    winningCards = cards.filter((card) => card.rank === threeOfAKind || card.rank === pairs[0]);
  } else if (isFlush) {
    handRank = "flush";
    multiplier = 6;
    winningCards = cards;
  } else if (isStraight) {
    handRank = "straight";
    multiplier = 4;
    winningCards = cards;
  } else if (threeOfAKind) {
    handRank = "3_of_a_kind";
    multiplier = 3;
    winningCards = cards.filter((card) => card.rank === threeOfAKind);
  } else if (pairs.length === 2) {
    handRank = "2_pair";
    multiplier = 2;
    winningCards = cards.filter((card) => pairs.includes(card.rank));
  } else if (pairs.length === 1) {
    const pairRank = rankOrder(pairs[0]);
    if (pairRank >= rankOrder("J")) {
      handRank = "pair";
      multiplier = 1;
      winningCards = cards.filter((card) => card.rank === pairs[0]);
    }
  }

  return {
    handRank,
    won: multiplier > 0,
    payout: multiplier,
    winningCards,
  };
}

function checkStraight(rankCounts: { [key: string]: number }): boolean {
  const sortedRanks = Object.keys(rankCounts)
    .map((rank) => rankOrder(rank))
    .sort((a, b) => a - b);

  if (sortedRanks.length !== 5) return false;

  const isRegularStraight =
    sortedRanks[4] - sortedRanks[0] === 4 &&
    sortedRanks.every((rank, index) => {
      if (index === 0) return true;
      return rank === sortedRanks[index - 1] + 1;
    });

  const isAceLowStraight = sortedRanks[4] === 14 && sortedRanks[0] === 2 && sortedRanks[1] === 3 && sortedRanks[2] === 4 && sortedRanks[3] === 5;

  return isRegularStraight || isAceLowStraight;
}

function rankOrder(rank: string): number {
  const order: { [key: string]: number } = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };
  return order[rank] || 2;
}
