import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts";
import { Pool, Swap, Mint, Burn } from "../../generated/schema";
import {
  Swap as SwapEvent,
  Mint as MintEvent,
  Burn as BurnEvent,
} from "../../generated/templates/UniswapV3Pool/UniswapV3Pool";
import { updatePoolTotalLiquidity } from "../helpers/factoryHelper";
import { updatePoolTransferCount } from "../helpers/tokenHelper";

// Event handler function for Mint events
export function handleMint(event: MintEvent): void {
  // Retrieve the pool ID from the event
  let poolId = event.address.toHex();

  // Load the pool entity using the pool ID
  let pool = Pool.load(poolId);
  if (pool === null) {
    return;
  }

  // Create a new Mint entity using a unique ID composed of transaction hash and log index
  let mint = new Mint(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );

  mint.pool = poolId; // Set the pool reference in the Mint entity
  mint.sender = event.params.sender; // Set the sender of the Mint event
  mint.recipient = Bytes.empty(); // Set the recipient of the Mint event
  mint.tickLower = event.params.tickLower; // Set the lower tick range for the Mint event
  mint.tickUpper = event.params.tickUpper; // Set the upper tick range for the Mint event
  mint.amount = event.params.amount; // Set the amount of tokens minted
  mint.amount0 = event.params.amount0; // Set the amount of token0 minted
  mint.amount1 = event.params.amount1; // Set the amount of token1 minted
  mint.timestamp = event.block.timestamp; // Set the timestamp of the Mint event
  // Save the Mint entity to the store
  mint.save();

  // Update the pool's total liquidity with the minted amount
  updatePoolTotalLiquidity(
    poolId,
    event.params.amount0,
    event.params.amount1,
    BigInt.zero(),
    BigInt.zero(),
    event.transaction.hash,
    Bytes.empty(),
    Bytes.empty()
  );

  // Update transfer counts for token0 and token1
  // Convert Bytes to Address before calling updatePoolTransferCount
  updatePoolTransferCount(poolId, Address.fromBytes(pool.token0));
  updatePoolTransferCount(poolId, Address.fromBytes(pool.token1));

  // Update token-specific mint counts
  if (pool.token0.equals(event.params.sender)) {
    pool.token0MintCount = pool.token0MintCount.plus(BigInt.fromI32(1));
  }
  if (pool.token1.equals(event.params.sender)) {
    pool.token1MintCount = pool.token1MintCount.plus(BigInt.fromI32(1));
  }
  pool.save();
}

// Event handler function for Burn events
export function handleBurn(event: BurnEvent): void {
  // Retrieve the pool ID from the event
  let poolId = event.address.toHexString();

  // Load the pool entity using the pool ID
  let pool = Pool.load(poolId);
  if (pool === null) {
    return;
  }

  // Create a new Burn entity using a unique ID composed of transaction hash and log index
  let burn = new Burn(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );

  burn.pool = poolId; // Set the pool reference in the Burn entity
  burn.sender = event.params.owner; // Set the sender of the Burn event
  burn.tickLower = event.params.tickLower; // Set the lower tick range for the Burn event
  burn.tickUpper = event.params.tickUpper; // Set the upper tick range for the Burn event
  burn.amount = event.params.amount; // Set the amount of tokens burned
  burn.amount0 = event.params.amount0; // Set the amount of token0 burned
  burn.amount1 = event.params.amount1; // Set the amount of token1 burned
  burn.timestamp = event.block.timestamp; // Set the timestamp of the Burn event

  burn.save(); // Save the Burn entity to the store

  // Update the pool's total liquidity with the burned amount
  updatePoolTotalLiquidity(
    poolId,
    BigInt.zero(),
    BigInt.zero(),
    event.params.amount0,
    event.params.amount1,
    Bytes.empty(),
    event.transaction.hash,
    Bytes.empty()
  );

  // Update transfer counts for token0 and token1
  // Convert Bytes to Address before calling updatePoolTransferCount
  updatePoolTransferCount(poolId, Address.fromBytes(pool.token0));
  updatePoolTransferCount(poolId, Address.fromBytes(pool.token1));
  // Update token-specific burn counts
  if (pool.token0.equals(event.params.owner)) {
    pool.token0BurnCount = pool.token0BurnCount.plus(BigInt.fromI32(1));
  }
  if (pool.token1.equals(event.params.owner)) {
    pool.token1BurnCount = pool.token1BurnCount.plus(BigInt.fromI32(1));
  }
  pool.save();
}

// Event handler function for Swap events
export function handleSwap(event: SwapEvent): void {
  // Load the pool entity using the address of the pool as the unique ID
  let poolId = event.address.toHex(); // Convert the pool address to a hexadecimal string
  let pool = Pool.load(poolId); // Load the pool entity from the store
  if (pool === null) {
    // If the pool does not exist, exit the function
    return;
  }

  // Create a new Swap entity to store details of the swap event
  let swap = new Swap(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  ); // Unique ID for the swap entity
  swap.pool = poolId; // Link the swap to the pool
  swap.sender = event.params.sender; // Address of the sender
  swap.recipient = event.params.recipient; // Address of the recipient

  // Determine if the amounts are incoming or outgoing
  swap.amount0In = event.params.amount0.gt(BigInt.zero())
    ? event.params.amount0
    : BigInt.zero(); // Set amount0In if positive
  swap.amount1In = event.params.amount1.gt(BigInt.zero())
    ? event.params.amount1
    : BigInt.zero(); // Set amount1In if positive
  swap.amount0Out = event.params.amount0.lt(BigInt.zero())
    ? event.params.amount0.neg()
    : BigInt.zero(); // Set amount0Out if negative (converted to positive)
  swap.amount1Out = event.params.amount1.lt(BigInt.zero())
    ? event.params.amount1.neg()
    : BigInt.zero(); // Set amount1Out if negative (converted to positive)

  swap.timestamp = event.block.timestamp; // Record the timestamp of the swap event
  swap.save(); // Save the Swap entity to the store

  // Update the total liquidity of the pool
  updatePoolTotalLiquidity(
    poolId,
    swap.amount0In, // Amount of token0 added to the pool
    swap.amount1In, // Amount of token1 added to the pool
    swap.amount0Out, // Amount of token0 removed from the pool
    swap.amount1Out, // Amount of token1 removed from the pool
    Bytes.empty(), // Placeholder for isMint (not used here)
    Bytes.empty(), // Placeholder for isBurn (not used here)
    event.transaction.hash // Transaction hash for reference
  );

  // Update transfer counts for token0 and token1
  // Convert Bytes to Address before calling updatePoolTransferCount
  updatePoolTransferCount(poolId, Address.fromBytes(pool.token0));
  updatePoolTransferCount(poolId, Address.fromBytes(pool.token1));

  // Update the swap counts for tokens in the pool
  if (pool.token0.equals(event.params.sender)) {
    pool.token0SwapCount = pool.token0SwapCount.plus(BigInt.fromI32(1)); // Increment the count for token0 swaps
  }
  if (pool.token1.equals(event.params.sender)) {
    pool.token1SwapCount = pool.token1SwapCount.plus(BigInt.fromI32(1)); // Increment the count for token1 swaps
  }

  pool.save(); // Save the updated Pool entity to the store
}
