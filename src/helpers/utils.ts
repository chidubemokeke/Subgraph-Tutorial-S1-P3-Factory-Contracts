import { BigInt } from "@graphprotocol/graph-ts"; // Import BigInt type from @graphprotocol/graph-ts package for handling large integers.
import { Pool, Swap, Mint, Burn } from "../../generated/schema"; // Import entity types for Pool, Swap, Mint, and Burn from the generated schema.
import {
  Swap as SwapEvent, // Import the Swap event schema to handle Swap events.
  Mint as MintEvent, // Import the Mint event schema to handle Mint events.
  Burn as BurnEvent, // Import the Burn event schema to handle Burn events.
} from "../../generated/schema"; // Import these event schemas from the generated schema file.
import { createPoolEntity, updatePoolTotalLiquidity } from "./logic"; // Import utility functions for creating Pool entities and updating pool liquidity.

// Event handler function for Mint events
export function handleMint(event: MintEvent): void {
  // Retrieve the pool ID from the event
  let poolId = event.pool;

  // Load the Pool entity from the store using the pool ID
  let pool = Pool.load(poolId);

  // Check if the Pool entity was found
  if (!pool) {
    return; // If the Pool entity is not found, exit the function
  }

  // Create a new Mint entity using a unique ID composed of timestamp and event ID
  let mint = new Mint(event.timestamp + "-" + event.id);
  mint.pool = pool.id; // Set the pool reference in the Mint entity
  mint.sender = event.sender; // Set the sender of the Mint event
  mint.recipient = event.recipient; // Set the recipient of the Mint event
  mint.tickLower = event.tickLower; // Set the lower tick range for the Mint event
  mint.tickUpper = event.tickUpper; // Set the upper tick range for the Mint event
  mint.amount = event.amount ?? BigInt.zero(); // Set the amount of tokens minted, defaulting to zero if null
  mint.amount0 = event.amount0 ?? BigInt.zero(); // Set the amount of token0 minted, defaulting to zero if null
  mint.amount1 = event.amount1 ?? BigInt.zero(); // Set the amount of token1 minted, defaulting to zero if null
  mint.timestamp = event.timestamp; // Set the timestamp of the Mint event

  // Save the Mint entity to the store
  mint.save();

  // Update the pool's total liquidity with the minted amount
  updatePoolTotalLiquidity(poolId, mint.amount, true); // Pass `true` to indicate that this is a mint event
}

// Event handler function for Swap events
export function handleSwap(event: SwapEvent): void {
  // Retrieve the pool ID from the event
  let poolId = event.pool; // Adjust if needed to get the pool ID

  // Load the Pool entity from the store using the pool ID
  let pool = Pool.load(poolId);

  // Check if the Pool entity was found
  if (!pool) {
    return; // If the Pool entity is not found, exit the function
  }

  // Create a new Swap entity using a unique ID composed of timestamp and event ID
  let swap = new Swap(event.timestamp + "-" + event.id);
  swap.pool = pool.id; // Set the pool reference in the Swap entity
  swap.sender = event.sender; // Set the sender of the Swap event
  swap.recipient = event.recipient; // Set the recipient of the Swap event
  swap.amount0In = event.amount0In ?? BigInt.zero(); // Set the amount of token0 input in the swap, defaulting to zero if null
  swap.amount1In = event.amount1In ?? BigInt.zero(); // Set the amount of token1 input in the swap, defaulting to zero if null
  swap.amount0Out = event.amount0Out ?? BigInt.zero(); // Set the amount of token0 output in the swap, defaulting to zero if null
  swap.amount1Out = event.amount1Out ?? BigInt.zero(); // Set the amount of token1 output in the swap, defaulting to zero if null
  swap.timestamp = event.timestamp; // Set the timestamp of the Swap event

  // Save the Swap entity to the store
  swap.save();

  // Calculate the total amount of tokens involved in the swap
  let totalAmount = swap.amount0In.plus(swap.amount1In);

  // Update the pool's total liquidity with the total swap amount
  updatePoolTotalLiquidity(poolId, totalAmount, false, true); // Pass `false` for mint and `true` for swap
}

// Event handler function for Burn events
export function handleBurn(event: BurnEvent): void {
  // Retrieve the pool ID from the event
  let poolId = event.pool; // Adjust if needed to get the pool ID

  // Load the Pool entity from the store using the pool ID
  let pool = Pool.load(poolId);

  // Check if the Pool entity was found
  if (!pool) {
    return; // If the Pool entity is not found, exit the function
  }

  // Create a new Burn entity using a unique ID composed of timestamp and event ID
  let burn = new Burn(event.timestamp + "-" + event.id);
  burn.pool = pool.id; // Set the pool reference in the Burn entity
  burn.sender = event.sender; // Set the sender of the Burn event
  burn.tickLower = event.tickLower; // Set the lower tick range for the Burn event
  burn.tickUpper = event.tickUpper; // Set the upper tick range for the Burn event
  burn.amount = event.amount ?? BigInt.zero(); // Set the amount of tokens burned, defaulting to zero if null
  burn.amount0 = event.amount0 ?? BigInt.zero(); // Set the amount of token0 burned, defaulting to zero if null
  burn.amount1 = event.amount1 ?? BigInt.zero(); // Set the amount of token1 burned, defaulting to zero if null
  burn.timestamp = event.timestamp; // Set the timestamp of the Burn event

  // Save the Burn entity to the store
  burn.save();

  // Update the pool's total liquidity with the burned amount
  updatePoolTotalLiquidity(poolId, burn.amount, false); // Pass `false` for mint
}
