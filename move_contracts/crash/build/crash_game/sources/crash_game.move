module casino::crash_game;

use one::object::{Self, UID};
use one::transfer;
use one::tx_context::{Self, TxContext};
use one::coin::{Self, Coin};
use one::oct::OCT;
use one::event;
use one::clock::{Self, Clock};
use one::balance::{Self, Balance};

// Error codes
const EInvalidGameState: u64 = 0;
const EAlreadyCashedOut: u64 = 1;
const EGameNotStarted: u64 = 2;
const EGameCrashed: u64 = 3;
const EInsufficientFunds: u64 = 4;

// Game states
const STATE_BETTING: u8 = 1;
const STATE_FLYING: u8 = 2;
const STATE_CRASHED: u8 = 3;

/// Treasury pool (shared)
public struct GamePool has key {
    id: UID,
    balance: Balance<OCT>,
    total_wagered: u64,
    total_won: u64,
}

/// Individual player game session (owned by player)
public struct PlayerGame has key, store {
    id: UID,
    player: address,
    bet_amount: u64,
    start_time: u64,
    crash_point: u64,
    status: u8,
    final_multiplier: u64,
    payout: u64,
}

// ===== Events =====

public struct PoolCreated has copy, drop {
    pool_id: address,
}

public struct BetPlaced has copy, drop {
    player: address,
    game_id: address,
    amount: u64,
    crash_point: u64,
    timestamp: u64,
}

public struct GameStarted has copy, drop {
    player: address,
    game_id: address,
    timestamp: u64,
}

public struct PlayerCashedOut has copy, drop {
    player: address,
    game_id: address,
    multiplier: u64,
    payout: u64,
    timestamp: u64,
}

public struct GameCrashed has copy, drop {
    player: address,
    game_id: address,
    crash_point: u64,
    timestamp: u64,
}

// ===== Init Function =====

fun init(ctx: &mut TxContext) {
    // Create shared game pool
    let pool = GamePool {
        id: object::new(ctx),
        balance: balance::zero(),
        total_wagered: 0,
        total_won: 0,
    };
    
    let pool_addr = object::uid_to_address(&pool.id);
    
    event::emit(PoolCreated {
        pool_id: pool_addr,
    });
    
    transfer::share_object(pool);
}

// ===== Player Functions =====

/// Place bet and create game session
public entry fun place_bet(
    pool: &mut GamePool,
    payment: Coin<OCT>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let amount = coin::value(&payment);
    let player = tx_context::sender(ctx);
    let timestamp = clock::timestamp_ms(clock);
    
    // Generate pseudo-random crash point (1.01x to 10.00x)
    // Using timestamp for randomness
    let random_seed = timestamp % 10000;
    let crash_point = 101 + (random_seed % 900); // 101 to 1000 (1.01x to 10.00x)
    
    // Add payment to pool
    let payment_balance = coin::into_balance(payment);
    balance::join(&mut pool.balance, payment_balance);
    pool.total_wagered = pool.total_wagered + amount;
    
    // Create player game session
    let game = PlayerGame {
        id: object::new(ctx),
        player,
        bet_amount: amount,
        start_time: timestamp,
        crash_point,
        status: STATE_BETTING,
        final_multiplier: 0,
        payout: 0,
    };
    
    let game_addr = object::uid_to_address(&game.id);
    
    event::emit(BetPlaced {
        player,
        game_id: game_addr,
        amount,
        crash_point,
        timestamp,
    });
    
    transfer::transfer(game, player);
}

// Note: start_flying is now client-side only, no blockchain transaction needed

/// Cash out (player lands the plane)
public entry fun cashout(
    pool: &mut GamePool,
    game: &mut PlayerGame,
    current_multiplier: u64,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(game.status == STATE_FLYING, EGameNotStarted);
    assert!(current_multiplier < game.crash_point, EGameCrashed);
    
    // Calculate payout
    let payout = (game.bet_amount * current_multiplier) / 100;
    
    // Check pool has enough
    assert!(balance::value(&pool.balance) >= payout, EInsufficientFunds);
    
    // Update game state
    game.status = STATE_CRASHED;
    game.final_multiplier = current_multiplier;
    game.payout = payout;
    
    // Update pool stats
    pool.total_won = pool.total_won + payout;
    
    // Transfer payout to player
    let payout_balance = balance::split(&mut pool.balance, payout);
    let payout_coin = coin::from_balance(payout_balance, ctx);
    transfer::public_transfer(payout_coin, game.player);
    
    let game_addr = object::uid_to_address(&game.id);
    
    event::emit(PlayerCashedOut {
        player: game.player,
        game_id: game_addr,
        multiplier: current_multiplier,
        payout,
        timestamp: clock::timestamp_ms(clock),
    });
}

/// Game crashed (player didn't cash out in time)
public entry fun game_crashed(
    game: &mut PlayerGame,
    clock: &Clock,
) {
    assert!(game.status == STATE_FLYING, EGameNotStarted);
    
    game.status = STATE_CRASHED;
    game.final_multiplier = game.crash_point;
    game.payout = 0;
    
    let game_addr = object::uid_to_address(&game.id);
    
    event::emit(GameCrashed {
        player: game.player,
        game_id: game_addr,
        crash_point: game.crash_point,
        timestamp: clock::timestamp_ms(clock),
    });
}

// ===== Admin Functions =====

/// Fund the pool (anyone can add funds)
public entry fun fund_pool(
    pool: &mut GamePool,
    payment: Coin<OCT>,
) {
    let payment_balance = coin::into_balance(payment);
    balance::join(&mut pool.balance, payment_balance);
}

// ===== View Functions =====

public fun get_game_status(game: &PlayerGame): u8 {
    game.status
}

public fun get_crash_point(game: &PlayerGame): u64 {
    game.crash_point
}

public fun get_bet_amount(game: &PlayerGame): u64 {
    game.bet_amount
}

public fun get_pool_balance(pool: &GamePool): u64 {
    balance::value(&pool.balance)
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
