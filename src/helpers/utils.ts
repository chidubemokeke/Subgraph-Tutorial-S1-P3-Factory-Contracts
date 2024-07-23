import { BigInt } from "@graphprotocol/graph-ts";
import { Pool, Swap, Mint, Burn } from "../../generated/schema";
import {
  PoolCreated as PoolCreatedEvent,
  Swap as SwapEvent,
  Mint as MintEvent,
  Burn as BurnEvent,
} from "../../generated/schema";
import { updatePoolTotalLiquidity } from "./logic";

export function handleMint(event: MintEvent): void {
  let poolId = event.pool;
  let pool = Pool.load(poolId);

  if (!pool) {
    return; // Pool not found, exit the function
  }

  // Create a new Mint entity
  let mint = new Mint(event.timestamp + "-" + event.id);
  mint.pool = pool.id;
  mint.sender = event.sender;
  mint.recipient = event.recipient;
  mint.tickLower = event.tickLower;
  mint.tickUpper = event.tickUpper;
  mint.amount = event.amount ?? BigInt.zero(); // Use default value if null
  mint.amount0 = event.amount0 ?? BigInt.zero(); // Use default value if null
  mint.amount1 = event.amount1 ?? BigInt.zero(); // Use default value if null
  mint.timestamp = event.timestamp;

  mint.save();

  // Update pool liquidity for mint
  updatePoolTotalLiquidity(poolId, mint.amount, true);
}

export function handleSwap(event: SwapEvent): void {
  let poolId = event.pool;
  let pool = Pool.load(poolId);

  if (!pool) {
    return; // Pool not found, exit the function
  }

  // Create a new Swap entity
  let swap = new Swap(event.timestamp + "-" + event.id);
  swap.pool = pool.id;
  swap.sender = event.sender;
  swap.recipient = event.recipient;
  swap.amount0In = event.amount0In ?? BigInt.zero(); // Use default value if null
  swap.amount1In = event.amount1In ?? BigInt.zero(); // Use default value if null
  swap.amount0Out = event.amount0Out ?? BigInt.zero(); // Use default value if null
  swap.amount1Out = event.amount1Out ?? BigInt.zero(); // Use default value if null
  swap.timestamp = event.timestamp;

  swap.save();

  // Update pool liquidity for swap
  let totalAmount = swap.amount0In.plus(swap.amount1In);
  updatePoolTotalLiquidity(poolId, totalAmount, false, true);
}

export function handleBurn(event: BurnEvent): void {
  let poolId = event.pool;
  let pool = Pool.load(poolId);

  if (!pool) {
    return; // Pool not found, exit the function
  }

  // Create a new Burn entity
  let burn = new Burn(event.timestamp + "-" + event.id);
  burn.pool = pool.id;
  burn.sender = event.sender;
  burn.tickLower = event.tickLower;
  burn.tickUpper = event.tickUpper;
  burn.amount = event.amount ?? BigInt.zero(); // Use default value if null
  burn.amount0 = event.amount0 ?? BigInt.zero(); // Use default value if null
  burn.amount1 = event.amount1 ?? BigInt.zero(); // Use default value if null
  burn.timestamp = event.timestamp;

  burn.save();

  // Update pool liquidity for burn
  updatePoolTotalLiquidity(poolId, burn.amount, false);
}
