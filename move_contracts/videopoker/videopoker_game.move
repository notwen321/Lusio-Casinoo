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
const EInvalidHoldIndex: u64 = 1;

// Game states
const STATE_INITIAL_DEAL: u8 = 0;
const STATE_HOLD_PHASE: u8 = 1;
const STATE_FINAL_DRAW: u8 = 2;
const STATE_COMPLETE: u8 = 3;

/// Card structure (rank: 0-12, suit: 0-3)
public struct Card has store, copy, drop {
    rank: u8,  // 0=2, 1=3, ..., 8=10, 9=J, 10=Q, 11=K, 12=A
    suit: u8,  // 0=Hearts, 1=Diamonds, 2=Clubs, 3=Spades
}

/// Active poker game (owned by player)
public struct PokerGame has key, store {
    id: UID,
    player: address,
    bet_amount: u64,
    hand: vector<Card>,
    hold_indices: vector<u8>,
    deck_seed: vector<u8>, // For provably fair card dealing
    status: u8,
}

/// Treasury
public struct PokerTreasury has key {
    id: UID,
    balance: Balance<OCT>,
}

// ===== Events =====

public struct GameStarted has copy, drop {
    game_id: address,
    player: address,
    bet_amount: u64,
}

public struct CardsDealt has copy, drop {
    game_id: address,
    player: address,
}

public struct CardsHeld has copy, drop {
    game_id: address,
    player: address,
    hold_indices: vector<u8>,
}

public struct FinalDraw has copy, drop {
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

/// Start a new poker game
public entry fun start_game(
    treasury: &mut PokerTreasury,
    payment: Coin<OCT>,
    deck_seed: vector<u8>,
    initial_hand: vector<Card>,
    ctx: &mut TxContext
) {
    let bet_amount = coin::value(&payment);
    let player = ctx.sender();
    
    // Add payment to treasury
    let payment_balance = coin::into_balance(payment);
    balance::join(&mut treasury.balance, payment_balance);
    
    // Create game
    let game = PokerGame {
        id: object::new(ctx),
        player,
        bet_amount,
        hand: initial_hand,
        hold_indices: vector::empty(),
        deck_seed,
        status: STATE_HOLD_PHASE,
    };
    
    let game_id = object::uid_to_address(&game.id);
    
    event::emit(GameStarted {
        game_id,
        player,
        bet_amount,
    });
    
    event::emit(CardsDealt {
        game_id,
        player,
    });
    
    transfer::transfer(game, player);
}

/// Hold cards and draw new ones
public entry fun draw_cards(
    treasury: &mut PokerTreasury,
    game: &mut PokerGame,
    hold_indices: vector<u8>,
    new_cards: vector<Card>,
    ctx: &mut TxContext
) {
    assert!(game.status == STATE_HOLD_PHASE, EInvalidGameState);
    
    game.hold_indices = hold_indices;
    game.status = STATE_FINAL_DRAW;
    
    let game_id = object::uid_to_address(&game.id);
    
    event::emit(CardsHeld {
        game_id,
        player: game.player,
        hold_indices,
    });
    
    // Replace non-held cards
    let i = 0;
    let new_card_index = 0;
    while (i < 5) {
        if (!vector::contains(&hold_indices, &(i as u8))) {
            let new_card = *vector::borrow(&new_cards, new_card_index);
            *vector::borrow_mut(&mut game.hand, i) = new_card;
            new_card_index = new_card_index + 1;
        };
        i = i + 1;
    };
    
    // Evaluate hand and payout
    let hand_rank = evaluate_hand(&game.hand);
    let multiplier = get_payout_multiplier(hand_rank);
    let payout = game.bet_amount * multiplier;
    
    if (payout > 0) {
        let payout_balance = balance::split(&mut treasury.balance, payout);
        let payout_coin = coin::from_balance(payout_balance, ctx);
        transfer::public_transfer(payout_coin, game.player);
    };
    
    game.status = STATE_COMPLETE;
    
    event::emit(FinalDraw {
        game_id,
        player: game.player,
        hand_rank,
        payout,
    });
}

// ===== Helper Functions =====

fun evaluate_hand(hand: &vector<Card>): u8 {
    // Simplified hand evaluation
    // 0=Nothing, 1=Pair, 2=TwoPair, 3=ThreeKind, 4=Straight, 
    // 5=Flush, 6=FullHouse, 7=FourKind, 8=StraightFlush, 9=RoyalFlush
    
    // This is a placeholder - real implementation would properly evaluate poker hands
    0
}

fun get_payout_multiplier(hand_rank: u8): u64 {
    if (hand_rank == 9) { 800 }      // Royal Flush
    else if (hand_rank == 8) { 60 }  // Straight Flush
    else if (hand_rank == 7) { 22 }  // Four of a Kind
    else if (hand_rank == 6) { 9 }   // Full House
    else if (hand_rank == 5) { 6 }   // Flush
    else if (hand_rank == 4) { 4 }   // Straight
    else if (hand_rank == 3) { 3 }   // Three of a Kind
    else if (hand_rank == 2) { 2 }   // Two Pair
    else if (hand_rank == 1) { 1 }   // Pair (Jacks or Better)
    else { 0 }
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
