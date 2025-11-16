module casino::slide_game;

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
const EGameNotStarted: u64 = 1;

// Game states
const STATE_WAITING: u8 = 0;
const STATE_BETTING: u8 = 1;
const STATE_PLAYING: u8 = 2;

/// Shared game round
public struct SlideRound has key {
    id: UID,
    round_id: u64,
    status: u8,
    result_multiplier: u64,
    result_numbers: vector<u64>,
    treasury: Balance<OCT>,
}

/// Player bet (owned by player)
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

public struct RoundStarted has copy, drop {
    round_id: u64,
}

public struct BettingPhase has copy, drop {
    round_id: u64,
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

// ===== Init =====

fun init(ctx: &mut TxContext) {
    let admin_cap = AdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(admin_cap, ctx.sender());
    
    // Create initial round
    let round = SlideRound {
        id: object::new(ctx),
        round_id: 1,
        status: STATE_WAITING,
        result_multiplier: 0,
        result_numbers: vector::empty(),
        treasury: balance::zero(),
    };
    transfer::share_object(round);
}

// ===== Admin Functions =====

/// Start betting phase
public entry fun start_betting(
    _admin: &AdminCap,
    round: &mut SlideRound,
) {
    assert!(round.status == STATE_WAITING, EInvalidGameState);
    round.status = STATE_BETTING;
    
    event::emit(BettingPhase {
        round_id: round.round_id,
    });
}

/// Start playing phase with result
public entry fun start_playing(
    _admin: &AdminCap,
    round: &mut SlideRound,
    result_multiplier: u64,
    result_numbers: vector<u64>,
) {
    assert!(round.status == STATE_BETTING, EInvalidGameState);
    
    round.status = STATE_PLAYING;
    round.result_multiplier = result_multiplier;
    round.result_numbers = result_numbers;
    
    event::emit(RoundPlaying {
        round_id: round.round_id,
        result_multiplier,
    });
}

/// Create new round
public entry fun create_new_round(
    _admin: &AdminCap,
    old_round: &mut SlideRound,
    ctx: &mut TxContext
) {
    assert!(old_round.status == STATE_PLAYING, EInvalidGameState);
    
    let new_round = SlideRound {
        id: object::new(ctx),
        round_id: old_round.round_id + 1,
        status: STATE_WAITING,
        result_multiplier: 0,
        result_numbers: vector::empty(),
        treasury: balance::zero(),
    };
    
    event::emit(RoundStarted {
        round_id: new_round.round_id,
    });
    
    transfer::share_object(new_round);
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
    
    let bet_amount = coin::value(&payment);
    let player = ctx.sender();
    
    // Add payment to treasury
    let payment_balance = coin::into_balance(payment);
    balance::join(&mut round.treasury, payment_balance);
    
    // Create bet
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
    assert!(round.status == STATE_PLAYING, EGameNotStarted);
    assert!(bet.round_id == round.round_id, EInvalidGameState);
    assert!(!bet.won, EInvalidGameState);
    
    // Check if bet won
    if (round.result_multiplier >= bet.target_multiplier) {
        let payout = (bet.bet_amount * bet.target_multiplier) / 100;
        
        // Transfer payout
        let payout_balance = balance::split(&mut round.treasury, payout);
        let payout_coin = coin::from_balance(payout_balance, ctx);
        transfer::public_transfer(payout_coin, bet.player);
        
        bet.won = true;
        bet.payout = payout;
        
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

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
