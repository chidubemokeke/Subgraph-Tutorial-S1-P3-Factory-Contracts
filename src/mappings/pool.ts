import { BigInt, Address, Bytes } from "@graphprotocol/graph-ts";
import { PoolCreated, Pool, Swap, Mint, Burn } from "../../generated/schema";
import {
  PoolCreated as PoolCreatedEvent,
  Swap as SwapEvent,
  Mint as MintEvent,
  Burn as BurnEvent,
} from "../../generated/schema";
import { updatePoolTotalLiquidity } from "../helpers/logic";

// Event handler function for Mint event
export function handleMint(event: MintEvent): void {
  let poolId = event.pool;
  let amount = event.amount ? event.amount : BigInt.zero(); // Handle potential null value

  // Update pool liquidity for the mint event
  updatePoolTotalLiquidity(poolId, amount, true); // Handle mint
}
