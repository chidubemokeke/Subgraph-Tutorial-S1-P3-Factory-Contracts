import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Pool, Swap, Mint, Burn } from "../../generated/schema";
import {
  Swap as SwapEvent,
  Mint as MintEvent,
  Burn as BurnEvent,
} from "../../generated/templates/UniswapV3Pool/UniswapV3Pool";
import { updatePoolTotalLiquidity } from "./factoryHelper";

// Define constants for event types
/**const MINT_EVENT = Bytes.fromHexString("");
const SWAP_EVENT = Bytes.fromHexString("");
const BURN_EVENT = Bytes.fromHexString("");**/

// Event handler function for Mint events
export function handleMint(event: MintEvent): void {
  // Retrieve the pool ID from the event
  let poolId = event.address.toHex();

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
  mint.save();

  updatePoolTotalLiquidity(poolId, event.params.amount, event.transaction.hash);
}

// Event handler function for Burn events
export function handleBurn(event: BurnEvent): void {
  // Retrieve the pool ID from the event
  let poolId = event.address.toHexString();

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

  burn.save();

  updatePoolTotalLiquidity(
    poolId,
    event.params.amount,
    Bytes.empty(),
    event.transaction.hash
  );
}

// Event handler function for Swap events
export function handleSwap(event: SwapEvent): void {
  // Retrieve the pool ID from the event
  let poolId = event.address.toHexString();

  // Create a new Swap entity using a unique ID composed of transaction hash and log index
  let swap = new Swap(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  swap.pool = poolId; // Set the pool reference in the Swap entity
  swap.sender = event.params.sender; // Set the sender of the Swap event
  swap.recipient = event.params.recipient; // Set the recipient of the Swap event
  swap.amount0In = event.params.amount0;
  swap.amount1In = event.params.amount1;
  swap.amount0Out = BigInt.zero(); // Set the amount of token0 output in the swap
  swap.amount1Out = BigInt.zero(); // Set the amount of token1 output in the swap
  swap.timestamp = event.block.timestamp; // Set the timestamp of the Swap event

  swap.save();

  updatePoolTotalLiquidity(
    poolId,
    event.params.amount0.plus(event.params.amount1),
    Bytes.empty(),
    Bytes.empty(),
    event.transaction.hash
  );
}
