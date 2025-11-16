module casino::mines_game;

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
const EInvalidPoint: u64 = 1;
const EAlreadyRevealed: u64 = 2;
const EGameNotActive: u64 = 3;

// Game states
const STATE_READY: u8 = 0;
const STATE_LIVE: u8 = 1;

/// Mine object types
const MINE_OBJECT_GEM: u8 = 0;
const MINE_OBJECT_BOMB: u8 = 1;

/// Active game session (owned by player)
public struct MineGame has key, store {
    id: UID,
    player: address,
    bet_amount: u64,
    mine_count: u8,
    revealed_points: vector<u8>,
    mine_positions: vector<u8>, // Hidden until game ends
    status: u8,
    current_multiplier: u64,
}

/// Treasury for holding bets
public struct MineTreasury has key {
    id: UID,
    balance: Balance<OCT>,
}

// ===== Events =====

public struct GameCreated has copy, drop {
    game_id: address,
    player: address,
    bet_amount: u64,
    mine_count: u8,
}

public struct TileRevealed has copy, drop {
    game_id: address,
    player: address,
    point: u8,
    is_mine: bool,
    multiplier: u64,
}

public struct GameCashedOut has copy, drop {
    game_id: address,
    player: address,
    payout: u64,
    multiplier: u64,
}

public struct GameEnded has copy, drop {
    game_id: address,
    player: address,
    hit_mine: bool,
    final_multiplier: u64,
}

// ===== Init =====

fun init(ctx: &mut TxContext) {
    let treasury = MineTreasury {
        id: object::new(ctx),
        balance: balance::zero(),
    };
    transfer::share_object(treasury);
}

// ===== Player Functions =====

/// Create a new mines game
public entry fun create_game(
    treasury: &mut MineTreasury,
    payment: Coin<OCT>,
    mine_count: u8,
    mine_positions: vector<u8>, // Pre-determined mine positions (hashed)
    ctx: &mut TxContext
) {
    let bet_amount = coin::value(&payment);
    let player = ctx.sender();
    
    // Add payment to treasury
    let payment_balance = coin::into_balance(payment);
    balance::join(&mut treasury.balance, payment_balance);
    
    // Create game
    let game = MineGame {
        id: object::new(ctx),
        player,
        bet_amount,
        mine_count,
        revealed_points: vector::empty(),
        mine_positions,
        status: STATE_LIVE,
        current_multiplier: 100, // 1.00x
    };
    
    let game_id = object::uid_to_address(&game.id);
    
    event::emit(GameCreated {
        game_id,
        player,
        bet_amount,
        mine_count,
    });
    
    transfer::transfer(game, player);
}

/// Reveal a tile
public entry fun reveal_tile(
    treasury: &mut MineTreasury,
    game: &mut MineGame,
    point: u8,
    ctx: &mut TxContext
) {
    assert!(game.status == STATE_LIVE, EGameNotActive);
    assert!(point < 25, EInvalidPoint);
    assert!(!vector::contains(&game.revealed_points, &point), EAlreadyRevealed);
    
    let is_mine = vector::contains(&game.mine_positions, &point);
    vector::push_back(&mut game.revealed_points, point);
    
    let game_id = object::uid_to_address(&game.id);
    
    if (is_mine) {
        // Hit a mine - game over
        game.status = STATE_READY;
        
        event::emit(TileRevealed {
            game_id,
            player: game.player,
            point,
            is_mine: true,
            multiplier: 0,
        });
        
        event::emit(GameEnded {
            game_id,
            player: game.player,
            hit_mine: true,
            final_multiplier: 0,
        });
    } else {
        // Safe tile - calculate new multiplier
        let safe_tiles = 25 - (game.mine_count as u64);
        let revealed_count = vector::length(&game.revealed_points);
        
        // Simple multiplier calculation
        game.current_multiplier = calculate_multiplier(
            game.mine_count,
            (revealed_count as u8)
        );
        
        event::emit(TileRevealed {
            game_id,
            player: game.player,
            point,
            is_mine: false,
            multiplier: game.current_multiplier,
        });
    };
}

/// Cash out current game
public entry fun cashout(
    treasury: &mut MineTreasury,
    game: &mut MineGame,
    ctx: &mut TxContext
) {
    assert!(game.status == STATE_LIVE, EGameNotActive);
    assert!(vector::length(&game.revealed_points) > 0, EInvalidGameState);
    
    // Calculate payout
    let payout = (game.bet_amount * game.current_multiplier) / 100;
    
    // Transfer payout
    let payout_balance = balance::split(&mut treasury.balance, payout);
    let payout_coin = coin::from_balance(payout_balance, ctx);
    transfer::public_transfer(payout_coin, game.player);
    
    game.status = STATE_READY;
    
    let game_id = object::uid_to_address(&game.id);
    
    event::emit(GameCashedOut {
        game_id,
        player: game.player,
        payout,
        multiplier: game.current_multiplier,
    });
    
    event::emit(GameEnded {
        game_id,
        player: game.player,
        hit_mine: false,
        final_multiplier: game.current_multiplier,
    });
}

// ===== Helper Functions =====

fun calculate_multiplier(mines: u8, picks: u8): u64 {
    let total_slots = 25u64;
    let safe_slots = total_slots - (mines as u64);
    
    if (picks == 0) return 100;
    
    // Simplified multiplier calculation
    // Real implementation would use proper probability math
    let base = 100u64;
    let increment = (mines as u64) * 10;
    
    base + (increment * (picks as u64))
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
