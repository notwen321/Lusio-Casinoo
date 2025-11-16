module casino::videopoker_game;

use one::object::{Self, UID};
use one::transfer;
use one::tx_context::{Self, TxContext};
use one::coin::{Self, Coin};
use one::oct::OCT;
use one::event;
use one::balance::{Self, Balance};
use std::vector;

// Error codes
const EInvalidGameState: u64 = 0;
const EInvalidHoldIndexes: u64 = 1;
const EInsufficientBalance: u64 = 2;

// Game states
const STATE_READY: u8 = 0;
const STATE_DEALT: u8 = 1;
const STATE_COMPLETE: u8 = 2;

// Hand ranks
const HAND_NONE: u8 = 0;
const HAND_PAIR: u8 = 1;           // 1x
const HAND_TWO_PAIR: u8 = 2;       // 2x
const HAND_THREE_KIND: u8 = 3;     // 3x
const HAND_STRAIGHT: u8 = 4;       // 4x
const HAND_FLUSH: u8 = 5;          // 6x
const HAND_FULL_HOUSE: u8 = 6;     // 9x
const HAND_FOUR_KIND: u8 = 7;      // 22x
const HAND_STRAIGHT_FLUSH: u8 = 8; // 60x
const HAND_ROYAL_FLUSH: u8 = 9;    // 800x

/// Poker game session (owned by player)
public struct PokerGame has key, store {
    id: UID,
    player: address,
    bet_amount: u64,
    cards: vector<u8>, // 5 cards (0-51)
    hold_indexes: vector<u8>,
    status: u8,
    hand_rank: u8,
    payout: u64,
}

/// Treasury for holding bets
public struct PokerTreasury has key {
    id: UID,
    balance: Balance<OCT>,
}

// ===== Events =====

public struct GameCreated has copy, drop {
    game_id: address,
    player: address,
    bet_amount: u64,
}

public struct CardsDealt has copy, drop {
    game_id: address,
    player: address,
    cards: vector<u8>,
}

public struct CardsDrew has copy, drop {
    game_id: address,
    player: address,
    new_cards: vector<u8>,
    hand_rank: u8,
    payout: u64,
}

public struct GameCompleted has copy, drop {
    game_id: address,
    player: address,
    hand_rank: u8,
    payout: u64,
}

// ===== Init =====

fun init(ctx: &mut TxContext) {
    let treasury = PokerTreasury {
        id: object::new(ctx),
        balance: balance::zero(),
    };
    transfer::share_object(treasury);
}

// ===== Player Functions =====

/// Deal initial cards
public entry fun deal_cards(
    treasury: &mut PokerTreasury,
    payment: Coin<OCT>,
    initial_cards: vector<u8>, // Pre-generated 5 cards
    ctx: &mut TxContext
) {
    let bet_amount = coin::value(&payment);
    let player = tx_context::sender(ctx);
    
    // Add payment to treasury
    let payment_balance = coin::into_balance(payment);
    balance::join(&mut treasury.balance, payment_balance);
    
    // Create game
    let game = PokerGame {
        id: object::new(ctx),
        player,
        bet_amount,
        cards: initial_cards,
        hold_indexes: vector::empty(),
        status: STATE_DEALT,
        hand_rank: HAND_NONE,
        payout: 0,
    };
    
    let game_id = object::uid_to_address(&game.id);
    
    event::emit(GameCreated {
        game_id,
        player,
        bet_amount,
    });
    
    event::emit(CardsDealt {
        game_id,
        player,
        cards: initial_cards,
    });
    
    transfer::transfer(game, player);
}

/// Draw new cards (replace non-held cards)
public entry fun draw_cards(
    treasury: &mut PokerTreasury,
    game: &mut PokerGame,
    hold_indexes: vector<u8>,
    new_cards: vector<u8>, // New cards for non-held positions
    ctx: &mut TxContext
) {
    assert!(game.status == STATE_DEALT, EInvalidGameState);
    assert!(vector::length(&hold_indexes) <= 5, EInvalidHoldIndexes);
    
    game.hold_indexes = hold_indexes;
    
    // Replace non-held cards
    let mut i = 0;
    let mut new_card_index = 0;
    while (i < 5) {
        if (!vector::contains(&hold_indexes, &(i as u8))) {
            let new_card = *vector::borrow(&new_cards, new_card_index);
            let card_ref = vector::borrow_mut(&mut game.cards, i);
            *card_ref = new_card;
            new_card_index = new_card_index + 1;
        };
        i = i + 1;
    };
    
    // Evaluate hand
    let hand_rank = evaluate_hand(&game.cards);
    game.hand_rank = hand_rank;
    game.status = STATE_COMPLETE;
    
    // Calculate payout
    let multiplier = get_hand_multiplier(hand_rank);
    let payout = (game.bet_amount * multiplier) / 100;
    game.payout = payout;
    
    let game_id = object::uid_to_address(&game.id);
    
    event::emit(CardsDrew {
        game_id,
        player: game.player,
        new_cards,
        hand_rank,
        payout,
    });
    
    // Transfer payout if won
    if (payout > 0) {
        assert!(balance::value(&treasury.balance) >= payout, EInsufficientBalance);
        
        let payout_balance = balance::split(&mut treasury.balance, payout);
        let payout_coin = coin::from_balance(payout_balance, ctx);
        transfer::public_transfer(payout_coin, game.player);
        
        event::emit(GameCompleted {
            game_id,
            player: game.player,
            hand_rank,
            payout,
        });
    };
}

// ===== Helper Functions =====

/// Evaluate poker hand (simplified)
fun evaluate_hand(cards: &vector<u8>): u8 {
    // This is a simplified version
    // In production, implement full poker hand evaluation
    
    let mut ranks = vector::empty<u8>();
    let mut suits = vector::empty<u8>();
    
    let mut i = 0;
    while (i < 5) {
        let card = *vector::borrow(cards, i);
        vector::push_back(&mut ranks, card % 13);
        vector::push_back(&mut suits, card / 13);
        i = i + 1;
    };
    
    // Check for flush (all same suit)
    let is_flush = check_flush(&suits);
    
    // Check for straight
    let is_straight = check_straight(&ranks);
    
    // Check for pairs, three of a kind, etc.
    let rank_counts = count_ranks(&ranks);
    
    // Royal Flush (A,K,Q,J,10 of same suit)
    if (is_flush && is_straight && has_royal_ranks(&ranks)) {
        return HAND_ROYAL_FLUSH
    };
    
    // Straight Flush
    if (is_flush && is_straight) {
        return HAND_STRAIGHT_FLUSH
    };
    
    // Four of a kind
    if (has_four_of_kind(&rank_counts)) {
        return HAND_FOUR_KIND
    };
    
    // Full House
    if (has_full_house(&rank_counts)) {
        return HAND_FULL_HOUSE
    };
    
    // Flush
    if (is_flush) {
        return HAND_FLUSH
    };
    
    // Straight
    if (is_straight) {
        return HAND_STRAIGHT
    };
    
    // Three of a kind
    if (has_three_of_kind(&rank_counts)) {
        return HAND_THREE_KIND
    };
    
    // Two pair
    if (has_two_pair(&rank_counts)) {
        return HAND_TWO_PAIR
    };
    
    // Pair (Jacks or better)
    if (has_high_pair(&rank_counts)) {
        return HAND_PAIR
    };
    
    HAND_NONE
}

fun check_flush(suits: &vector<u8>): bool {
    let first_suit = *vector::borrow(suits, 0);
    let mut i = 1;
    while (i < 5) {
        if (*vector::borrow(suits, i) != first_suit) {
            return false
        };
        i = i + 1;
    };
    true
}

fun check_straight(ranks: &vector<u8>): bool {
    // Simplified straight check
    // In production, implement proper sorting and checking
    true // Placeholder
}

fun count_ranks(ranks: &vector<u8>): vector<u8> {
    // Count occurrences of each rank
    let mut counts = vector::empty<u8>();
    let mut i = 0;
    while (i < 13) {
        vector::push_back(&mut counts, 0);
        i = i + 1;
    };
    
    i = 0;
    while (i < 5) {
        let rank = *vector::borrow(ranks, i);
        let count = vector::borrow_mut(&mut counts, (rank as u64));
        *count = *count + 1;
        i = i + 1;
    };
    
    counts
}

fun has_royal_ranks(ranks: &vector<u8>): bool {
    // Check for 10, J, Q, K, A
    true // Placeholder
}

fun has_four_of_kind(counts: &vector<u8>): bool {
    let mut i = 0;
    while (i < vector::length(counts)) {
        if (*vector::borrow(counts, i) == 4) {
            return true
        };
        i = i + 1;
    };
    false
}

fun has_full_house(counts: &vector<u8>): bool {
    let mut has_three = false;
    let mut has_two = false;
    
    let mut i = 0;
    while (i < vector::length(counts)) {
        let count = *vector::borrow(counts, i);
        if (count == 3) has_three = true;
        if (count == 2) has_two = true;
        i = i + 1;
    };
    
    has_three && has_two
}

fun has_three_of_kind(counts: &vector<u8>): bool {
    let mut i = 0;
    while (i < vector::length(counts)) {
        if (*vector::borrow(counts, i) == 3) {
            return true
        };
        i = i + 1;
    };
    false
}

fun has_two_pair(counts: &vector<u8>): bool {
    let mut pair_count = 0;
    let mut i = 0;
    while (i < vector::length(counts)) {
        if (*vector::borrow(counts, i) == 2) {
            pair_count = pair_count + 1;
        };
        i = i + 1;
    };
    pair_count >= 2
}

fun has_high_pair(counts: &vector<u8>): bool {
    // Check for pair of Jacks or better (ranks 10-12, 0=Ace)
    let mut i = 0;
    while (i < vector::length(counts)) {
        if (*vector::borrow(counts, i) == 2) {
            if (i == 0 || i >= 10) { // Ace or J,Q,K
                return true
            };
        };
        i = i + 1;
    };
    false
}

fun get_hand_multiplier(hand_rank: u8): u64 {
    if (hand_rank == HAND_ROYAL_FLUSH) return 80000; // 800x
    if (hand_rank == HAND_STRAIGHT_FLUSH) return 6000; // 60x
    if (hand_rank == HAND_FOUR_KIND) return 2200; // 22x
    if (hand_rank == HAND_FULL_HOUSE) return 900; // 9x
    if (hand_rank == HAND_FLUSH) return 600; // 6x
    if (hand_rank == HAND_STRAIGHT) return 400; // 4x
    if (hand_rank == HAND_THREE_KIND) return 300; // 3x
    if (hand_rank == HAND_TWO_PAIR) return 200; // 2x
    if (hand_rank == HAND_PAIR) return 100; // 1x
    0
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
