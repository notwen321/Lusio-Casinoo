module casino::slide_game;

use one::object::{Self, UID};
use one::transfer;
use one::tx_context::{Self, TxContext};
use one::coin::{Self, Coin};
use one::oct::OCT;
use one::event;
use one::clock::{Self, Clock};
use one::balance::{Self, Balance};
use std::vector;

// Error codes
const EInvalidGameState: u64 = 0;
const EBetAlreadyPlaced: u64 = 1;
const EInsufficientBalance: u64 = 2;
const EInvalidMultiplier: u64 = 3;

// Game states
const STATE_WAITING: u8 = 0;
const STATE_BETTING: u8 = 1;
const STATE_PLAYING: u8 = 2;

/// Round object (shared)
public struct SlideRound has key {
    id: UID,
    round_id: u64,
    status: u8,
    result_multiplier: u64,
    start_time: u64,
    treasury: Balance<OCT>,
    total_bets: u64,
}

/// Player bet object (owned by player)
public struct SlideBet has key, store {
    id: UID,
    round_id: u64,
    player: address,
    bet_amount: u64,
    target_multiplier: u64,
    won: bool,
    payout: u64,
}

/// Admin capability
public struct AdminCap has key, store {
    id: UID,
}

// ===== Events =====

public struct RoundCreated has copy, drop {
    round_id: u64,
    timestamp: u64,
}

public struct BettingPhase has copy, drop {
    round_id: u64,
    start_time: u64,
}

public struct RoundPlaying has copy, drop {
    round_id: u64,
    result_multiplier: u64,
}

public struct BetPlaced has copy, drop {
    round_id: u64,
    player: address,
    bet_amount: u64,
    target_multiplier: u64,
}

public struct BetResult has copy, drop {
    round_id: u64,
    player: address,
    won: bool,
    payout: u64,
}

// ===== Init Function =====

fun init(ctx: &mut TxContext) {
    // Create admin capability
    let admin_cap = AdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(admin_cap, tx_context::sender(ctx));
}

// ===== Admin Functions =====

/// Create a new round (admin only)
public entry fun create_round(
    _admin: &AdminCap,
    round_id: u64,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let round = SlideRound {
        id: object::new(ctx),
        round_id,
        status: STATE_WAITING,
        result_multiplier: 0,
        start_time: 0,
        treasury: balance::zero(),
        total_bets: 0,
    };
    
    event::emit(RoundCreated {
        round_id,
        timestamp: clock::timestamp_ms(clock),
    });
    
    transfer::share_object(round);
}

/// Start betting phase (admin only)
public entry fun start_betting(
    _admin: &AdminCap,
    round: &mut SlideRound,
    clock: &Clock,
) {
    assert!(round.status == STATE_WAITING, EInvalidGameState);
    
    round.status = STATE_BETTING;
    round.start_time = clock::timestamp_ms(clock);
    
    event::emit(BettingPhase {
        round_id: round.round_id,
        start_time: round.start_time,
    });
}

/// End round and set result (admin only)
public entry fun end_round(
    _admin: &AdminCap,
    round: &mut SlideRound,
    result_multiplier: u64,
) {
    assert!(round.status == STATE_BETTING, EInvalidGameState);
    
    round.status = STATE_PLAYING;
    round.result_multiplier = result_multiplier;
    
    event::emit(RoundPlaying {
        round_id: round.round_id,
        result_multiplier,
    });
}

/// Reset round for next game (admin only)
public entry fun reset_round(
    _admin: &AdminCap,
    round: &mut SlideRound,
) {
    round.status = STATE_WAITING;
    round.result_multiplier = 0;
    round.total_bets = 0;
}

// ===== Player Functions =====

/// Place a bet
public entry fun place_bet(
    round: &mut SlideRound,
    payment: Coin<OCT>,
    target_multiplier: u64,
    ctx: &mut TxContext
) {
    assert!(round.status == STATE_BETTING, EInvalidGameState);
    assert!(target_multiplier >= 101 && target_multiplier <= 10000, EInvalidMultiplier);
    
    let bet_amount = coin::value(&payment);
    let player = tx_context::sender(ctx);
    
    // Add payment to treasury
    let payment_balance = coin::into_balance(payment);
    balance::join(&mut round.treasury, payment_balance);
    round.total_bets = round.total_bets + bet_amount;
    
    // Create bet object
    let bet = SlideBet {
        id: object::new(ctx),
        round_id: round.round_id,
        player,
        bet_amount,
        target_multiplier,
        won: false,
        payout: 0,
    };
    
    event::emit(BetPlaced {
        round_id: round.round_id,
        player,
        bet_amount,
        target_multiplier,
    });
    
    transfer::transfer(bet, player);
}

/// Claim winnings
public entry fun claim_winnings(
    round: &mut SlideRound,
    bet: &mut SlideBet,
    ctx: &mut TxContext
) {
    assert!(round.status == STATE_PLAYING, EInvalidGameState);
    assert!(bet.round_id == round.round_id, EInvalidGameState);
    
    // Check if bet won
    let won = round.result_multiplier >= bet.target_multiplier;
    bet.won = won;
    
    if (won) {
        // Calculate payout
        let payout = (bet.bet_amount * bet.target_multiplier) / 100;
        
        // Check treasury has enough
        assert!(balance::value(&round.treasury) >= payout, EInsufficientBalance);
        
        bet.payout = payout;
        
        // Transfer payout to player
        let payout_balance = balance::split(&mut round.treasury, payout);
        let payout_coin = coin::from_balance(payout_balance, ctx);
        transfer::public_transfer(payout_coin, bet.player);
        
        event::emit(BetResult {
            round_id: round.round_id,
            player: bet.player,
            won: true,
            payout,
        });
    } else {
        event::emit(BetResult {
            round_id: round.round_id,
            player: bet.player,
            won: false,
            payout: 0,
        });
    };
}

// ===== View Functions =====

public fun get_round_status(round: &SlideRound): u8 {
    round.status
}

public fun get_result_multiplier(round: &SlideRound): u64 {
    round.result_multiplier
}

public fun get_treasury_balance(round: &SlideRound): u64 {
    balance::value(&round.treasury)
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
